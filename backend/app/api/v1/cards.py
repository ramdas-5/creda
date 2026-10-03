from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user, require_roles
from app.models.all import Card
from app.schemas.all import CardIn
from app.services.account_service import owns_account
from app.utils.refs import gen_card_token
from app.utils.pagination import paginate_query

router = APIRouter(prefix="/cards", tags=["cards"])
Staff = require_roles("admin", "manager", "employee")


def _out(c: Card):
    return {"id": c.id, "account_id": c.account_id, "last4": c.last4, "token": c.card_token,
            "card_type": c.card_type, "status": c.status, "spending_limit": str(c.spending_limit),
            "expiry": c.expiry}


@router.get("")
def list_cards(page: int = 1, size: int = 20, db: Session = Depends(get_db), user=Depends(get_current_user)):
    role = (user.role.name if user.role else "").lower()
    q = db.query(Card).filter(Card.is_deleted == False)  # noqa: E712
    if role == "customer":
        from app.services.account_service import user_customer_id
        from app.models.all import Account
        cid = user_customer_id(db, user)
        ids = [a.id for a in db.query(Account).filter(Account.customer_id == cid).all()]
        q = q.filter(Card.account_id.in_(ids) if ids else Card.id == -1)
    q = q.order_by(Card.id.desc())
    res = paginate_query(q, page, size)
    res["items"] = [_out(c) for c in res["items"]]
    return {"success": True, "data": res}


@router.post("", status_code=201)
def create_card(body: CardIn, db: Session = Depends(get_db), user=Depends(Staff)):
    """Direct issuance is staff-only (normal flow is card-requests approve)."""
    acc = owns_account(db, user, body.account_id)
    if not acc:
        raise HTTPException(403, "Account not accessible")
    import secrets
    last4 = f"{secrets.randbelow(9000) + 1000}"
    c = Card(account_id=body.account_id, card_token=gen_card_token(), last4=last4,
             card_type=body.card_type, spending_limit=Decimal(body.spending_limit),
             expiry="12/29", status="ACTIVE")
    db.add(c)
    db.commit()
    db.refresh(c)
    return {"success": True, "data": _out(c)}


@router.patch("/{cid}")
def patch_card(cid: int, body: dict, db: Session = Depends(get_db), user=Depends(get_current_user)):
    c = db.query(Card).filter(Card.id == cid).first()
    if not c:
        raise HTTPException(404, "Not found")
    acc = owns_account(db, user, c.account_id)
    if not acc:
        raise HTTPException(403, "Forbidden")
    if "status" in body:
        c.status = body["status"]
    if "spending_limit" in body:
        c.spending_limit = Decimal(str(body["spending_limit"]))
    db.commit()
    return {"success": True, "data": _out(c)}
