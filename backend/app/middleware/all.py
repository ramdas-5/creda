import logging, time, uuid
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

logger = logging.getLogger("bank")


class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        rid = uuid.uuid4().hex[:8]
        start = time.time()
        try:
            resp = await call_next(request)
            logger.info(f"[{rid}] {request.method} {request.url.path} -> {resp.status_code} ({(time.time()-start)*1000:.1f}ms)")
            return resp
        except Exception:
            logger.exception(f"[{rid}] unhandled error {request.method} {request.url.path}")
            raise


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        resp = await call_next(request)
        resp.headers["X-Content-Type-Options"] = "nosniff"
        resp.headers["X-Frame-Options"] = "DENY"
        resp.headers["Referrer-Policy"] = "no-referrer"
        return resp
