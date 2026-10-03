from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.models.all import Customer, User
from app.utils.pagination import paginate_query

router = APIRouter(prefix="/customers", tags=["customers"])


def _out(c: Customer):
    return {"id": c.id, "user_id": c.user_id, "first_name": c.first_name, "last_name": c.last_name,
            "phone": c.phone, "address": c.address, "kyc_status": c.kyc_status}


@router.get("")
def list_customers(page: int = 1, size: int = 20, search: str = "", db: Session = Depends(get_db),
                   cur: User = Depends(get_current_user)):
    role = (cur.role.name if cur.role else "").lower()
    q = db.query(Customer).filter(Customer.is_deleted == False)  # noqa: E712
    if role == "customer":
        q = q.filter(Customer.user_id == cur.id)
    if search:
        q = q.filter(Customer.first_name.contains(search) | Customer.last_name.contains(search) | Customer.phone.contains(search))
    q = q.order_by(Customer.id.desc())
    res = paginate_query(q, page, size)
    res["items"] = [_out(c) for c in res["items"]]
    return {"success": True, "data": res}


@router.post("", status_code=201)
def create_customer(body: dict, db: Session = Depends(get_db), cur: User = Depends(get_current_user)):
    role = (cur.role.name if cur.role else "").lower()
    if role not in ("admin", "manager", "employee"):
        raise HTTPException(403, "Forbidden")
    c = Customer(user_id=body.get("user_id"), first_name=body.get("first_name", ""),
                 last_name=body.get("last_name", ""), phone=body.get("phone", ""),
                 address=body.get("address", ""), kyc_status=body.get("kyc_status", "NOT_SUBMITTED"))
    db.add(c)
    db.commit()
    db.refresh(c)
    return {"success": True, "data": _out(c)}


@router.get("/{cid}")
def get_customer(cid: int, db: Session = Depends(get_db), cur: User = Depends(get_current_user)):
    c = db.query(Customer).filter(Customer.id == cid).first()
    if not c:
        raise HTTPException(404, "Not found")
    role = (cur.role.name if cur.role else "").lower()
    if role == "customer" and c.user_id != cur.id:
        raise HTTPException(403, "Forbidden")
    return {"success": True, "data": _out(c)}


@router.patch("/{cid}")
def patch_customer(cid: int, body: dict, db: Session = Depends(get_db), cur: User = Depends(get_current_user)):
    c = db.query(Customer).filter(Customer.id == cid).first()
    if not c:
        raise HTTPException(404, "Not found")
    role = (cur.role.name if cur.role else "").lower()
    if role == "customer" and c.user_id != cur.id:
        raise HTTPException(403, "Forbidden")
    for f in ("first_name", "last_name", "phone", "address", "kyc_status"):
        if f in body:
            setattr(c, f, body[f])
    db.commit()
    return {"success": True, "data": _out(c)}
