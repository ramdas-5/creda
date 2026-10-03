"""Admin / staff control plane.

Customer workspace: own accounts, withdraw, transfer, deposit REQUESTS (pending),
loan apply, card request, statements, notifications.
Staff workspace: request center (deposit/loan/card/support approvals),
counter operations, freezes, reversals, KYC, branches, audit.
"""
from decimal import Decimal
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import get_db, require_roles
from app.models.all import (
    Account, AccountType, AuditLog, Branch, CardRequest, Customer, DepositRequest, Loan,
    SupportTicket, Transaction, Transfer, User,
)
from app.schemas.all import AccountTypeIn, BranchIn, DepositIn, WithdrawIn
from app.services.account_service import deposit_to, withdraw_from
from app.utils.helpers import audit
from app.utils.pagination import paginate_query

router = APIRouter(prefix="/admin", tags=["admin"])
Staff = require_roles("admin", "manager", "employee")
AdminOnly = require_roles("admin")


def _overview_data(db: Session) -> dict:
    total_customers = db.query(func.count(Customer.id)).scalar() or 0
    total_accounts = db.query(func.count(Account.id)).filter(Account.is_deleted == False).scalar() or 0  # noqa: E712
    deposits = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.direction == "CREDIT").scalar() or 0
    withdrawals = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.direction == "DEBIT").scalar() or 0
    active = db.query(func.count(User.id)).filter(
        User.is_active == True, User.is_deleted == False).scalar() or 0  # noqa: E712
    pending_loans = db.query(func.count(Loan.id)).filter(
        Loan.status.in_(["PENDING", "UNDER_REVIEW", "APPLIED"])).scalar() or 0
    pending_kyc = db.query(func.count(Customer.id)).filter(
        Customer.kyc_status.in_(["PENDING", "SUBMITTED"])).scalar() or 0
    try:
        pending_deposits = db.query(func.count(DepositRequest.id)).filter(
            DepositRequest.status == "PENDING").scalar() or 0
    except Exception:
        pending_deposits = 0
    try:
        pending_cards = db.query(func.count(CardRequest.id)).filter(
            CardRequest.status == "PENDING").scalar() or 0
    except Exception:
        pending_cards = 0
    try:
        pending_support = db.query(func.count(SupportTicket.id)).filter(
            SupportTicket.status == "OPEN").scalar() or 0
    except Exception:
        pending_support = 0
    frozen = db.query(func.count(Account.id)).filter(Account.status == "FROZEN").scalar() or 0
    return {
        "total_customers": total_customers,
        "total_accounts": total_accounts,
        "total_deposits": str(deposits),
        "total_withdrawals": str(withdrawals),
        "active_users": active,
        "pending_approvals": pending_loans + pending_kyc + pending_deposits + pending_cards,
        "pending_loans": pending_loans,
        "pending_kyc": pending_kyc,
        "pending_deposits": pending_deposits,
        "pending_cards": pending_cards,
        "pending_support": pending_support,
        "frozen_accounts": frozen,
    }


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), _: User = Depends(Staff)):
    return {"success": True, "data": _overview_data(db)}


@router.get("/overview")
def overview(db: Session = Depends(get_db), _: User = Depends(Staff)):
    d = _overview_data(db)
    # monthly volume (last 6 buckets) for charts
    vols = db.query(
        func.to_char(Transaction.created_at, "YYYY-MM").label("label") if db.bind and db.bind.dialect.name == "postgresql"
        else func.strftime("%Y-%m", Transaction.created_at).label("label"),
        func.count(Transaction.id).label("volume"),
    ).group_by("label").order_by("label").limit(12).all() if False else []
    try:
        rows = db.query(Transaction.created_at).order_by(Transaction.created_at.desc()).limit(500).all()
        buckets: dict[str, int] = {}
        for (dt,) in rows:
            if not dt:
                continue
            label = dt.strftime("%Y-%m") if isinstance(dt, datetime) else str(dt)[:7]
            buckets[label] = buckets.get(label, 0) + 1
        vols = [{"label": k, "volume": v} for k, v in sorted(buckets.items())[-6:]]
    except Exception:
        vols = []
    d["volume"] = vols
    d["monthly_activity"] = vols
    try:
        dw = db.query(Transaction.type, func.coalesce(func.sum(Transaction.amount), 0)).group_by(
            Transaction.type).all()
        d["by_type"] = [{"type": t, "total": str(s)} for t, s in dw]
    except Exception:
        d["by_type"] = []
    d["deposits_withdrawals"] = [
        {"month": v["label"], "deposits": v["volume"], "withdrawals": 0} for v in vols
    ]
    return {"success": True, "data": d}


# ---- request center ----
@router.get("/requests/summary")
def request_summary(db: Session = Depends(get_db), _: User = Depends(Staff)):
    d = _overview_data(db)
    return {"success": True, "data": {
        "deposit_requests": d.get("pending_deposits", 0),
        "loan_applications": d.get("pending_loans", 0),
        "card_requests": d.get("pending_cards", 0),
        "support_requests": d.get("pending_support", 0),
        "pending_approvals": d.get("pending_approvals", 0),
    }}


# ---- users ----
def _user_out(u: User) -> dict:
    return {"id": u.id, "email": u.email, "full_name": u.full_name, "phone": u.phone,
            "role": u.role.name if u.role else "", "roles": [u.role.name if u.role else ""],
            "is_active": u.is_active}


@router.get("/users")
def admin_users(page: int = 1, size: int = 20, search: str = "",
                db: Session = Depends(get_db), _: User = Depends(Staff)):
    q = db.query(User).filter(User.is_deleted == False)  # noqa: E712
    if search:
        q = q.filter(User.email.contains(search) | User.full_name.contains(search))
    q = q.order_by(User.id.desc())
    res = paginate_query(q, page, size)
    res["items"] = [_user_out(u) for u in res["items"]]
    return {"success": True, "data": res}


@router.post("/users/{uid}/suspend")
def suspend_user(uid: int, db: Session = Depends(get_db), u: User = Depends(AdminOnly)):
    target = db.query(User).filter(User.id == uid).first()
    if not target:
        raise HTTPException(404, "Not found")
    if target.id == u.id:
        raise HTTPException(400, "Cannot suspend yourself")
    target.is_active = False
    audit(db, "ADMIN_ACTION", user_id=u.id, entity="user", entity_id=str(uid),
          meta={"op": "suspend"})
    db.commit()
    return {"success": True, "data": _user_out(target)}


@router.post("/users/{uid}/activate")
def activate_user(uid: int, db: Session = Depends(get_db), u: User = Depends(AdminOnly)):
    target = db.query(User).filter(User.id == uid).first()
    if not target:
        raise HTTPException(404, "Not found")
    target.is_active = True
    target.failed_attempts = 0
    target.locked_until = None
    audit(db, "ADMIN_ACTION", user_id=u.id, entity="user", entity_id=str(uid),
          meta={"op": "activate"})
    db.commit()
    return {"success": True, "data": _user_out(target)}


# ---- customers / KYC ----
@router.get("/customers")
def admin_customers(page: int = 1, size: int = 20, search: str = "",
                     db: Session = Depends(get_db), _: User = Depends(Staff)):
    q = db.query(Customer).filter(Customer.is_deleted == False)  # noqa: E712
    if search:
        q = q.filter(Customer.first_name.contains(search) | Customer.last_name.contains(search)
                     | Customer.phone.contains(search))
    q = q.order_by(Customer.id.desc())
    res = paginate_query(q, page, size)
    items = []
    for c in res["items"]:
        email = c.user.email if getattr(c, "user", None) else ""
        items.append({"id": c.id, "user_id": c.user_id, "email": email,
                      "full_name": f"{c.first_name} {c.last_name}".strip(),
                      "first_name": c.first_name, "phone": c.phone,
                      "kyc_status": c.kyc_status, "status": c.kyc_status})
    res["items"] = items
    return {"success": True, "data": res}


@router.patch("/customers/{cid}/kyc")
def set_kyc(cid: int, body: dict, db: Session = Depends(get_db), u: User = Depends(Staff)):
    status = str(body.get("kyc_status", body.get("status", ""))).upper()
    if status not in ("VERIFIED", "REJECTED", "PENDING", "SUBMITTED", "NOT_SUBMITTED"):
        raise HTTPException(400, "Invalid kyc_status")
    c = db.query(Customer).filter(Customer.id == cid).first()
    if not c:
        raise HTTPException(404, "Not found")
    c.kyc_status = status
    audit(db, "ADMIN_ACTION", user_id=u.id, entity="customer", entity_id=str(cid),
          meta={"op": "kyc", "status": status})
    db.commit()
    return {"success": True, "data": {"id": c.id, "kyc_status": c.kyc_status}}


# ---- accounts ----
def _acc_out(a: Account) -> dict:
    return {"id": a.id, "account_number": a.account_number,
            "masked": ("****" + a.account_number[-4:]) if len(a.account_number) >= 4 else a.account_number,
            "customer_id": a.customer_id, "account_type": a.account_type_id,
            "balance": str(a.balance), "status": a.status,
            "branch_id": a.branch_id}


@router.get("/accounts")
def admin_accounts(page: int = 1, size: int = 20, status: str = "",
                   db: Session = Depends(get_db), _: User = Depends(Staff)):
    q = db.query(Account).filter(Account.is_deleted == False)  # noqa: E712
    if status:
        q = q.filter(Account.status == status)
    q = q.order_by(Account.id.desc())
    res = paginate_query(q, page, size)
    res["items"] = [_acc_out(a) for a in res["items"]]
    return {"success": True, "data": res}


@router.patch("/accounts/{aid}/status")
def admin_account_status(aid: int, body: dict, db: Session = Depends(get_db),
                         u: User = Depends(Staff)):
    status = str(body.get("status", "")).upper()
    if status not in ("ACTIVE", "FROZEN", "CLOSED", "DORMANT"):
        raise HTTPException(400, "Status must be ACTIVE/FROZEN/CLOSED/DORMANT")
    acc = db.query(Account).filter(Account.id == aid).first()
    if not acc:
        raise HTTPException(404, "Not found")
    acc.status = status
    audit(db, "ADMIN_ACTION", user_id=u.id, entity="account", entity_id=str(aid),
          meta={"op": "status", "status": status})
    db.commit()
    return {"success": True, "data": _acc_out(acc)}


@router.post("/teller/deposit")
def teller_deposit(body: DepositIn, db: Session = Depends(get_db), u: User = Depends(Staff)):
    d = deposit_to(db, u, body.account_id, Decimal(body.amount), body.method or "CASH")
    return {"success": True, "data": {"reference": d.reference, "amount": str(d.amount)}}


@router.post("/teller/withdraw")
def teller_withdraw(body: WithdrawIn, db: Session = Depends(get_db), u: User = Depends(Staff)):
    w = withdraw_from(db, u, body.account_id, Decimal(body.amount), body.method or "CASH")
    return {"success": True, "data": {"reference": w.reference, "amount": str(w.amount)}}


# ---- transactions ----
@router.get("/transactions")
def admin_txns(page: int = 1, size: int = 20, status: str = "", search: str = "",
               db: Session = Depends(get_db), _: User = Depends(Staff)):
    q = db.query(Transaction)
    if status:
        q = q.filter(Transaction.status == status)
    if search:
        q = q.filter(Transaction.reference.contains(search) | Transaction.description.contains(search))
    q = q.order_by(Transaction.id.desc())
    res = paginate_query(q, page, size)
    res["items"] = [{"id": t.id, "reference": t.reference, "reference_number": t.reference,
                     "account_id": t.account_id, "type": t.type, "amount": str(t.amount),
                     "status": t.status, "created_at": str(t.created_at)} for t in res["items"]]
    return {"success": True, "data": res}


@router.post("/transactions/{tid}/reverse")
def reverse_txn(tid: int, db: Session = Depends(get_db), u: User = Depends(Staff)):
    t = db.query(Transaction).filter(Transaction.id == tid).first()
    if not t:
        raise HTTPException(404, "Not found")
    if t.status == "REVERSED":
        raise HTTPException(400, "Already reversed")
    acc = db.query(Account).filter(Account.id == t.account_id).first()
    if not acc:
        raise HTTPException(404, "Account not found")
    amt = Decimal(t.amount)
    if t.direction == "CREDIT":
        if Decimal(acc.balance) < amt:
            raise HTTPException(400, "Insufficient balance to reverse")
        acc.balance = Decimal(acc.balance) - amt
    else:
        acc.balance = Decimal(acc.balance) + amt
    t.status = "REVERSED"
    audit(db, "ADMIN_ACTION", user_id=u.id, entity="transaction", entity_id=str(t.reference),
          meta={"op": "reverse", "amount": str(amt)})
    db.commit()
    return {"success": True, "data": {"id": t.id, "reference": t.reference, "status": t.status,
                                      "balance": str(acc.balance)}}


# ---- reports ----
@router.get("/reports")
def reports(db: Session = Depends(get_db), _: User = Depends(Staff)):
    d = _overview_data(db)
    total_transfers = db.query(func.count(Transfer.id)).scalar() or 0
    total_loans_out = db.query(func.coalesce(func.sum(Loan.outstanding), 0)).scalar() or 0
    return {"success": True, "data": {**d, "total_transfers": total_transfers,
                                      "loans_outstanding": str(total_loans_out),
                                      "volume": [], "deposits_withdrawals": []}}


# ---- branches ----
@router.get("/branches")
def list_branches(db: Session = Depends(get_db), _: User = Depends(Staff)):
    items = db.query(Branch).filter(Branch.is_deleted == False).all()  # noqa: E712
    return {"success": True, "data": [{"id": b.id, "code": b.code, "name": b.name,
                                       "address": b.address, "phone": b.phone,
                                       "status": b.status} for b in items]}


@router.post("/branches", status_code=201)
def create_branch(body: BranchIn, db: Session = Depends(get_db), u: User = Depends(AdminOnly)):
    if db.query(Branch).filter(Branch.code == body.code).first():
        raise HTTPException(400, "Branch code exists")
    b = Branch(code=body.code, name=body.name, address=body.address, phone=body.phone,
               email=body.email, manager=body.manager, status=body.status)
    db.add(b)
    audit(db, "ADMIN_ACTION", user_id=u.id, entity="branch", entity_id=b.code,
          meta={"op": "create"})
    db.commit()
    db.refresh(b)
    return {"success": True, "data": {"id": b.id, "code": b.code}}


@router.get("/account-types")
def list_types(db: Session = Depends(get_db), _: User = Depends(Staff)):
    items = db.query(AccountType).all()
    return {"success": True, "data": [{"id": t.id, "code": t.code, "name": t.name} for t in items]}


@router.post("/account-types", status_code=201)
def create_type(body: AccountTypeIn, db: Session = Depends(get_db), _: User = Depends(AdminOnly)):
    t = AccountType(code=body.code, name=body.name, interest_rate=body.interest_rate,
                    min_balance=body.min_balance, description=body.description)
    db.add(t)
    db.commit()
    db.refresh(t)
    return {"success": True, "data": {"id": t.id}}


# ---- settings (no dedicated table: expose safe runtime config) ----
_SETTINGS_STORE: dict = {}


@router.get("/settings")
def get_settings(_: User = Depends(AdminOnly)):
    from app.core.config import settings
    base = {"ENVIRONMENT": settings.ENVIRONMENT,
            "ACCESS_TOKEN_EXPIRE_MINUTES": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            "REFRESH_TOKEN_EXPIRE_DAYS": settings.REFRESH_TOKEN_EXPIRE_DAYS,
            "CORS_ORIGINS": settings.CORS_ORIGINS}
    base.update(_SETTINGS_STORE)
    return {"success": True, "data": base}


@router.put("/settings")
def put_settings(body: dict, db: Session = Depends(get_db), u: User = Depends(AdminOnly)):
    allowed = {"maintenance_mode", "transfer_limit", "support_email", "notice"}
    for k, v in (body or {}).items():
        if k in allowed:
            _SETTINGS_STORE[k] = v
    audit(db, "ADMIN_ACTION", user_id=u.id, entity="settings", entity_id="global",
          meta={"op": "update"})
    db.commit()
    return {"success": True, "data": _SETTINGS_STORE}
