import os
os.environ.setdefault("DATABASE_URL", "sqlite:///./test.db")
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

TEST_URL = "sqlite:///./test.db"

engine = create_engine(TEST_URL, connect_args={"check_same_thread": False})
TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)

from app.db.base import Base  # noqa: E402
from app.main import app  # noqa: E402
from app.core.deps import get_db  # noqa: E402


def override_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    if os.path.exists("./test.db"):
        os.remove("./test.db")
    Base.metadata.create_all(bind=engine)
    # seed roles + staff users so RBAC tests work
    try:
        from app.models.all import Role, User
        from app.core.security import hash_password
        db = TestingSession()
        for name in ["admin", "manager", "employee", "customer"]:
            if not db.query(Role).filter(Role.name == name).first():
                db.add(Role(name=name, description=f"{name} role"))
        db.commit()
        roles = {r.name: r for r in db.query(Role).all()}
        for email, role in [("admin@example.com", "admin"),
                            ("manager@example.com", "manager"),
                            ("employee@example.com", "employee")]:
            if not db.query(User).filter(User.email == email).first():
                db.add(User(email=email, password_hash=hash_password("Password123!"),
                            full_name=role.title(), role_id=roles[role].id))
        db.commit()
        db.close()
    except Exception:
        pass
    yield
    try:
        os.remove("./test.db")
    except OSError:
        pass


@pytest.fixture()
def client(setup_db):
    app.dependency_overrides[get_db] = override_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
