from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.models.all import Notification
from app.utils.pagination import paginate_query

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
def list_n(page: int = 1, size: int = 20, unread: bool = False, db: Session = Depends(get_db),
           user=Depends(get_current_user)):
    q = db.query(Notification).filter(Notification.user_id == user.id)
    if unread:
        q = q.filter(Notification.is_read == False)  # noqa: E712
    q = q.order_by(Notification.id.desc())
    res = paginate_query(q, page, size)
    res["items"] = [{"id": n.id, "title": n.title, "message": n.message, "type": n.type,
                     "is_read": n.is_read} for n in res["items"]]
    res["unread_count"] = db.query(Notification).filter(Notification.user_id == user.id,
                                                        Notification.is_read == False).count()  # noqa: E712
    return {"success": True, "data": res}


@router.patch("/{nid}/read")
def mark_read(nid: int, db: Session = Depends(get_db), user=Depends(get_current_user)):
    n = db.query(Notification).filter(Notification.id == nid, Notification.user_id == user.id).first()
    if not n:
        raise HTTPException(404, "Not found")
    n.is_read = True
    db.commit()
    return {"success": True, "data": {"message": "Marked read"}}


@router.post("/read-all")
def read_all(db: Session = Depends(get_db), user=Depends(get_current_user)):
    db.query(Notification).filter(Notification.user_id == user.id).update({"is_read": True})
    db.commit()
    return {"success": True, "data": {"message": "All marked read"}}
