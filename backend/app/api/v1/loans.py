from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user, require_roles
from app.models.all import Account, Customer, Loan, LoanPayment, Transaction, User
from app.schemas.all import LoanIn, LoanStatusIn
from app.services.account_service import owns_account, q, user_customer_id
from app.services.deposit_service import emi_calc
from app.utils.helpers import audit, notify
from app.utils.refs import gen_reference
from app.utils.pagination import paginate_query

router = APIRouter(prefix="/loans", tags=["loans"])
admin_router = APIRouter(prefix="/admin/loan-applications", tags=["admin-loans"])
Staff = require_roles("admin", "manager", "employee")


def _out(lo: Loan):
    return {"id": lo.id, "reference": lo.reference, "customer_id": lo.customer_id,
            "account_id": lo.account_id, "loan_type": lo.loan_type,
            "principal": str(lo.principal), "approved_amount": str(lo.approved_amount) if lo.approved_amount is not None else None,
            "interest_rate": str(lo.interest_rate), "tenure_months": lo.tenure_months,
            "emi": str(lo.emi), "outstanding": str(lo.outstanding), "status": lo.status,
            "purpose": lo.purpose, "created_at": str(lo.created_at)}


@router.get("/calculator")
def calculator(principal: float, interest_rate: float, tenure_months: int,
               _: User = Depends(get_current_user)):
    emi = emi_calc(principal, interest_rate, tenure_months)
    return {"success": True, "data": {"emi": str(emi), "total": str(emi * tenure_months)}}


@router.get("")
def list_loans(page: int = 1, size: int = 20, status: str = "", db: Session = Depends(get_db),
               user=Depends(get_current_user)):
    role = (user.role.name if user.role else "").lower()
    qy = db.query(Loan)
    if role == "customer":
        cid = user_customer_id(db, user)
        qy = qy.filter(Loan.customer_id == cid)
    if status:
        qy = qy.filter(Loan.status == status.upper())
    qy = qy.order_by(Loan.id.desc())
    res = paginate_query(qy, page, size)
    res["items"] = [_out(lo) for lo in res["items"]]
    return {"success": True, "data": res}


@router.post("", status_code=201)
@router.post("/apply", status_code=201)
def apply_loan(body: LoanIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    role = (user.role.name if user.role else "").lower()
    cid = body.customer_id or user_customer_id(db, user)
    if role == "customer" and cid != user_customer_id(db, user):
        raise HTTPException(403, "Forbidden")
    if not cid:
        raise HTTPException(400, "customer_id required")
    # validate disbursement account belongs to customer
    aid = body.account_id
    if aid:
        acc = owns_account(db, user, aid)
        if not acc:
            raise HTTPException(403, "Disbursement account not accessible")
        if acc.customer_id != cid and role == "customer":
            raise HTTPException(403, "Forbidden")
    else:
        from app.models.all import Account as Acc
        acc = db.query(Acc).filter(Acc.customer_id == cid, Acc.is_deleted == False).first()  # noqa: E712
        aid = acc.id if acc else None
    emi = emi_calc(body.principal, body.interest_rate, body.tenure_months)
    lo = Loan(reference=gen_reference("LN"), customer_id=cid, account_id=aid,
              loan_type=body.loan_type, principal=Decimal(body.principal),
              interest_rate=Decimal(body.interest_rate), tenure_months=body.tenure_months,
              emi=emi, outstanding=Decimal(body.principal), status="PENDING",
              purpose=body.purpose or "", monthly_income=body.monthly_income,
              employment_info=body.employment_info or "")
    db.add(lo)
    audit(db, "LOAN_APPLIED", user_id=user.id, entity="loan", entity_id=lo.reference,
          meta={"amount": str(body.principal)})
    notify(db, user.id, "Loan application submitted",
           f"{lo.reference}: ₹{body.principal} pending review.", "LOAN")
    db.commit()
    db.refresh(lo)
    return {"success": True, "data": _out(lo)}


@router.get("/{lid}")
def get_loan(lid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    lo = db.query(Loan).filter(Loan.id == lid).first()
    if not lo:
        raise HTTPException(404, "Not found")
    role = (user.role.name if user.role else "").lower()
    if role == "customer" and lo.customer_id != user_customer_id(db, user):
        raise HTTPException(403, "Forbidden")
    pays = db.query(LoanPayment).filter(LoanPayment.loan_id == lid).all()
    d = _out(lo)
    d["payments"] = [{"id": p.id, "amount": str(p.amount), "status": p.status} for p in pays]
    return {"success": True, "data": d}


@admin_router.get("")
def admin_list(page: int = 1, size: int = 20, status: str = "",
               db: Session = Depends(get_db), _: User = Depends(Staff)):
    qy = db.query(Loan)
    if status:
        qy = qy.filter(Loan.status == status.upper())
    qy = qy.order_by(Loan.id.desc())
    res = paginate_query(qy, page, size)
    items = []
    for lo in res["items"]:
        d = _out(lo)
        cust = db.query(Customer).filter(Customer.id == lo.customer_id).first()
        d["customer"] = ((cust.first_name or "") + " " + (cust.last_name or "")).strip() if cust else ""
        items.append(d)
    res["items"] = items
    return {"success": True, "data": res}


@admin_router.post("/{lid}/approve")
def approve(lid: int, body: dict | None = None, db: Session = Depends(get_db),
            staff: User = Depends(Staff)):
    lo = db.query(Loan).filter(Loan.id == lid).first()
    if not lo:
        raise HTTPException(404, "Not found")
    if lo.status not in ("PENDING", "UNDER_REVIEW"):
        raise HTTPException(400, "Loan already processed")
    approved = Decimal(str((body or {}).get("approved_amount", lo.principal)))
    if approved <= 0 or approved > Decimal(lo.principal) * Decimal("1.0"):
        # allow equal or less; cap at requested
        if approved > Decimal(lo.principal):
            raise HTTPException(400, "Approved amount cannot exceed requested")
    acc = db.query(Account).filter(Account.id == lo.account_id).first() if lo.account_id else None
    if not acc:
        from app.models.all import Account as Acc
        acc = db.query(Acc).filter(Acc.customer_id == lo.customer_id, Acc.is_deleted == False).first()  # noqa: E712
        if not acc:
            raise HTTPException(400, "No disbursement account found")
        lo.account_id = acc.id
    if acc.status != "ACTIVE":
        raise HTTPException(400, "Disbursement account must be ACTIVE")
    # recompute EMI on approved amount
    emi = emi_calc(float(approved), float(lo.interest_rate), lo.tenure_months)
    # atomic disbursement
    acc.balance = q(Decimal(acc.balance) + approved)
    ref = gen_reference("TXN")
    db.add(Transaction(reference=ref, account_id=acc.id, type="DEPOSIT",
                       direction="CREDIT", amount=q(approved), balance_after=q(acc.balance),
                       status="COMPLETED", description=f"Loan disbursement {lo.reference}"))
    lo.approved_amount = q(approved)
    lo.emi = emi
    lo.outstanding = q(approved)
    lo.status = "ACTIVE"
    lo.reviewed_by = staff.id
    lo.review_note = str((body or {}).get("note", ""))
    audit(db, "ADMIN_ACTION", user_id=staff.id, entity="loan", entity_id=lo.reference,
          meta={"op": "approve", "approved": str(approved)})
    cust = db.query(Customer).filter(Customer.id == lo.customer_id).first()
    if cust:
        notify(db, cust.user_id, "Loan approved & disbursed",
               f"{lo.reference}: ₹{approved} credited to your account.", "LOAN")
    db.commit()
    db.refresh(lo)
    return {"success": True, "data": _out(lo)}


@admin_router.post("/{lid}/reject")
def reject(lid: int, body: dict | None = None, db: Session = Depends(get_db),
           staff: User = Depends(Staff)):
    lo = db.query(Loan).filter(Loan.id == lid).first()
    if not lo:
        raise HTTPException(404, "Not found")
    if lo.status not in ("PENDING", "UNDER_REVIEW"):
        raise HTTPException(400, "Loan already processed")
    lo.status = "REJECTED"
    lo.reviewed_by = staff.id
    lo.review_note = str((body or {}).get("reason", (body or {}).get("note", "")))
    audit(db, "ADMIN_ACTION", user_id=staff.id, entity="loan", entity_id=lo.reference,
          meta={"op": "reject"})
    cust = db.query(Customer).filter(Customer.id == lo.customer_id).first()
    if cust:
        notify(db, cust.user_id, "Loan rejected", f"{lo.reference}: {lo.review_note}", "LOAN")
    db.commit()
    return {"success": True, "data": _out(lo)}


@router.patch("/{lid}/status")
def set_status(lid: int, body: LoanStatusIn, db: Session = Depends(get_db),
               user=Depends(get_current_user)):
    # legacy staff path kept for UNDER_REVIEW transitions (no money movement)
    role = (user.role.name if user.role else "").lower()
    if role not in ("admin", "manager", "employee"):
        raise HTTPException(403, "Forbidden")
    lo = db.query(Loan).filter(Loan.id == lid).first()
    if not lo:
        raise HTTPException(404, "Not found")
    if body.status.upper() in ("APPROVED", "ACTIVE"):
        raise HTTPException(400, "Use admin approve endpoint for disbursement")
    lo.status = body.status.upper()
    db.commit()
    return {"success": True, "data": _out(lo)}


@router.post("/{lid}/pay")
def pay_loan(lid: int, body: dict, db: Session = Depends(get_db), user=Depends(get_current_user)):
    lo = db.query(Loan).filter(Loan.id == lid).first()
    if not lo:
        raise HTTPException(404, "Not found")
    role = (user.role.name if user.role else "").lower()
    if role == "customer" and lo.customer_id != user_customer_id(db, user):
        raise HTTPException(403, "Forbidden")
    if lo.status not in ("ACTIVE", "APPROVED"):
        raise HTTPException(400, "Loan is not active")
    amt = Decimal(str(body.get("amount", lo.emi)))
    if amt <= 0:
        raise HTTPException(400, "Invalid amount")
    lo.outstanding = max(Decimal("0.00"), Decimal(lo.outstanding) - amt)
    if lo.outstanding == 0:
        lo.status = "COMPLETED"
    db.add(LoanPayment(loan_id=lid, amount=amt, status="COMPLETED"))
    audit(db, "LOAN_REPAID", user_id=user.id, entity="loan", entity_id=lo.reference,
          meta={"amount": str(amt)})
    db.commit()
    return {"success": True, "data": _out(lo)}
