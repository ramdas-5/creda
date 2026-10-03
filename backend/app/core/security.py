import re
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def check_password_strength(password: str) -> tuple[bool, str]:
    if len(password) < 8:
        return False, "Password must be at least 8 characters."
    if not re.search(r"[A-Z]", password):
        return False, "Password must contain an uppercase letter."
    if not re.search(r"[a-z]", password):
        return False, "Password must contain a lowercase letter."
    if not re.search(r"[0-9]", password):
        return False, "Password must contain a digit."
    if not re.search(r"[^A-Za-z0-9]", password):
        return False, "Password must contain a special character."
    return True, "ok"


def _encode(payload: dict, secret: str, expires: timedelta) -> str:
    now = datetime.now(timezone.utc)
    data = dict(payload)
    data.update({"iat": now, "exp": now + expires})
    return jwt.encode(data, secret, algorithm="HS256")


def create_access_token(sub: str, role: str = "", extra: dict | None = None) -> str:
    payload: dict = {"sub": sub, "type": "access", "role": role}
    if extra:
        payload.update(extra)
    return _encode(payload, settings.JWT_SECRET, timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))


def create_refresh_token(sub: str, jti: str) -> str:
    payload = {"sub": sub, "type": "refresh", "jti": jti}
    return _encode(payload, settings.JWT_REFRESH_SECRET, timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
    except JWTError as e:
        raise ValueError("Invalid access token") from e
    if payload.get("type") != "access":
        raise ValueError("Not an access token")
    return payload


def decode_refresh_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.JWT_REFRESH_SECRET, algorithms=["HS256"])
    except JWTError as e:
        raise ValueError("Invalid refresh token") from e
    if payload.get("type") != "refresh":
        raise ValueError("Not a refresh token")
    return payload
