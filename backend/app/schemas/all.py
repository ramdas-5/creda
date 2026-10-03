from datetime import date
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class PageOut(BaseModel):
    total: int
    page: int
    size: int
    pages: int


class AuthRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = ""
    phone: str = ""


class AuthLogin(BaseModel):
    email: Optional[str] = None
    identifier: Optional[str] = None
    password: str

    def login_id(self) -> str:
        return (self.identifier or self.email or "").strip()


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshIn(BaseModel):
    refresh_token: str


class ChangePasswordIn(BaseModel):
    old_password: str
    new_password: str = Field(min_length=8)


class ForgotIn(BaseModel):
    email: EmailStr


class ResetIn(BaseModel):
    token: str
    new_password: str = Field(min_length=8)


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str = ""
    phone: str = ""
    role: str = ""
    is_active: bool = True

    model_config = {"from_attributes": True}


class AccountCreate(BaseModel):
    customer_id: Optional[int] = None
    account_type_id: Optional[int] = None
    branch_id: Optional[int] = None
    initial_balance: Decimal = Decimal("0.00")


class AccountOut(BaseModel):
    id: int
    account_number: str
    customer_id: int
    balance: Decimal
    status: str

    model_config = {"from_attributes": True}


class TransferCreate(BaseModel):
    from_account_id: int
    to_account_id: int
    amount: Decimal = Field(gt=0)
    remarks: str = ""
    idempotency_key: Optional[str] = None


class BeneficiaryIn(BaseModel):
    name: str
    nickname: str = ""
    account_number: str
    bank_name: str = ""
    ifsc: str = ""


class CardIn(BaseModel):
    account_id: int
    card_type: str = "DEBIT"
    spending_limit: Decimal = Decimal("100000.00")


class LoanIn(BaseModel):
    customer_id: Optional[int] = None
    account_id: Optional[int] = None
    loan_type: str = "PERSONAL"
    principal: Decimal = Field(gt=0)
    interest_rate: Decimal = Field(ge=0)
    tenure_months: int = Field(ge=1, le=360)
    purpose: str = ""
    monthly_income: Optional[Decimal] = None
    employment_info: str = ""


class LoanStatusIn(BaseModel):
    status: str


class FDIn(BaseModel):
    customer_id: Optional[int] = None
    account_id: Optional[int] = None
    principal: Decimal = Field(gt=0)
    interest_rate: Decimal = Field(ge=0)
    tenure_months: int = Field(ge=1, le=360)


class RDIn(BaseModel):
    customer_id: Optional[int] = None
    monthly_amount: Decimal = Field(gt=0)
    interest_rate: Decimal = Field(ge=0)
    tenure_months: int = Field(ge=1, le=360)


class DepositIn(BaseModel):
    account_id: int
    amount: Decimal = Field(gt=0)
    method: str = "CASH"


class WithdrawIn(BaseModel):
    account_id: int
    amount: Decimal = Field(gt=0)
    method: str = "CASH"


class DepositRequestIn(BaseModel):
    account_id: int
    amount: Decimal = Field(gt=0)
    note: str = ""


class CardRequestIn(BaseModel):
    account_id: int
    card_type: str = "DEBIT"


class TicketIn(BaseModel):
    subject: str
    category: str = "GENERAL"
    priority: str = "MEDIUM"
    message: str = ""


class TicketReply(BaseModel):
    message: str


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str = ""
    type: str = "INFO"
    is_read: bool = False

    model_config = {"from_attributes": True}


class BranchIn(BaseModel):
    code: str
    name: str
    address: str = ""
    phone: str = ""
    email: str = ""
    manager: str = ""
    status: str = "ACTIVE"


class AccountTypeIn(BaseModel):
    code: str
    name: str
    interest_rate: Decimal = Decimal("0.00")
    min_balance: Decimal = Decimal("0.00")
    description: str = ""
