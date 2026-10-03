import uuid
from app.services.deposit_service import emi_calc, fd_maturity, rd_maturity


def _auth(client):
    email = f"l_{uuid.uuid4().hex[:8]}@example.com"
    client.post("/api/v1/auth/register", json={"email": email, "password": "Password123!"})
    r = client.post("/api/v1/auth/login", json={"email": email, "password": "Password123!"})
    return {"Authorization": f"Bearer {r.json()['data']['access_token']}"}


def test_emi_math():
    emi = emi_calc(100000, 10, 12)
    assert 8700 < float(emi) < 9000
    assert emi_calc(12000, 0, 12) == __import__("decimal").Decimal("1000.00")


def test_fd_math():
    amt, _ = fd_maturity(100000, 7, 12)
    assert float(amt) > 100000


def test_rd_math():
    assert float(rd_maturity(5000, 7, 12)) > 60000


def test_loan_apply_and_status_flow(client):
    h = _auth(client)
    # customer id: fetch own customer record
    r = client.get("/api/v1/customers", headers=h)
    cid = r.json()["data"]["items"][0]["id"] if r.json()["data"]["items"] else None
    body = {"principal": "100000.00", "interest_rate": "10.00", "tenure_months": 12}
    if cid:
        body["customer_id"] = cid
    # create customer profile implicitly via account if none exists
    if not cid:
        client.post("/api/v1/accounts", json={"initial_balance": "10.00"}, headers=h)
        r = client.get("/api/v1/customers", headers=h)
        body["customer_id"] = r.json()["data"]["items"][0]["id"]
    r = client.post("/api/v1/loans", json=body, headers=h)
    assert r.status_code == 201, r.text
    lid = r.json()["data"]["id"]
    assert float(r.json()["data"]["emi"]) > 0
    # customer cannot approve; expect 403
    r = client.patch(f"/api/v1/loans/{lid}/status", json={"status": "APPROVED"}, headers=h)
    assert r.status_code == 403
