import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { accountsApi } from '../api/accounts';
import { depositsApi } from '../api/deposits';
import { inr } from '../utils/currency';
import { Card, CardTitle } from '../components/ui/Card';
import { Input, Field } from '../components/ui/Input';
import { SkeletonRows } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ApiError } from '../api/client';

export default function Deposit() {
  const qc = useQueryClient();
  const acc = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list });
  const reqs = useQuery({ queryKey: ['my-deposits'], queryFn: () => depositsApi.requests() });
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const accounts: any[] = Array.isArray(acc.data) ? acc.data : ((acc.data as any)?.items || []);
  const list: any[] = Array.isArray(reqs.data) ? reqs.data : ((reqs.data as any)?.items || []);

  const m = useMutation({
    mutationFn: () => depositsApi.createRequest(Number(accountId), amount, note),
    onSuccess: () => {
      toast.success('Deposit request submitted — pending admin verification');
      setAmount(''); setNote('');
      qc.invalidateQueries({ queryKey: ['my-deposits'] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Request failed'),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Deposit money</h1>
        <p className="page-sub">Submit a request — balance updates only after admin approval.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardTitle>New deposit request</CardTitle>
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
              <Field label="Deposit amount (₹)"><Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 20000" inputMode="decimal" /></Field>
              <Field label="Note (optional)"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Cash / cheque detail" /></Field>
              <button className="btn-primary w-full" disabled={!accountId || !Number(amount)} onClick={() => m.mutate()}>
                {m.isPending ? 'Submitting…' : 'Submit deposit request'}
              </button>
            </div>
          )}
        </Card>
        <Card className="!p-0">
          <p className="p-5 pb-2 text-sm font-semibold">My deposit requests</p>
          {reqs.isLoading ? <div className="p-5 pt-0"><SkeletonRows n={3} /></div>
          : list.length === 0 ? <p className="p-5 pt-0 text-sm text-slate-500">No requests yet.</p>
          : <div className="table-wrap !border-0"><table className="data">
            <thead><tr><th>Reference</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>{list.slice(0, 8).map((r: any) => (
              <tr key={r.id}><td className="font-mono text-xs">{r.reference}</td><td>{inr(r.amount)}</td><td><StatusBadge value={r.status} /></td></tr>
            ))}</tbody></table></div>}
        </Card>
      </div>
    </div>
  );
}
