from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.deps import get_db, require_roles
from app.models.all import AuditLog, User
from app.utils.pagination import paginate_query

router = APIRouter(prefix="/audit", tags=["audit"])


@router.get("")
def list_audit(page: int = 1, size: int = 20, action: str = "", db: Session = Depends(get_db),
               _: User = Depends(require_roles("admin", "manager"))):
    q = db.query(AuditLog)
    if action:
        q = q.filter(AuditLog.action == action)
    q = q.order_by(AuditLog.id.desc())
    res = paginate_query(q, page, size)
    res["items"] = [{"id": a.id, "user_id": a.user_id, "action": a.action, "entity": a.entity,
                     "entity_id": a.entity_id, "created_at": str(a.created_at)} for a in res["items"]]
    return {"success": True, "data": res}
