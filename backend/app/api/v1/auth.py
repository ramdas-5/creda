from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.core.deps import get_current_user, get_db
from app.schemas.all import AuthLogin, AuthRegister, ChangePasswordIn, ForgotIn, RefreshIn, ResetIn
from app.services import auth_service
from app.models.all import User
from app.core.security import check_password_strength, hash_password
from fastapi import HTTPException

router = APIRouter(prefix="/auth", tags=["auth"])


def _out(user: User):
    return {"id": user.id, "email": user.email, "full_name": user.full_name,
            "phone": user.phone, "role": user.role.name if user.role else "", "is_active": user.is_active}


def _out_with_account(db, user: User):
    from app.models.all import Account, Customer
    d = _out(user)
    cust = db.query(Customer).filter(Customer.user_id == user.id).first()
    if cust:
        acc = db.query(Account).filter(Account.customer_id == cust.id, Account.is_deleted == False).order_by(Account.id.asc()).first()  # noqa: E712
        if acc:
            d["account_number"] = acc.account_number
            d["customer_id"] = cust.id
    return d


@router.post("/register", status_code=201)
def register(body: AuthRegister, db: Session = Depends(get_db)):
    u = auth_service.register(db, body.email, body.password, body.full_name, body.phone)
    return {"success": True, "data": _out_with_account(db, u)}


@router.post("/login")
def login(body: AuthLogin, request: Request, db: Session = Depends(get_db)):
    ip = request.client.host if request.client else ""
    ident = body.login_id()
    if not ident:
        raise HTTPException(400, "Email or account number required")
    data = auth_service.login(db, ident, body.password, ip, request.headers.get("user-agent", ""))
    return {"success": True, "data": data}


@router.post("/refresh")
def refresh(body: RefreshIn, db: Session = Depends(get_db)):
    return {"success": True, "data": auth_service.refresh(db, body.refresh_token)}


@router.post("/logout")
def logout(body: RefreshIn | None = None, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    auth_service.logout(db, user, body.refresh_token if body else None)
    return {"success": True, "data": {"message": "Logged out"}}


@router.post("/logout-all")
def logout_all(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    auth_service.logout_all(db, user)
    return {"success": True, "data": {"message": "All sessions revoked"}}


@router.get("/me")
def me(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return {"success": True, "data": _out_with_account(db, user)}


@router.post("/change-password")
def change_password(body: ChangePasswordIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from app.core.security import verify_password
    if not verify_password(body.old_password, user.password_hash):
        raise HTTPException(400, "Old password incorrect")
    ok, msg = check_password_strength(body.new_password)
    if not ok:
        raise HTTPException(400, msg)
    user.password_hash = hash_password(body.new_password)
    db.commit()
    return {"success": True, "data": {"message": "Password changed"}}


@router.post("/forgot-password")
def forgot(body: ForgotIn, db: Session = Depends(get_db)):
    token = auth_service.forgot(db, body.email)
    return {"success": True, "data": {"message": "If the email exists, a reset token was created.", "reset_token": token}}


@router.post("/reset-password")
def reset(body: ResetIn, db: Session = Depends(get_db)):
    auth_service.reset(db, body.token, body.new_password)
    return {"success": True, "data": {"message": "Password reset"}}
