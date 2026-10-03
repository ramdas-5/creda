from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from fastapi import HTTPException

from app.models.all import Account, Beneficiary, Deposit, Transaction, Transfer, User, Withdrawal
from app.utils.helpers import audit, notify
from app.utils.refs import gen_account_number, gen_reference

TWOPLACES = Decimal("0.01")


def q(v: Decimal) -> Decimal:
    return Decimal(v).quantize(TWOPLACES, rounding=ROUND_HALF_UP)


def user_customer_id(db: Session, user: User) -> int | None:
    from app.models.all import Customer
    c = db.query(Customer).filter(Customer.user_id == user.id).first()
    return c.id if c else None


def owns_account(db: Session, user: User, account_id: int) -> Account | None:
    role = (user.role.name if user.role else "").lower()
    if role in ("admin", "manager", "employee"):
        return db.query(Account).filter(Account.id == account_id, Account.is_deleted == False).first()  # noqa: E712
    cid = user_customer_id(db, user)
    if cid is None:
        return None
    return db.query(Account).filter(Account.id == account_id, Account.customer_id == cid, Account.is_deleted == False).first()  # noqa: E712


def create_account(db: Session, user: User, customer_id=None, account_type_id=None, branch_id=None,
                   initial: Decimal = Decimal("0.00")) -> Account:
    from app.models.all import Customer
    role = (user.role.name if user.role else "").lower()
    if customer_id is None:
        cid = user_customer_id(db, user)
        if cid is None:
            # auto-create customer profile for user
            c = Customer(user_id=user.id, first_name=user.full_name or user.email)
            db.add(c)
            db.flush()
            cid = c.id
        customer_id = cid
    else:
        if role not in ("admin", "manager", "employee"):
            # customers may only open for themselves
            if customer_id != user_customer_id(db, user):
                raise HTTPException(403, "Forbidden")
    acc = None
    for _ in range(8):
        candidate = gen_account_number()
        if not db.query(Account).filter(Account.account_number == candidate).first():
            acc = Account(account_number=candidate, customer_id=customer_id,
                          account_type_id=account_type_id, branch_id=branch_id, balance=q(initial or Decimal("0")),
                          status="ACTIVE")
            break
    if acc is None:
        raise HTTPException(500, "Could not generate unique account number")
    db.add(acc)
    db.flush()
    if initial and Decimal(initial) > 0:
        ref = gen_reference("TXN")
        db.add(Transaction(reference=ref, account_id=acc.id, type="DEPOSIT", direction="CREDIT",
                           amount=q(initial), balance_after=q(initial), status="COMPLETED",
                           description="Opening deposit"))
    audit(db, "ACCOUNT_CREATED", user_id=user.id, entity="account", entity_id=str(acc.id))
    db.commit()
    db.refresh(acc)
    return acc


def atomic_transfer(db: Session, user: User, from_id: int, to_id: int, amount: Decimal,
                    remarks: str = "", idempotency_key: str | None = None, ip: str = "", ua: str = "") -> Transfer:
    amount = q(amount)
    if amount <= 0:
        raise HTTPException(400, "Amount must be positive")
    if from_id == to_id:
        raise HTTPException(400, "Cannot transfer to the same account")
    if idempotency_key:
        existing = db.query(Transfer).filter(Transfer.idempotency_key == idempotency_key).first()
        if existing:
            return existing
    src = owns_account(db, user, from_id)
    if not src:
        raise HTTPException(403, "Source account not accessible")
    dst = db.query(Account).filter(Account.id == to_id, Account.is_deleted == False).first()  # noqa: E712
    if not dst:
        raise HTTPException(404, "Destination account not found")
    if src.status != "ACTIVE" or dst.status != "ACTIVE":
        raise HTTPException(400, "Both accounts must be ACTIVE")
    # lock rows where supported (Postgres); SQLite ignores
    try:
        db.execute(__import__("sqlalchemy").text("SELECT 1"))
        for aid in sorted([from_id, to_id]):
            db.query(Account).filter(Account.id == aid).with_for_update().first()
    except Exception:
        pass
    db.refresh(src)
    db.refresh(dst)
    if Decimal(src.balance) < amount:
        audit(db, "TRANSFER_FAILED", user_id=user.id, entity="account", entity_id=str(from_id),
              meta={"reason": "insufficient_funds"}, ip=ip, user_agent=ua)
        db.commit()
        raise HTTPException(400, "The account does not have sufficient available balance.")
    ref = gen_reference("TXN")
    try:
        src.balance = q(Decimal(src.balance) - amount)
        dst.balance = q(Decimal(dst.balance) + amount)
        tr = Transfer(reference=ref, from_account_id=from_id, to_account_id=to_id,
                      amount=amount, fee=Decimal("0.00"), status="COMPLETED",
                      remarks=remarks, idempotency_key=idempotency_key, created_by=user.id)
        db.add(tr)
        db.flush()
        db.add(Transaction(reference=ref + "-D", account_id=from_id, type="TRANSFER", direction="DEBIT",
                           amount=amount, balance_after=q(src.balance), status="COMPLETED",
                           description=remarks or f"Transfer to {dst.account_number}",
                           idempotency_key=(idempotency_key + ":D") if idempotency_key else None))
        db.add(Transaction(reference=ref + "-C", account_id=to_id, type="TRANSFER", direction="CREDIT",
                           amount=amount, balance_after=q(dst.balance), status="COMPLETED",
                           description=remarks or f"Transfer from {src.account_number}"))
        audit(db, "TRANSFER_COMPLETED", user_id=user.id, entity="transfer", entity_id=ref,
              meta={"amount": str(amount)}, ip=ip, user_agent=ua)
        notify(db, user.id, "Transfer completed", f"{ref}: {amount} transferred.", "TRANSFER")
        # notify destination owner if internal user
        from app.models.all import Customer
        dc = db.query(Customer).filter(Customer.id == dst.customer_id).first()
        if dc and dc.user_id != user.id:
            notify(db, dc.user_id, "Amount credited", f"{ref}: {amount} credited.", "TRANSFER")
        db.commit()
        db.refresh(tr)
        return tr
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        # unique violation on idempotency -> return existing
        if idempotency_key and "idempotency" in str(e).lower():
            existing = db.query(Transfer).filter(Transfer.idempotency_key == idempotency_key).first()
            if existing:
                return existing
        raise HTTPException(500, "Transfer failed") from e


def deposit_to(db: Session, user: User, account_id: int, amount: Decimal, method: str = "CASH") -> Deposit:
    amount = q(amount)
    if amount <= 0:
        raise HTTPException(400, "Amount must be positive")
    acc = owns_account(db, user, account_id)
    if not acc:
        raise HTTPException(403, "Account not accessible")
    if acc.status != "ACTIVE":
        raise HTTPException(400, "Account must be ACTIVE")
    ref = gen_reference("DEP")
    acc.balance = q(Decimal(acc.balance) + amount)
    d = Deposit(reference=ref, account_id=account_id, amount=amount, method=method,
                status="COMPLETED", created_by=user.id)
    db.add(d)
    db.flush()
    db.add(Transaction(reference=ref, account_id=account_id, type="DEPOSIT", direction="CREDIT",
                       amount=amount, balance_after=q(acc.balance), status="COMPLETED",
                       description=f"Deposit via {method}"))
    audit(db, "TRANSFER_COMPLETED", user_id=user.id, entity="deposit", entity_id=ref)
    # notify account owner
    try:
        from app.models.all import Customer
        oc = db.query(Customer).filter(Customer.id == acc.customer_id).first()
        if oc:
            notify(db, oc.user_id, "Deposit completed", f"{ref}: ₹{amount} credited.", "DEPOSIT")
    except Exception:
        pass
    db.commit()
    db.refresh(d)
    return d


def withdraw_from(db: Session, user: User, account_id: int, amount: Decimal, method: str = "CASH") -> Withdrawal:
    amount = q(amount)
    if amount <= 0:
        raise HTTPException(400, "Amount must be positive")
    acc = owns_account(db, user, account_id)
    if not acc:
        raise HTTPException(403, "Account not accessible")
    if acc.status != "ACTIVE":
        raise HTTPException(400, "Account must be ACTIVE")
    if Decimal(acc.balance) < amount:
        raise HTTPException(400, "The account does not have sufficient available balance.")
    ref = gen_reference("WDL")
    acc.balance = q(Decimal(acc.balance) - amount)
    w = Withdrawal(reference=ref, account_id=account_id, amount=amount, method=method,
                   status="COMPLETED", created_by=user.id)
    db.add(w)
    db.flush()
    db.add(Transaction(reference=ref, account_id=account_id, type="WITHDRAWAL", direction="DEBIT",
                       amount=amount, balance_after=q(acc.balance), status="COMPLETED",
                       description=f"Withdrawal via {method}"))
    audit(db, "TRANSFER_COMPLETED", user_id=user.id, entity="withdrawal", entity_id=ref)
    try:
        from app.models.all import Customer
        oc = db.query(Customer).filter(Customer.id == acc.customer_id).first()
        if oc:
            notify(db, oc.user_id, "Withdrawal completed", f"{ref}: ₹{amount} debited.", "WITHDRAWAL")
    except Exception:
        pass
    db.commit()
    db.refresh(w)
    return w
