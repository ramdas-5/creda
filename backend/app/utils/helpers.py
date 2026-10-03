import json
from sqlalchemy.orm import Session
from app.models.all import AuditLog, Notification


def audit(db: Session, action: str, user_id=None, entity: str = "", entity_id: str = "",
          meta: dict | None = None, ip: str = "", user_agent: str = ""):
    db.add(AuditLog(user_id=user_id, action=action, entity=entity, entity_id=str(entity_id),
                    meta_info=json.dumps(meta or {}), ip=ip or "", user_agent=user_agent or ""))


def notify(db: Session, user_id: int, title: str, message: str = "", type: str = "INFO"):
    db.add(Notification(user_id=user_id, title=title, message=message, type=type))
