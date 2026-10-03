"""Seed roles, users, branch, account types, sample accounts + transactions."""
from decimal import Decimal
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.all import Account, AccountType, Branch, Customer, Role, Transaction, User
from app.utils.refs import gen_account_number, gen_reference

USERS = [
    ("admin@example.com", "admin", "Admin User"),
    ("manager@example.com", "manager", "Branch Manager"),
    ("employee@example.com", "employee", "Bank Employee"),
    ("customer@example.com", "customer", "Demo Customer"),
    ("customer2@example.com", "customer", "Second Customer"),
]


def run():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for name in ["admin", "manager", "employee", "customer"]:
            if not db.query(Role).filter(Role.name == name).first():
                db.add(Role(name=name, description=f"{name} role"))
        db.commit()
        roles = {r.name: r for r in db.query(Role).all()}
        for email, role, full in USERS:
            if not db.query(User).filter(User.email == email).first():
                db.add(User(email=email, password_hash=hash_password("Password123!"),
                            full_name=full, role_id=roles[role].id))
        db.commit()
        if not db.query(Branch).filter(Branch.code == "HQ001").first():
            db.add(Branch(code="HQ001", name="Head Office", address="123 Main St",
                          phone="1234567890", email="hq@example.com", manager="Manager"))
            db.commit()
        branch = db.query(Branch).filter(Branch.code == "HQ001").first()
        for code, name, rate in [("SAVINGS", "Savings Account", "3.50"),
                                 ("CURRENT", "Current Account", "0.00"),
                                 ("SALARY", "Salary Account", "3.00")]:
            if not db.query(AccountType).filter(AccountType.code == code).first():
                db.add(AccountType(code=code, name=name, interest_rate=Decimal(rate)))
        db.commit()
        cust_user = db.query(User).filter(User.email == "customer@example.com").first()
        cust = db.query(Customer).filter(Customer.user_id == cust_user.id).first()
        if not cust:
            cust = Customer(user_id=cust_user.id, first_name="Demo", last_name="Customer",
                            phone="9999999999", kyc_status="VERIFIED")
            db.add(cust)
            db.commit()
            db.refresh(cust)
        # second demo customer with isolated data
        cust2_user = db.query(User).filter(User.email == "customer2@example.com").first()
        cust2 = db.query(Customer).filter(Customer.user_id == cust2_user.id).first() if cust2_user else None
        if cust2_user and not cust2:
            cust2 = Customer(user_id=cust2_user.id, first_name="Second", last_name="Customer",
                             phone="8888888888", kyc_status="PENDING")
            db.add(cust2)
            db.commit()
            db.refresh(cust2)
        sav = db.query(AccountType).filter(AccountType.code == "SAVINGS").first()
        for c0, bals in ((cust, [Decimal("50000.00"), Decimal("15000.00")]),
                         (cust2, [Decimal("30000.00")] if cust2 else [],)):
            if c0 and db.query(Account).filter(Account.customer_id == c0.id).count() == 0:
                for bal in bals:
                    for _ in range(5):
                        cand = gen_account_number()
                        if not db.query(Account).filter(Account.account_number == cand).first():
                            break
                    a = Account(account_number=cand, customer_id=c0.id,
                                account_type_id=sav.id, branch_id=branch.id, balance=bal, status="ACTIVE")
                    db.add(a)
                    db.flush()
                    db.add(Transaction(reference=gen_reference("TXN"), account_id=a.id, type="DEPOSIT",
                                       direction="CREDIT", amount=bal, balance_after=bal,
                                       status="COMPLETED", description="Seed opening balance"))
                db.commit()
        print("Seed complete. Demo password: Password123!")
    finally:
        db.close()


if __name__ == "__main__":
    run()
