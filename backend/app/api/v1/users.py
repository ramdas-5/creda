from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user, require_roles
from app.models.all import User
from app.utils.pagination import paginate_query

router = APIRouter(prefix="/users", tags=["users"])


def _out(u: User):
    return {"id": u.id, "email": u.email, "full_name": u.full_name, "phone": u.phone,
            "role": u.role.name if u.role else "", "is_active": u.is_active}


@router.get("")
def list_users(page: int = 1, size: int = 20, search: str = "", db: Session = Depends(get_db),
               _: User = Depends(require_roles("admin", "manager"))):
    q = db.query(User).filter(User.is_deleted == False)  # noqa: E712
    if search:
        q = q.filter(User.email.contains(search) | User.full_name.contains(search))
    q = q.order_by(User.id.desc())
    res = paginate_query(q, page, size)
    res["items"] = [_out(u) for u in res["items"]]
    return {"success": True, "data": res}


@router.get("/{uid}")
def get_user(uid: int, db: Session = Depends(get_db), cur: User = Depends(get_current_user)):
    role = (cur.role.name if cur.role else "").lower()
    if role not in ("admin", "manager") and cur.id != uid:
        raise HTTPException(403, "Forbidden")
    u = db.query(User).filter(User.id == uid).first()
    if not u:
        raise HTTPException(404, "Not found")
    return {"success": True, "data": _out(u)}


@router.patch("/{uid}")
def patch_user(uid: int, body: dict, db: Session = Depends(get_db), _: User = Depends(require_roles("admin"))):
    u = db.query(User).filter(User.id == uid).first()
    if not u:
        raise HTTPException(404, "Not found")
    if "is_active" in body:
        u.is_active = bool(body["is_active"])
    if "full_name" in body:
        u.full_name = body["full_name"]
    if "phone" in body:
        u.phone = body["phone"]
    db.commit()
    return {"success": True, "data": _out(u)}
