import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { accountsApi } from '../api/accounts';
import { inr } from '../utils/currency';
import { Card, CardTitle } from '../components/ui/Card';
import { Input, Field } from '../components/ui/Input';
import { SkeletonRows } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/EmptyState';
import { Confirm } from '../components/ui/Dialog';
import { ApiError } from '../api/client';

export default function Withdraw() {
  const qc = useQueryClient();
  const acc = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list });
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [confirm, setConfirm] = useState(false);
  const accounts: any[] = Array.isArray(acc.data) ? acc.data : ((acc.data as any)?.items || []);
  const sel = accounts.find((a: any) => String(a.id) === String(accountId));

  const m = useMutation({
    mutationFn: () => accountsApi.withdraw(Number(accountId), amount),
    onSuccess: (d: any) => {
      toast.success(`Withdrawal completed · ${d.reference}`);
      setConfirm(false); setAmount('');
      qc.invalidateQueries({ queryKey: ['accounts'] });
    },
    onError: (e) => { setConfirm(false); toast.error(e instanceof ApiError ? e.message : 'Withdrawal failed'); },
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Withdraw money</h1>
        <p className="page-sub">Direct debit from your own account — no approval needed.</p>
      </div>
      <Card className="max-w-xl">
        <CardTitle>Withdraw</CardTitle>
        {acc.isLoading ? <div className="mt-3"><SkeletonRows n={3} /></div>
        : acc.isError ? <div className="mt-3"><ErrorState message="Could not load accounts." onRetry={() => acc.refetch()} /></div>
        : (
          <div className="mt-4 space-y-3">
            <Field label="Select account">
              <select className="input" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                <option value="">Choose…</option>
                {accounts.map((a: any) => (
                  <option key={a.id} value={a.id}>{a.masked || a.account_number} · {inr(a.balance)}</option>
                ))}
              </select>
            </Field>
            {sel && <p className="text-sm text-slate-500">Available balance: <b>{inr(sel.balance)}</b></p>}
            <Field label="Withdrawal amount (₹)"><Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 10000" inputMode="decimal" /></Field>
            <button className="btn-primary w-full" disabled={!accountId || !Number(amount)} onClick={() => setConfirm(true)}>
              Confirm withdrawal
            </button>
          </div>
        )}
      </Card>
      <Confirm open={confirm} onClose={() => setConfirm(false)} onConfirm={() => m.mutate()}
        title="Confirm withdrawal" message={`Withdraw ${amount ? inr(amount) : ''} from ${sel?.masked || 'account'}? This updates your balance immediately.`} />
    </div>
  );
}
