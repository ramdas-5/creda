"""Customer card requests + staff approve/reject (card created only on approve)."""
import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from decimal import Decimal

from app.core.deps import get_db, get_current_user, require_roles
from app.models.all import Account, Card, CardRequest, Customer, User
from app.schemas.all import CardRequestIn
from app.services.account_service import owns_account, user_customer_id
from app.utils.helpers import audit, notify
from app.utils.pagination import paginate_query
from app.utils.refs import gen_card_token, gen_reference

router = APIRouter(prefix="/card-requests", tags=["card-requests"])
admin_router = APIRouter(prefix="/admin/card-requests", tags=["admin-card-requests"])
Staff = require_roles("admin", "manager", "employee")


def _out(r: CardRequest) -> dict:
    return {"id": r.id, "reference": r.reference, "customer_id": r.customer_id,
            "account_id": r.account_id, "card_type": r.card_type, "status": r.status,
            "review_note": r.review_note, "card_id": r.card_id,
            "created_at": str(r.created_at)}


@router.post("", status_code=201)
def create(body: CardRequestIn, db: Session = Depends(get_db),
           user: User = Depends(get_current_user)):
    acc = owns_account(db, user, body.account_id)
    if not acc:
        raise HTTPException(404, "Account not found")
    cid = user_customer_id(db, user)
    role = (user.role.name if user.role else "").lower()
    if role == "customer" and acc.customer_id != cid:
        raise HTTPException(403, "Forbidden")
    # prevent duplicate pending for same account
    dup = db.query(CardRequest).filter(CardRequest.account_id == body.account_id,
                                       CardRequest.status == "PENDING").first()
    if dup:
        raise HTTPException(400, "Card request already pending for this account")
    r = CardRequest(reference=gen_reference("CARD"), customer_id=acc.customer_id,
                    account_id=body.account_id, card_type=body.card_type or "DEBIT",
                    status="PENDING", requested_by=user.id)
    db.add(r)
    audit(db, "CARD_REQUESTED", user_id=user.id, entity="card_request", entity_id=r.reference)
    notify(db, user.id, "Card request submitted",
           f"{r.reference}: pending admin approval.", "CARD")
    db.commit()
    db.refresh(r)
    return {"success": True, "data": _out(r)}


@router.get("")
def mine(page: int = 1, size: int = 20, db: Session = Depends(get_db),
         user: User = Depends(get_current_user)):
    role = (user.role.name if user.role else "").lower()
    q = db.query(CardRequest)
    if role == "customer":
        q = q.filter(CardRequest.customer_id == user_customer_id(db, user))
    q = q.order_by(CardRequest.id.desc())
    res = paginate_query(q, page, size)
    res["items"] = [_out(r) for r in res["items"]]
    return {"success": True, "data": res}


@admin_router.get("")
def admin_list(page: int = 1, size: int = 20, status: str = "",
               db: Session = Depends(get_db), _: User = Depends(Staff)):
    q = db.query(CardRequest)
    if status:
        q = q.filter(CardRequest.status == status.upper())
    q = q.order_by(CardRequest.id.desc())
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


@admin_router.post("/{rid}/approve")
def approve(rid: int, body: dict | None = None, db: Session = Depends(get_db),
            staff: User = Depends(Staff)):
    r = db.query(CardRequest).filter(CardRequest.id == rid).first()
    if not r:
        raise HTTPException(404, "Not found")
    if r.status != "PENDING":
        raise HTTPException(400, "Request already processed")
    last4 = f"{secrets.randbelow(9000) + 1000}"
    c = Card(account_id=r.account_id, card_token=gen_card_token(), last4=last4,
             card_type=r.card_type, spending_limit=Decimal("100000.00"),
             expiry="12/29", status="ACTIVE")
    db.add(c)
    db.flush()
    r.status = "APPROVED"
    r.reviewed_by = staff.id
    r.card_id = c.id
    audit(db, "ADMIN_ACTION", user_id=staff.id, entity="card_request",
          entity_id=r.reference, meta={"op": "approve", "card_id": c.id})
    cust = db.query(Customer).filter(Customer.id == r.customer_id).first()
    if cust:
        notify(db, cust.user_id, "Card approved",
               f"{r.reference}: card ****{last4} issued.", "CARD")
    db.commit()
    db.refresh(r)
    return {"success": True, "data": _out(r)}


@admin_router.post("/{rid}/reject")
def reject(rid: int, body: dict | None = None, db: Session = Depends(get_db),
           staff: User = Depends(Staff)):
    r = db.query(CardRequest).filter(CardRequest.id == rid).first()
    if not r:
        raise HTTPException(404, "Not found")
    if r.status != "PENDING":
        raise HTTPException(400, "Request already processed")
    r.status = "REJECTED"
    r.reviewed_by = staff.id
    r.review_note = str((body or {}).get("reason", ""))
    audit(db, "ADMIN_ACTION", user_id=staff.id, entity="card_request",
          entity_id=r.reference, meta={"op": "reject"})
    cust = db.query(Customer).filter(Customer.id == r.customer_id).first()
    if cust:
        notify(db, cust.user_id, "Card rejected", f"{r.reference}: {r.review_note}", "CARD")
    db.commit()
    return {"success": True, "data": _out(r)}
