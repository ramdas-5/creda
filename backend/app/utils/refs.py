import secrets
from datetime import datetime, timezone


def gen_reference(prefix: str = "TXN") -> str:
    d = datetime.now(timezone.utc).strftime("%Y%m%d")
    return f"{prefix}-{d}-{secrets.token_hex(3).upper()}"


def gen_account_number() -> str:
    # Realistic 12-digit numeric account number, unique-checked by caller.
    import random
    return "".join(str(random.randint(0, 9)) for _ in range(12))


def gen_card_token() -> str:
    return "tok_" + secrets.token_hex(12)


def format_inr(amount) -> str:
    try:
        v = float(amount)
    except Exception:
        v = 0.0
    return f"\u20b9{v:,.2f}"
