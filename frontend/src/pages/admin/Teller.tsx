import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Banknote, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { Card, CardTitle } from '../../components/ui/Card';
import { Input, Field } from '../../components/ui/Input';
import { ApiError } from '../../api/client';

export default function Teller() {
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('CASH');

  const dep = useMutation({
    mutationFn: () => adminApi.tellerDeposit(Number(accountId), amount, method),
    onSuccess: (d: any) => toast.success(`Cash deposited · ${d.reference}`),
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Deposit failed'),
  });
  const wdl = useMutation({
    mutationFn: () => adminApi.tellerWithdraw(Number(accountId), amount, method),
    onSuccess: (d: any) => toast.success(`Cash paid out · ${d.reference}`),
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Withdrawal failed'),
  });

  const valid = Number(accountId) > 0 && Number(amount) > 0;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Branch counter</h1>
        <p className="text-sm text-slate-500">
          Staff-only cash operations. Customers cannot deposit or withdraw by themselves —
          a teller does it here against a verified account.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle className="flex items-center gap-2">
            <ArrowDownToLine className="h-4 w-4 text-emerald-600" /> Cash deposit
          </CardTitle>
          <p className="mt-1 text-xs text-slate-500">Accept cash / cheque and credit the account.</p>
          <div className="mt-4 space-y-3">
            <Field label="Account ID"><Input value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="e.g. 12" inputMode="numeric" /></Field>
            <Field label="Amount (₹)"><Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 5000.00" inputMode="decimal" /></Field>
            <Field label="Method">
              <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option>CASH</option><option>CHEQUE</option><option>UPI</option><option>NEFT</option>
              </select>
            </Field>
            <button className="btn-primary w-full" disabled={!valid || dep.isPending} onClick={() => dep.mutate()}>
              {dep.isPending ? 'Posting…' : 'Post deposit'}
            </button>
          </div>
        </Card>

        <Card>
          <CardTitle className="flex items-center gap-2">
            <ArrowUpFromLine className="h-4 w-4 text-amber-600" /> Cash withdrawal
          </CardTitle>
          <p className="mt-1 text-xs text-slate-500">Verify ID + signature, then pay cash out.</p>
          <div className="mt-4 space-y-3">
            <Field label="Account ID"><Input value={accountId} onChange={(e) => setAccountId(e.target.value)} placeholder="e.g. 12" inputMode="numeric" /></Field>
            <Field label="Amount (₹)"><Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 2000.00" inputMode="decimal" /></Field>
            <Field label="Method">
              <select className="input" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option>CASH</option><option>CHEQUE</option><option>UPI</option>
              </select>
            </Field>
            <button className="btn-ghost w-full" disabled={!valid || wdl.isPending} onClick={() => wdl.mutate()}>
              {wdl.isPending ? 'Posting…' : 'Post withdrawal'}
            </button>
          </div>
        </Card>
      </div>

      <Card className="flex items-start gap-3 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
        <Banknote className="mt-0.5 h-5 w-5 text-amber-600" />
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Every counter posting is double-entered as a transaction, audit-logged with the
          teller's ID, and reflected in Reports. Insufficient funds, frozen or closed
          accounts are rejected automatically.
        </p>
      </Card>
    </div>
  );
}
