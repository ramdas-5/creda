from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timezone
from dateutil.relativedelta import relativedelta


def q(v) -> Decimal:
    return Decimal(str(v)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def emi_calc(principal, annual_rate_pct, tenure_months: int) -> Decimal:
    P = Decimal(str(principal))
    r = Decimal(str(annual_rate_pct)) / Decimal("1200")  # monthly
    n = int(tenure_months)
    if n <= 0:
        raise ValueError("tenure must be positive")
    if r == 0:
        return q(P / n)
    factor = (1 + r) ** n
    emi = P * r * factor / (factor - 1)
    return q(emi)


def fd_maturity(principal, annual_rate_pct, tenure_months: int) -> tuple[Decimal, datetime]:
    P = Decimal(str(principal))
    r = Decimal(str(annual_rate_pct)) / Decimal("100")
    years = Decimal(str(tenure_months)) / Decimal("12")
    # quarterly compounding
    n = Decimal("4")
    amount = P * ((1 + r / n) ** (n * years))
    mat = datetime.now(timezone.utc) + relativedelta(months=int(tenure_months))
    return q(amount), mat


def rd_maturity(monthly, annual_rate_pct, tenure_months: int) -> Decimal:
    M = Decimal(str(monthly))
    r = Decimal(str(annual_rate_pct)) / Decimal("1200")
    n = int(tenure_months)
    if r == 0:
        return q(M * n)
    # RD future value with quarterly compounding approx: use monthly compounding
    fv = M * (((1 + r) ** n - 1) / r) * (1 + r)
    return q(fv)
