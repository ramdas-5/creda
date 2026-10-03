from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.models.all import SupportMessage, SupportTicket
from app.schemas.all import TicketIn, TicketReply
from app.utils.pagination import paginate_query

router = APIRouter(prefix="/support", tags=["support"])


@router.get("")
def list_tickets(page: int = 1, size: int = 20, status: str = "", db: Session = Depends(get_db),
                 user=Depends(get_current_user)):
    role = (user.role.name if user.role else "").lower()
    q = db.query(SupportTicket)
    if role == "customer":
        q = q.filter(SupportTicket.user_id == user.id)
    if status:
        q = q.filter(SupportTicket.status == status)
    q = q.order_by(SupportTicket.id.desc())
    res = paginate_query(q, page, size)
    res["items"] = [{"id": t.id, "subject": t.subject, "category": t.category, "status": t.status,
                     "priority": t.priority} for t in res["items"]]
    return {"success": True, "data": res}


@router.post("", status_code=201)
def create_ticket(body: TicketIn, db: Session = Depends(get_db), user=Depends(get_current_user)):
    t = SupportTicket(user_id=user.id, subject=body.subject, category=body.category,
                      priority=body.priority, status="OPEN")
    db.add(t)
    db.flush()
    if body.message:
        db.add(SupportMessage(ticket_id=t.id, sender_id=user.id, message=body.message))
    db.commit()
    db.refresh(t)
    return {"success": True, "data": {"id": t.id, "status": t.status}}


@router.get("/{tid}")
def get_ticket(tid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    t = db.query(SupportTicket).filter(SupportTicket.id == tid).first()
    if not t:
        raise HTTPException(404, "Not found")
    role = (user.role.name if user.role else "").lower()
    if role == "customer" and t.user_id != user.id:
        raise HTTPException(403, "Forbidden")
    msgs = db.query(SupportMessage).filter(SupportMessage.ticket_id == tid).order_by(SupportMessage.id.asc()).all()
    return {"success": True, "data": {"id": t.id, "subject": t.subject, "status": t.status,
                                      "messages": [{"sender_id": m.sender_id, "message": m.message,
                                                    "created_at": str(m.created_at)} for m in msgs]}}


@router.post("/{tid}/reply")
def reply(tid: int, body: TicketReply, db: Session = Depends(get_db), user=Depends(get_current_user)):
    t = db.query(SupportTicket).filter(SupportTicket.id == tid).first()
    if not t:
        raise HTTPException(404, "Not found")
    role = (user.role.name if user.role else "").lower()
    if role == "customer" and t.user_id != user.id:
        raise HTTPException(403, "Forbidden")
    db.add(SupportMessage(ticket_id=tid, sender_id=user.id, message=body.message))
    if role in ("admin", "manager", "employee") and t.status == "OPEN":
        t.status = "IN_PROGRESS"
    db.commit()
    return {"success": True, "data": {"message": "Reply added"}}


@router.patch("/{tid}")
def set_status(tid: int, body: dict, db: Session = Depends(get_db), user=Depends(get_current_user)):
    role = (user.role.name if user.role else "").lower()
    if role not in ("admin", "manager", "employee"):
        raise HTTPException(403, "Forbidden")
    t = db.query(SupportTicket).filter(SupportTicket.id == tid).first()
    if not t:
        raise HTTPException(404, "Not found")
    if "status" in body:
        t.status = body["status"]
    if "assigned_to" in body:
        t.assigned_to = body["assigned_to"]
    db.commit()
    return {"success": True, "data": {"id": t.id, "status": t.status}}
