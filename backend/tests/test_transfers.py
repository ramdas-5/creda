import uuid


def _auth(client, email=None):
    email = email or f"t_{uuid.uuid4().hex[:8]}@example.com"
    client.post("/api/v1/auth/register", json={"email": email, "password": "Password123!"})
    r = client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
    tok = r.json()["data"]["access_token"]
    return {"Authorization": f"Bearer {tok}"}


def _account(client, h, balance="1000.00"):
    r = client.post("/api/v1/accounts", json={"initial_balance": balance}, headers=h)
    assert r.status_code == 201, r.text
    return r.json()["data"]


def test_transfer_success_and_balances(client):
    h = _auth(client)
    a = _account(client, h, "1000.00")
    b = _account(client, h, "100.00")
    r = client.post("/api/v1/transfers", json={"from_account_id": a["id"], "to_account_id": b["id"],
                                                "amount": "200.00",
                                                "idempotency_key": uuid.uuid4().hex}, headers=h)
    assert r.status_code == 201, r.text
    ra = client.get(f"/api/v1/accounts/{a['id']}", headers=h).json()["data"]
    rb = client.get(f"/api/v1/accounts/{b['id']}", headers=h).json()["data"]
    assert ra["balance"] == "800.00"
    assert rb["balance"] == "300.00"


def test_insufficient_funds(client):
    h = _auth(client)
    a = _account(client, h, "50.00")
    b = _account(client, h, "0.00")
    r = client.post("/api/v1/transfers", json={"from_account_id": a["id"], "to_account_id": b["id"],
                                                "amount": "999.00"}, headers=h)
    assert r.status_code == 400
    assert r.json()["success"] is False


def test_duplicate_idempotency(client):
    h = _auth(client)
    a = _account(client, h, "1000.00")
    b = _account(client, h, "0.00")
    key = uuid.uuid4().hex
    body = {"from_account_id": a["id"], "to_account_id": b["id"], "amount": "100.00",
            "idempotency_key": key}
    r1 = client.post("/api/v1/transfers", json=body, headers=h)
    r2 = client.post("/api/v1/transfers", json=body, headers=h)
    assert r1.status_code == 201 and r2.status_code == 201
    assert r1.json()["data"]["reference"] == r2.json()["data"]["reference"]
    rb = client.get(f"/api/v1/accounts/{b['id']}", headers=h).json()["data"]
    assert rb["balance"] == "100.00"  # credited only once
