from decimal import Decimal
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.models.all import Transfer
from app.schemas.all import TransferCreate
from app.services.account_service import atomic_transfer, owns_account
from fastapi import HTTPException
from app.utils.pagination import paginate_query

router = APIRouter(prefix="/transfers", tags=["transfers"])


@router.post("", status_code=201)
def create_transfer(body: TransferCreate, request: Request, db: Session = Depends(get_db),
                    user=Depends(get_current_user)):
    ip = request.client.host if request.client else ""
    tr = atomic_transfer(db, user, body.from_account_id, body.to_account_id, Decimal(body.amount),
                         body.remarks, body.idempotency_key, ip, request.headers.get("user-agent", ""))
    return {"success": True, "data": {"reference": tr.reference, "status": tr.status, "amount": str(tr.amount)}}


@router.get("")
def list_transfers(page: int = 1, size: int = 20, db: Session = Depends(get_db), user=Depends(get_current_user)):
    from app.services.account_service import user_customer_id
    from app.models.all import Account
    role = (user.role.name if user.role else "").lower()
    q = db.query(Transfer)
    if role == "customer":
        cid = user_customer_id(db, user)
        ids = [a.id for a in db.query(Account).filter(Account.customer_id == cid).all()]
        if ids:
            q = q.filter((Transfer.from_account_id.in_(ids)) | (Transfer.to_account_id.in_(ids)))
        else:
            q = q.filter(Transfer.id == -1)
    q = q.order_by(Transfer.id.desc())
    res = paginate_query(q, page, size)
    res["items"] = [{"id": t.id, "reference": t.reference, "from_account_id": t.from_account_id,
                     "to_account_id": t.to_account_id, "amount": str(t.amount), "status": t.status,
                     "remarks": t.remarks} for t in res["items"]]
    return {"success": True, "data": res}


@router.get("/{ref}")
def get_transfer(ref: str, db: Session = Depends(get_db), user=Depends(get_current_user)):
    t = db.query(Transfer).filter(Transfer.reference == ref).first()
    if not t:
        raise HTTPException(404, "Not found")
    acc = owns_account(db, user, t.from_account_id)
    role = (user.role.name if user.role else "").lower()
    if not acc and role == "customer":
        # allow receiver to view
        acc2 = owns_account(db, user, t.to_account_id)
        if not acc2:
            raise HTTPException(403, "Forbidden")
    return {"success": True, "data": {"reference": t.reference, "amount": str(t.amount), "status": t.status,
                                      "from_account_id": t.from_account_id, "to_account_id": t.to_account_id}}
