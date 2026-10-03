from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.models.all import Transaction
from app.services.account_service import owns_account
from app.utils.pagination import paginate_query

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _out(t: Transaction):
    return {"id": t.id, "reference": t.reference, "account_id": t.account_id, "type": t.type,
            "direction": t.direction, "amount": str(t.amount), "fee": str(t.fee),
            "balance_after": str(t.balance_after) if t.balance_after is not None else None,
            "status": t.status, "description": t.description, "created_at": str(t.created_at)}


@router.get("")
def list_txns(page: int = 1, size: int = 20, account_id: int = 0, type: str = "", status: str = "",
              search: str = "", sort: str = "created_at", order: str = "desc",
              db: Session = Depends(get_db), user=Depends(get_current_user)):
    q = db.query(Transaction)
    role = (user.role.name if user.role else "").lower()
    if account_id:
        acc = owns_account(db, user, account_id)
        if not acc:
            raise HTTPException(403, "Account not accessible")
        q = q.filter(Transaction.account_id == account_id)
    elif role == "customer":
        from app.services.account_service import user_customer_id
        from app.models.all import Account
        cid = user_customer_id(db, user)
        ids = [a.id for a in db.query(Account).filter(Account.customer_id == cid).all()]
        q = q.filter(Transaction.account_id.in_(ids) if ids else Transaction.id == -1)
    if type:
        q = q.filter(Transaction.type == type)
    if status:
        q = q.filter(Transaction.status == status)
    if search:
        q = q.filter(Transaction.description.contains(search) | Transaction.reference.contains(search))
    col = getattr(Transaction, sort, Transaction.created_at)
    q = q.order_by(col.desc() if order == "desc" else col.asc())
    res = paginate_query(q, page, size)
    res["items"] = [_out(t) for t in res["items"]]
    return {"success": True, "data": res}


@router.get("/{tid}")
def get_txn(tid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    t = db.query(Transaction).filter(Transaction.id == tid).first()
    if not t:
        raise HTTPException(404, "Not found")
    acc = owns_account(db, user, t.account_id)
    if not acc:
        raise HTTPException(403, "Forbidden")
    return {"success": True, "data": _out(t)}
