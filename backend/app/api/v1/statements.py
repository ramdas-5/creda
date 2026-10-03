import csv, io
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.models.all import Account, Statement, Transaction
from app.services.account_service import owns_account
from app.utils.refs import gen_reference

router = APIRouter(prefix="/statements", tags=["statements"])


def _parse_dt(s: str | None):
    if not s:
        return None
    try:
        d = datetime.fromisoformat(s)
        if d.tzinfo is None:
            d = d.replace(tzinfo=timezone.utc)
        return d
    except Exception:
        return None


@router.get("")
def build_statement(account_id: int, start: str = "", end: str = "", format: str = "CSV",
                    db: Session = Depends(get_db), user=Depends(get_current_user)):
    acc = owns_account(db, user, account_id)
    if not acc:
        raise HTTPException(404, "Account not found")
    sdt = _parse_dt(start)
    edt = _parse_dt(end)
    q = db.query(Transaction).filter(Transaction.account_id == account_id)
    if sdt:
        q = q.filter(Transaction.created_at >= sdt)
    if edt:
        q = q.filter(Transaction.created_at <= edt)
    txns = q.order_by(Transaction.created_at.asc()).all()
    fmt = format.upper()
    ref = gen_reference("STMT")
    db.add(Statement(reference=ref, account_id=account_id,
                     period_start=sdt or datetime.now(timezone.utc),
                     period_end=edt or datetime.now(timezone.utc), format=fmt,
                     created_by=user.id))
    db.commit()
    if fmt == "PDF":
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.pdfgen import canvas
            buf = io.BytesIO()
            c = canvas.Canvas(buf, pagesize=A4)
            c.drawString(50, 800, "Bank Statement")
            c.drawString(50, 780, f"Account: {acc.account_number}  Period: {start} to {end}")
            y = 750
            for t in txns[:200]:
                c.drawString(50, y, f"{t.created_at} {t.reference} {t.direction} {t.amount}")
                y -= 15
                if y < 50:
                    c.showPage()
                    y = 800
            c.drawString(50, max(y - 20, 40), f"Closing Balance: {acc.balance}")
            c.save()
            buf.seek(0)
            return Response(content=buf.read(), media_type="application/pdf",
                            headers={"Content-Disposition": f"attachment; filename={ref}.pdf"})
        except ImportError:
            text = f"BANK STATEMENT\nAccount: {acc.account_number}\nPeriod: {start} to {end}\n\n"
            for t in txns:
                text += f"{t.created_at} | {t.reference} | {t.direction} | {t.amount} | {t.description}\n"
            text += f"\nClosing Balance: {acc.balance}\n"
            return Response(content=text, media_type="text/plain",
                            headers={"Content-Disposition": f"attachment; filename={ref}.txt"})
    # CSV default
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["Bank Name", "Demo Bank"])
    w.writerow(["Account Number", acc.account_number])
    w.writerow(["Period", f"{start} to {end}"])
    w.writerow([])
    w.writerow(["Date", "Reference", "Description", "Debit", "Credit", "Balance"])
    for t in txns:
        debit = t.amount if t.direction == "DEBIT" else ""
        credit = t.amount if t.direction == "CREDIT" else ""
        w.writerow([t.created_at, t.reference, t.description, debit, credit, t.balance_after])
    w.writerow([])
    w.writerow(["Closing Balance", acc.balance])
    return Response(content=buf.getvalue(), media_type="text/csv",
                    headers={"Content-Disposition": f"attachment; filename={ref}.csv"})
