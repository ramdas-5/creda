import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { loansApi } from '../api/loans';
import { accountsApi } from '../api/accounts';
import { emiCalc } from '../utils/currency';
import { Card, CardTitle } from '../components/ui/Card';
import { Input, Field } from '../components/ui/Input';
import { ApiError } from '../api/client';

export default function LoanApply() {
  const nav = useNavigate();
  const acc = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list });
  const accounts: any[] = Array.isArray(acc.data) ? acc.data : ((acc.data as any)?.items || []);
  const [form, setForm] = useState({ loan_type: 'PERSONAL', principal: '', interest_rate: '10', tenure_months: '36', purpose: '', monthly_income: '', employment_info: '', account_id: '' });
  const emi = form.principal && form.tenure_months ? emiCalc(Number(form.principal), Number(form.interest_rate || 0), Number(form.tenure_months)) : 0;

  const m = useMutation({
    mutationFn: () => loansApi.apply({
      loan_type: form.loan_type, principal: form.principal, interest_rate: form.interest_rate,
      tenure_months: Number(form.tenure_months), purpose: form.purpose,
      monthly_income: form.monthly_income || undefined, employment_info: form.employment_info,
      account_id: form.account_id ? Number(form.account_id) : undefined,
    }),
    onSuccess: () => { toast.success('Application submitted — pending review'); nav('/loans'); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Application failed'),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Apply for loan</h1>
        <p className="page-sub">Approval and disbursement are done by the bank — never from your browser.</p>
      </div>
      <Card className="max-w-2xl">
        <CardTitle>Loan application</CardTitle>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Loan type">
            <select className="input" value={form.loan_type} onChange={(e) => setForm({ ...form, loan_type: e.target.value })}>
              <option>PERSONAL</option><option>HOME</option><option>EDUCATION</option><option>AUTO</option><option>BUSINESS</option>
            </select>
          </Field>
          <Field label="Disburse to account">
            <select className="input" value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })}>
              <option value="">Default account</option>
              {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.masked || a.account_number}</option>)}
            </select>
          </Field>
          <Field label="Requested amount (₹)"><Input value={form.principal} onChange={(e) => setForm({ ...form, principal: e.target.value })} placeholder="500000" inputMode="decimal" /></Field>
          <Field label="Tenure (months)"><Input value={form.tenure_months} onChange={(e) => setForm({ ...form, tenure_months: e.target.value })} inputMode="numeric" /></Field>
          <Field label="Interest rate (%)"><Input value={form.interest_rate} onChange={(e) => setForm({ ...form, interest_rate: e.target.value })} inputMode="decimal" /></Field>
          <Field label="Monthly income (₹)"><Input value={form.monthly_income} onChange={(e) => setForm({ ...form, monthly_income: e.target.value })} inputMode="decimal" /></Field>
          <Field label="Purpose"><Input value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} placeholder="Education" /></Field>
          <Field label="Employment info"><Input value={form.employment_info} onChange={(e) => setForm({ ...form, employment_info: e.target.value })} placeholder="Salaried / employer" /></Field>
        </div>
        {emi > 0 && <p className="mt-3 text-sm text-slate-500">Estimated EMI: <b>₹{emi.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</b></p>}
        <button className="btn-primary mt-4 w-full" disabled={!Number(form.principal) || m.isPending} onClick={() => m.mutate()}>
          {m.isPending ? 'Submitting…' : 'Submit loan application'}
        </button>
      </Card>
    </div>
  );
}
