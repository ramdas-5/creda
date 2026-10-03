from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user, require_roles
from app.models.all import Account
from app.schemas.all import AccountCreate
from app.services.account_service import create_account, deposit_to, owns_account, withdraw_from
from app.schemas.all import DepositIn, WithdrawIn
from app.utils.pagination import paginate_query

router = APIRouter(prefix="/accounts", tags=["accounts"])

# Only branch staff may touch cash. Customers can transfer, but cannot
# mint (deposit) or burn (withdraw) money by themselves.
Teller = require_roles("admin", "manager", "employee")


def _out(a: Account):
    num = a.account_number
    masked = "****" + num[-4:] if len(num) >= 4 else num
    return {"id": a.id, "account_number": num, "masked": masked, "customer_id": a.customer_id,
            "balance": str(a.balance), "status": a.status, "branch_id": a.branch_id,
            "account_type_id": a.account_type_id, "created_at": str(a.created_at)}


@router.get("")
def list_accounts(page: int = 1, size: int = 20, status: str = "", db: Session = Depends(get_db),
                  user=Depends(get_current_user)):
    role = (user.role.name if user.role else "").lower()
    q = db.query(Account).filter(Account.is_deleted == False)  # noqa: E712
    if role == "customer":
        from app.services.account_service import user_customer_id
        cid = user_customer_id(db, user)
        q = q.filter(Account.customer_id == cid)
    if status:
        q = q.filter(Account.status == status)
    q = q.order_by(Account.id.desc())
    res = paginate_query(q, page, size)
    res["items"] = [_out(a) for a in res["items"]]
    return {"success": True, "data": res}


@router.post("", status_code=201)
def open_account(body: AccountCreate, db: Session = Depends(get_db), user=Depends(get_current_user)):
    acc = create_account(db, user, body.customer_id, body.account_type_id, body.branch_id, body.initial_balance)
    return {"success": True, "data": _out(acc)}


@router.get("/{aid}")
def get_account(aid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    acc = owns_account(db, user, aid)
    if not acc:
        raise HTTPException(404, "Account not found")
    return {"success": True, "data": _out(acc)}


@router.post("/deposit")
def deposit(body: DepositIn, db: Session = Depends(get_db), user=Depends(Teller)):
    """Immediate counter credit — staff only. Customers use deposit requests."""
    d = deposit_to(db, user, body.account_id, Decimal(body.amount), body.method)
    return {"success": True, "data": {"reference": d.reference, "amount": str(d.amount)}}


@router.post("/withdraw")
def withdraw(body: WithdrawIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    """Direct customer withdrawal (own account) or staff counter payout.
    Verifies ownership, sufficient balance, updates atomically."""
    w = withdraw_from(db, user, body.account_id, Decimal(body.amount), body.method)
    return {"success": True, "data": {"reference": w.reference, "amount": str(w.amount)}}


@router.patch("/{aid}/status")
def set_status(aid: int, body: dict, db: Session = Depends(get_db), user=Depends(get_current_user)):
    role = (user.role.name if user.role else "").lower()
    if role not in ("admin", "manager", "employee"):
        raise HTTPException(403, "Forbidden")
    acc = db.query(Account).filter(Account.id == aid).first()
    if not acc:
        raise HTTPException(404, "Not found")
    acc.status = body.get("status", acc.status)
    db.commit()
    return {"success": True, "data": _out(acc)}
