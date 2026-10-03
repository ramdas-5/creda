from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import SessionLocal
from app.models.all import User

security = HTTPBearer(auto_error=False)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _unauthenticated(detail: str = "Not authenticated"):
    return HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if creds is None or not creds.credentials:
        raise _unauthenticated()
    try:
        payload = decode_access_token(creds.credentials)
    except ValueError:
        raise _unauthenticated("Invalid or expired token")
    user = db.query(User).filter(User.id == int(payload["sub"]), User.is_deleted == False).first()  # noqa: E712
    if not user or not user.is_active:
        raise _unauthenticated("User inactive or not found")
    return user


def require_roles(*roles: str):
    def checker(user: User = Depends(get_current_user)) -> User:
        role_name = user.role.name if user.role else ""
        allowed = {r.lower() for r in roles}
        if role_name.lower() not in allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden: insufficient role")
        return user

    return checker
