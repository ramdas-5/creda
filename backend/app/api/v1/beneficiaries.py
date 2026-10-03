from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.models.all import Beneficiary
from app.schemas.all import BeneficiaryIn
from app.utils.helpers import audit
from app.utils.pagination import paginate_query

router = APIRouter(prefix="/beneficiaries", tags=["beneficiaries"])


def _out(b: Beneficiary):
    return {"id": b.id, "name": b.name, "nickname": b.nickname, "account_number": b.account_number,
            "bank_name": b.bank_name, "ifsc": b.ifsc, "is_verified": b.is_verified, "is_active": b.is_active}


@router.get("")
def list_b(page: int = 1, size: int = 20, search: str = "", db: Session = Depends(get_db),
           user=Depends(get_current_user)):
    q = db.query(Beneficiary).filter(Beneficiary.user_id == user.id, Beneficiary.is_deleted == False)  # noqa: E712
    if search:
        q = q.filter(Beneficiary.name.contains(search) | Beneficiary.nickname.contains(search))
    q = q.order_by(Beneficiary.id.desc())
    res = paginate_query(q, page, size)
    res["items"] = [_out(b) for b in res["items"]]
    return {"success": True, "data": res}


@router.post("", status_code=201)
def add_b(body: BeneficiaryIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    b = Beneficiary(user_id=user.id, name=body.name, nickname=body.nickname,
                    account_number=body.account_number, bank_name=body.bank_name, ifsc=body.ifsc)
    db.add(b)
    audit(db, "BENEFICIARY_CREATED", user_id=user.id, entity="beneficiary", entity_id=body.account_number)
    db.commit()
    db.refresh(b)
    return {"success": True, "data": _out(b)}


@router.patch("/{bid}")
def edit_b(bid: int, body: dict, db: Session = Depends(get_db), user=Depends(get_current_user)):
    b = db.query(Beneficiary).filter(Beneficiary.id == bid, Beneficiary.user_id == user.id).first()
    if not b:
        raise HTTPException(404, "Not found")
    for f in ("name", "nickname", "bank_name", "ifsc", "is_active", "is_verified"):
        if f in body:
            setattr(b, f, body[f])
    db.commit()
    return {"success": True, "data": _out(b)}


@router.delete("/{bid}")
def del_b(bid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    b = db.query(Beneficiary).filter(Beneficiary.id == bid, Beneficiary.user_id == user.id).first()
    if not b:
        raise HTTPException(404, "Not found")
    b.is_deleted = True
    b.is_active = False
    audit(db, "BENEFICIARY_DELETED", user_id=user.id, entity="beneficiary", entity_id=str(bid))
    db.commit()
    return {"success": True, "data": {"message": "Deleted"}}
