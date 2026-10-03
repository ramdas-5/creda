import logging
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.v1 import accounts, admin, audit, auth, beneficiaries, card_requests, cards, customers, deposit_requests, deposits, loans, notifications, statements, support, transactions, transfers, users
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.middleware.all import LoggingMiddleware, SecurityHeadersMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bank")

app = FastAPI(title="Banking Management System API", version="1.0.0")

app.add_middleware(LoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list if settings.ENVIRONMENT == "production" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def err(code: str, message: str, status: int = 400):
    return JSONResponse(status_code=status, content={"success": False, "error": {"code": code, "message": message}})


@app.exception_handler(StarletteHTTPException)
async def http_handler(request: Request, exc: StarletteHTTPException):
    return err(f"HTTP_{exc.status_code}", str(exc.detail), exc.status_code)


@app.exception_handler(RequestValidationError)
async def validation_handler(request: Request, exc: RequestValidationError):
    return err("VALIDATION_ERROR", str(exc.errors()), 422)


@app.exception_handler(Exception)
async def generic_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error")
    return err("INTERNAL_ERROR", "An unexpected error occurred.", 500)


@app.on_event("startup")
def startup():
    try:
        from app.models import all as _models  # noqa: F401
        Base.metadata.create_all(bind=engine)
        logger.info("DB tables ensured (create_all fallback). Use Alembic for production.")
    except Exception:
        logger.exception("DB init failed")
    logger.info("Banking API startup complete")


@app.get("/health")
def health():
    return {"success": True, "data": {"status": "ok"}}


@app.get("/")
def root():
    return {"success": True, "data": {"service": "banking-api", "version": "1.0.0"}}


for r in (auth.router, users.router, customers.router, accounts.router, transactions.router,
          transfers.router, beneficiaries.router, cards.router, loans.router, loans.admin_router,
          deposit_requests.router, deposit_requests.admin_router,
          card_requests.router, card_requests.admin_router,
          deposits.fd_router, notifications.router, statements.router,
          support.router, admin.router, audit.router):
    app.include_router(r, prefix="/api/v1")
