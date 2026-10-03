import hashlib, secrets
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.core.security import (
    check_password_strength, create_access_token, create_refresh_token,
    decode_refresh_token, hash_password, verify_password,
)
from app.models.all import LoginSession, PasswordResetToken, User, Role
from app.utils.helpers import audit, notify


def _role_name(user: User) -> str:
    return user.role.name if user.role else ""


def register(db: Session, email: str, password: str, full_name: str = "", phone: str = "") -> User:
    ok, msg = check_password_strength(password)
    if not ok:
        raise HTTPException(400, msg)
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(400, "Email already registered")
    role = db.query(Role).filter(Role.name == "customer").first()
    u = User(email=email, password_hash=hash_password(password), full_name=full_name,
             phone=phone, role_id=role.id if role else None)
    db.add(u)
    db.flush()
    # Auto-create customer profile + realistic bank account (12-digit, unique)
    from app.models.all import Account, AccountType, Branch, Customer
    from app.utils.refs import gen_account_number
    parts = (full_name or email).strip().split()
    c = Customer(user_id=u.id, first_name=parts[0] if parts else email,
                 last_name=" ".join(parts[1:]) if len(parts) > 1 else "",
                 phone=phone, kyc_status="NOT_SUBMITTED")
    db.add(c)
    db.flush()
    sav = db.query(AccountType).filter(AccountType.code == "SAVINGS").first()
    branch = db.query(Branch).first()
    for _ in range(8):
        candidate = gen_account_number()
        if not db.query(Account).filter(Account.account_number == candidate).first():
            break
    else:
        raise HTTPException(500, "Could not generate unique account number")
    db.add(Account(account_number=candidate, customer_id=c.id,
                   account_type_id=sav.id if sav else None,
                   branch_id=branch.id if branch else None,
                   balance=0, status="ACTIVE"))
    audit(db, "REGISTER", user_id=u.id, entity="user", entity_id=str(u.id))
    db.commit()
    db.refresh(u)
    return u


def _find_user_by_identifier(db: Session, identifier: str):
    ident = (identifier or "").strip()
    user = db.query(User).filter(User.email == ident, User.is_deleted == False).first()  # noqa: E712
    if user:
        return user
    # Try account number -> customer -> user (digits only, ignore spaces)
    digits = "".join(ch for ch in ident if ch.isdigit())
    if len(digits) >= 8:
        from app.models.all import Account, Customer
        acc = db.query(Account).filter(Account.account_number == ident).first()
        if not acc and digits != ident:
            acc = db.query(Account).filter(Account.account_number == digits).first()
        if acc:
            cust = db.query(Customer).filter(Customer.id == acc.customer_id).first()
            if cust:
                return db.query(User).filter(User.id == cust.user_id, User.is_deleted == False).first()  # noqa: E712
    return None


def login(db: Session, identifier: str, password: str, ip: str = "", ua: str = "") -> dict:
    user = _find_user_by_identifier(db, identifier)
    now = datetime.now(timezone.utc)
    if user and user.locked_until and user.locked_until.tzinfo is None:
        user.locked_until = user.locked_until.replace(tzinfo=timezone.utc)
    if user and user.locked_until and user.locked_until > now:
        raise HTTPException(423, "Account locked due to repeated failures. Try later.")
    if not user or not verify_password(password, user.password_hash):
        if user:
            user.failed_attempts = (user.failed_attempts or 0) + 1
            if user.failed_attempts >= 5:
                user.locked_until = now + timedelta(minutes=15)
            db.add(user)
            audit(db, "FAILED_LOGIN", user_id=user.id, entity="user", entity_id=str(user.id), ip=ip, user_agent=ua)
            db.commit()
        raise HTTPException(401, "Invalid credentials")
    user.failed_attempts = 0
    user.locked_until = None
    jti = secrets.token_hex(16)
    sess = LoginSession(user_id=user.id, jti=jti, ip=ip, user_agent=ua,
                        expires_at=now + timedelta(days=7))
    db.add(sess)
    audit(db, "LOGIN", user_id=user.id, entity="user", entity_id=str(user.id), ip=ip, user_agent=ua)
    notify(db, user.id, "New login", "A new login to your account was recorded.", "LOGIN")
    db.commit()
    return {"access_token": create_access_token(str(user.id), _role_name(user)),
            "refresh_token": create_refresh_token(str(user.id), jti),
            "token_type": "bearer"}


def refresh(db: Session, token: str) -> dict:
    try:
        payload = decode_refresh_token(token)
    except ValueError:
        raise HTTPException(401, "Invalid refresh token")
    sess = db.query(LoginSession).filter(LoginSession.jti == payload.get("jti")).first()
    if not sess or not sess.is_active:
        raise HTTPException(401, "Session revoked")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user or not user.is_active:
        raise HTTPException(401, "User inactive")
    # rotation
    sess.is_active = False
    jti = secrets.token_hex(16)
    exp = datetime.now(timezone.utc) + timedelta(days=7)
    db.add(LoginSession(user_id=user.id, jti=jti, expires_at=exp))
    db.commit()
    return {"access_token": create_access_token(str(user.id), _role_name(user)),
            "refresh_token": create_refresh_token(str(user.id), jti),
            "token_type": "bearer"}


def logout(db: Session, user: User, refresh_token: str | None = None):
    if refresh_token:
        try:
            payload = decode_refresh_token(refresh_token)
            s = db.query(LoginSession).filter(LoginSession.jti == payload.get("jti")).first()
            if s:
                s.is_active = False
        except ValueError:
            pass
    audit(db, "LOGOUT", user_id=user.id, entity="user", entity_id=str(user.id))
    db.commit()


def logout_all(db: Session, user: User):
    for s in db.query(LoginSession).filter(LoginSession.user_id == user.id, LoginSession.is_active == True).all():  # noqa: E712
        s.is_active = False
    audit(db, "LOGOUT", user_id=user.id, entity="user", entity_id=str(user.id), meta={"all": True})
    db.commit()


def forgot(db: Session, email: str) -> str:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return "ok"  # do not leak
    raw = secrets.token_urlsafe(32)
    th = hashlib.sha256(raw.encode()).hexdigest()
    db.add(PasswordResetToken(user_id=user.id, token_hash=th,
                              expires_at=datetime.now(timezone.utc) + timedelta(hours=1)))
    db.commit()
    return raw  # in real life emailed; returned here for tests/dev


def reset(db: Session, token: str, new_password: str):
    ok, msg = check_password_strength(new_password)
    if not ok:
        raise HTTPException(400, msg)
    th = hashlib.sha256(token.encode()).hexdigest()
    rec = db.query(PasswordResetToken).filter(PasswordResetToken.token_hash == th).first()
    now = datetime.now(timezone.utc)
    exp = rec.expires_at
    if exp and exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if not rec or rec.used or (exp and exp < now):
        raise HTTPException(400, "Invalid or expired token")
    user = db.query(User).filter(User.id == rec.user_id).first()
    user.password_hash = hash_password(new_password)
    rec.used = True
    audit(db, "PASSWORD_CHANGED", user_id=user.id, entity="user", entity_id=str(user.id))
    notify(db, user.id, "Password changed", "Your password was changed.", "PASSWORD_CHANGE")
    db.commit()
