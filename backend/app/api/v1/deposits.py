from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.models.all import FixedDeposit, RecurringDeposit
from app.schemas.all import FDIn, RDIn
from app.services.account_service import user_customer_id
from app.services.deposit_service import fd_maturity, rd_maturity
from app.utils.refs import gen_reference
from app.utils.pagination import paginate_query
from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta

fd_router = APIRouter(prefix="/fixed-deposits", tags=["fixed-deposits"])
rd_router = APIRouter(prefix="/recurring-deposits", tags=["recurring-deposits"])


@fd_router.get("")
def list_fd(page: int = 1, size: int = 20, db: Session = Depends(get_db), user=Depends(get_current_user)):
    role = (user.role.name if user.role else "").lower()
    q = db.query(FixedDeposit)
    if role == "customer":
        q = q.filter(FixedDeposit.customer_id == user_customer_id(db, user))
    q = q.order_by(FixedDeposit.id.desc())
    res = paginate_query(q, page, size)
    res["items"] = [{"id": f.id, "reference": f.reference, "principal": str(f.principal),
                     "interest_rate": str(f.interest_rate), "tenure_months": f.tenure_months,
                     "maturity_amount": str(f.maturity_amount), "status": f.status} for f in res["items"]]
    return {"success": True, "data": res}


@fd_router.post("", status_code=201)
def create_fd(body: FDIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    cid = body.customer_id or user_customer_id(db, user)
    if not cid:
        raise HTTPException(400, "customer_id required")
    mat_amt, mat_date = fd_maturity(body.principal, body.interest_rate, body.tenure_months)
    f = FixedDeposit(reference=gen_reference("FD"), customer_id=cid, account_id=body.account_id,
                     principal=Decimal(body.principal), interest_rate=Decimal(body.interest_rate),
                     tenure_months=body.tenure_months, maturity_date=mat_date,
                     maturity_amount=mat_amt, status="ACTIVE")
    db.add(f)
    db.commit()
    db.refresh(f)
    return {"success": True, "data": {"reference": f.reference, "maturity_amount": str(f.maturity_amount)}}


@rd_router.get("")
def list_rd(page: int = 1, size: int = 20, db: Session = Depends(get_db), user=Depends(get_current_user)):
    role = (user.role.name if user.role else "").lower()
    q = db.query(RecurringDeposit)
    if role == "customer":
        q = q.filter(RecurringDeposit.customer_id == user_customer_id(db, user))
    q = q.order_by(RecurringDeposit.id.desc())
    res = paginate_query(q, page, size)
    res["items"] = [{"id": r.id, "reference": r.reference, "monthly_amount": str(r.monthly_amount),
                     "maturity_amount": str(r.maturity_amount), "status": r.status} for r in res["items"]]
    return {"success": True, "data": res}


@rd_router.post("", status_code=201)
def create_rd(body: RDIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    cid = body.customer_id or user_customer_id(db, user)
    if not cid:
        raise HTTPException(400, "customer_id required")
    mat = rd_maturity(body.monthly_amount, body.interest_rate, body.tenure_months)
    nxt = datetime.now(timezone.utc) + relativedelta(months=1)
    r = RecurringDeposit(reference=gen_reference("RD"), customer_id=cid,
                         monthly_amount=Decimal(body.monthly_amount),
                         interest_rate=Decimal(body.interest_rate),
                         tenure_months=body.tenure_months, maturity_amount=mat,
                         next_installment=nxt, status="ACTIVE")
    db.add(r)
    db.commit()
    db.refresh(r)
    return {"success": True, "data": {"reference": r.reference, "maturity_amount": str(r.maturity_amount)}}
