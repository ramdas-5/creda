import uuid


def _reg_login(client, role_email=None):
    email = role_email or f"req_{uuid.uuid4().hex[:8]}@example.com"
    r = client.post("/api/v1/auth/register", json={"email": email, "password": "Password123!", "full_name": "Req User"})
    assert r.status_code == 201, r.text
    acct = r.json()["data"].get("account_number")
    assert acct, "account number must be generated"
    r = client.post("/api/v1/auth/login", json={"identifier": email, "password": "Password123!"})
    tok = r.json()["data"]["access_token"]
    # account-number login
    r2 = client.post("/api/v1/auth/login", json={"identifier": acct, "password": "Password123!"})
    assert r2.status_code == 200, r2.text
    return {"Authorization": f"Bearer {tok}"}, acct


def _admin(client):
    r = client.post("/api/v1/auth/login", json={"identifier": "admin@example.com", "password": "Password123!"})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['data']['access_token']}"}


def _my_account(client, h):
    items = client.get("/api/v1/accounts", headers=h).json()["data"]["items"]
    assert len(items) >= 1
    return items[0]


def test_deposit_request_approval_flow(client):
    h, _ = _reg_login(client)
    ah = _admin(client)
    acc = _my_account(client, h)
    bal0 = acc["balance"]
    r = client.post("/api/v1/deposit-requests", json={"account_id": acc["id"], "amount": "20000", "note": "cash"}, headers=h)
    assert r.status_code == 201, r.text
    assert r.json()["data"]["status"] == "PENDING"
    # balance unchanged
    assert client.get(f"/api/v1/accounts/{acc['id']}", headers=h).json()["data"]["balance"] == bal0
    rid = r.json()["data"]["id"]
    ap = client.post(f"/api/v1/admin/deposit-requests/{rid}/approve", json={"note": "ok"}, headers=ah)
    assert ap.status_code == 200, ap.text
    # double approval blocked
    dup = client.post(f"/api/v1/admin/deposit-requests/{rid}/approve", json={}, headers=ah)
    assert dup.status_code == 400
    # customer cannot approve
    assert client.post(f"/api/v1/admin/deposit-requests/{rid}/approve", json={}, headers=h).status_code == 403


def test_customer_isolation(client):
    h1, _ = _reg_login(client)
    h2, _ = _reg_login(client)
    a1 = _my_account(client, h1)
    # customer 2 cannot read customer 1 account
    assert client.get(f"/api/v1/accounts/{a1['id']}", headers=h2).status_code in (403, 404)
    # customer cannot hit admin
    assert client.get("/api/v1/admin/users", headers=h1).status_code == 403


def test_loan_disbursement(client):
    h, _ = _reg_login(client)
    ah = _admin(client)
    acc = _my_account(client, h)
    bal0 = float(acc["balance"])
    r = client.post("/api/v1/loans", json={"loan_type": "PERSONAL", "principal": "500000",
                                            "interest_rate": "10", "tenure_months": 36,
                                            "purpose": "Education"}, headers=h)
    assert r.status_code == 201, r.text
    lid = r.json()["data"]["id"]
    ap = client.post(f"/api/v1/admin/loan-applications/{lid}/approve",
                     json={"approved_amount": "450000"}, headers=ah)
    assert ap.status_code == 200, ap.text
    bal1 = float(client.get(f"/api/v1/accounts/{acc['id']}", headers=h).json()["data"]["balance"])
    assert abs(bal1 - (bal0 + 450000)) < 0.01


def test_card_request_flow(client):
    h, _ = _reg_login(client)
    ah = _admin(client)
    acc = _my_account(client, h)
    assert client.get("/api/v1/cards", headers=h).json()["data"]["items"] == []
    r = client.post("/api/v1/card-requests", json={"account_id": acc["id"]}, headers=h)
    assert r.status_code == 201, r.text
    rid = r.json()["data"]["id"]
    ap = client.post(f"/api/v1/admin/card-requests/{rid}/approve", json={}, headers=ah)
    assert ap.status_code == 200, ap.text
    assert len(client.get("/api/v1/cards", headers=h).json()["data"]["items"]) == 1
