import uuid


def _email():
    return f"user_{uuid.uuid4().hex[:8]}@example.com"


def test_register_login_me(client):
    email = _email()
    r = client.post("/api/v1/auth/register", json={"email": email, "password": "Password123!",
                                                   "full_name": "Test User"})
    assert r.status_code == 201, r.text
    r = client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
    assert r.status_code == 200, r.text
    tokens = r.json()["data"]
    assert "access_token" in tokens and "refresh_token" in tokens
    r = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {tokens['access_token']}"})
    assert r.status_code == 200
    assert r.json()["data"]["email"] == email


def test_weak_password_rejected(client):
    r = client.post("/api/v1/auth/register", json={"email": _email(), "password": "weak"})
    assert r.status_code in (400, 422)


def test_error_format(client):
    r = client.post("/api/v1/auth/login", json={"email": "nope@example.com", "password": "Password123!"})
    assert r.status_code == 401
    body = r.json()
    assert body["success"] is False
    assert "code" in body["error"] and "message" in body["error"]
