"""Customer deposit requests (PENDING) + staff approve/reject (balance moves only on approve)."""
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_db, get_current_user, require_roles
from app.models.all import Account, Customer, DepositRequest, User
from app.schemas.all import DepositRequestIn
from app.services.account_service import deposit_to, user_customer_id
from app.utils.helpers import audit, notify
from app.utils.pagination import paginate_query
from app.utils.refs import gen_reference

router = APIRouter(prefix="/deposit-requests", tags=["deposit-requests"])
admin_router = APIRouter(prefix="/admin/deposit-requests", tags=["admin-deposit-requests"])
Staff = require_roles("admin", "manager", "employee")


def _out(r: DepositRequest) -> dict:
    return {"id": r.id, "reference": r.reference, "customer_id": r.customer_id,
            "account_id": r.account_id, "amount": str(r.amount), "note": r.note,
            "status": r.status, "review_note": r.review_note,
            "created_at": str(r.created_at)}


@router.post("", status_code=201)
def create_request(body: DepositRequestIn, db: Session = Depends(get_db),
                   user: User = Depends(get_current_user)):
    from app.services.account_service import owns_account
    acc = owns_account(db, user, body.account_id)
    if not acc:
        raise HTTPException(404, "Account not found")
    role = (user.role.name if user.role else "").lower()
    if role != "customer" and role not in ("admin", "manager", "employee"):
        raise HTTPException(403, "Forbidden")
    # customers may only request for own accounts (owns_account already enforces)
    cid = user_customer_id(db, user) if role == "customer" else acc.customer_id
    if Decimal(body.amount) <= 0:
        raise HTTPException(400, "Invalid amount")
    r = DepositRequest(reference=gen_reference("DEP"), customer_id=cid,
                       account_id=body.account_id, amount=Decimal(body.amount),
                       note=body.note or "", status="PENDING", requested_by=user.id)
    db.add(r)
    audit(db, "DEPOSIT_REQUESTED", user_id=user.id, entity="deposit_request",
          entity_id=r.reference, meta={"amount": str(body.amount)})
    # notify staff? notify requester
    notify(db, user.id, "Deposit request submitted",
           f"{r.reference}: ₹{body.amount} pending admin verification.", "DEPOSIT")
    db.commit()
    db.refresh(r)
    return {"success": True, "data": _out(r)}


@router.get("")
def my_requests(page: int = 1, size: int = 20, status: str = "",
                db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    role = (user.role.name if user.role else "").lower()
    q = db.query(DepositRequest)
    if role == "customer":
        cid = user_customer_id(db, user)
        q = q.filter(DepositRequest.customer_id == cid)
    if status:
        q = q.filter(DepositRequest.status == status.upper())
    q = q.order_by(DepositRequest.id.desc())
    res = paginate_query(q, page, size)
    res["items"] = [_out(r) for r in res["items"]]
    return {"success": True, "data": res}


@admin_router.get("")
def admin_list(page: int = 1, size: int = 20, status: str = "",
               db: Session = Depends(get_db), _: User = Depends(Staff)):
    q = db.query(DepositRequest)
    if status:
        q = q.filter(DepositRequest.status == status.upper())
    q = q.order_by(DepositRequest.id.desc())
    res = paginate_query(q, page, size)
    items = []
    for r in res["items"]:
        acc = db.query(Account).filter(Account.id == r.account_id).first()
        cust = db.query(Customer).filter(Customer.id == r.customer_id).first()
        d = _out(r)
        d["account_number"] = acc.account_number if acc else ""
        d["customer"] = (cust.first_name + " " + cust.last_name).strip() if cust else ""
        items.append(d)
    res["items"] = items
    return {"success": True, "data": res}


def _approve_logic(db: Session, staff: User, rid: int, note: str = "") -> dict:
    r = db.query(DepositRequest).filter(DepositRequest.id == rid).first()
    if not r:
        raise HTTPException(404, "Not found")
    if r.status != "PENDING":
        raise HTTPException(400, "Request already processed")
    acc = db.query(Account).filter(Account.id == r.account_id).first()
    if not acc or acc.customer_id != r.customer_id:
        raise HTTPException(400, "Account/customer mismatch")
    if acc.status != "ACTIVE":
        raise HTTPException(400, "Account must be ACTIVE")
    # atomic credit via existing service (staff bypasses ownership)
    d = deposit_to(db, staff, r.account_id, Decimal(r.amount), "REQUEST")
    r.status = "APPROVED"
    r.reviewed_by = staff.id
    r.review_note = note or ""
    audit(db, "ADMIN_ACTION", user_id=staff.id, entity="deposit_request",
          entity_id=r.reference, meta={"op": "approve", "deposit": d.reference})
    cust = db.query(Customer).filter(Customer.id == r.customer_id).first()
    if cust:
        notify(db, cust.user_id, "Deposit approved",
               f"{r.reference}: ₹{r.amount} credited to your account.", "DEPOSIT")
    db.commit()
    db.refresh(r)
    return _out(r)


@admin_router.post("/{rid}/approve")
def approve(rid: int, body: dict | None = None, db: Session = Depends(get_db),
            staff: User = Depends(Staff)):
    note = (body or {}).get("note", "") if isinstance(body, dict) else ""
    return {"success": True, "data": _approve_logic(db, staff, rid, str(note))}


@admin_router.post("/{rid}/reject")
def reject(rid: int, body: dict | None = None, db: Session = Depends(get_db),
           staff: User = Depends(Staff)):
    r = db.query(DepositRequest).filter(DepositRequest.id == rid).first()
    if not r:
        raise HTTPException(404, "Not found")
    if r.status != "PENDING":
        raise HTTPException(400, "Request already processed")
    r.status = "REJECTED"
    r.reviewed_by = staff.id
    r.review_note = str((body or {}).get("reason", (body or {}).get("note", "")))
    audit(db, "ADMIN_ACTION", user_id=staff.id, entity="deposit_request",
          entity_id=r.reference, meta={"op": "reject"})
    cust = db.query(Customer).filter(Customer.id == r.customer_id).first()
    if cust:
        notify(db, cust.user_id, "Deposit rejected",
               f"{r.reference}: rejected. {r.review_note}", "DEPOSIT")
    db.commit()
    return {"success": True, "data": _out(r)}
