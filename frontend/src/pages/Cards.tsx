import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cardsApi } from '../api/cards';
import { accountsApi } from '../api/accounts';
import { maskCard, inr } from '../utils/currency';
import { Card, CardTitle } from '../components/ui/Card';
import { SkeletonRows } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ApiError } from '../api/client';

export default function Cards() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['cards'], queryFn: cardsApi.list });
  const rq = useQuery({ queryKey: ['my-card-reqs'], queryFn: cardsApi.requests });
  const acc = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list });
  const [accountId, setAccountId] = useState('');
  const list: any[] = Array.isArray(q.data) ? q.data : ((q.data as any)?.items || []);
  const reqs: any[] = Array.isArray(rq.data) ? rq.data : ((rq.data as any)?.items || []);
  const accounts: any[] = Array.isArray(acc.data) ? acc.data : ((acc.data as any)?.items || []);

  const req = useMutation({
    mutationFn: () => cardsApi.request(Number(accountId)),
    onSuccess: () => {
      toast.success('Card request submitted — pending admin approval');
      qc.invalidateQueries({ queryKey: ['my-card-reqs'] });
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Request failed'),
  });
  const limit = useMutation({
    mutationFn: ({ id, v }: { id: string; v: number }) => cardsApi.setLimit(id, v),
    onSuccess: () => { toast.success('Spending limit updated'); qc.invalidateQueries({ queryKey: ['cards'] }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Update failed'),
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Cards</h1>
        <p className="page-sub">Tokenized display only — CVV and full PAN are never stored or shown.</p>
      </div>
      {q.isLoading ? <SkeletonRows n={3} /> : q.isError ? <ErrorState message="Could not load cards." onRetry={() => q.refetch()} />
      : list.length === 0 ? (
        <Card>
          <CardTitle>No cards available</CardTitle>
          <p className="mt-1 text-sm text-slate-500">You currently don't have a bank card. Request one against your account.</p>
          <div className="mt-3 flex max-w-md gap-2">
            <select className="input" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">Select account…</option>
              {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.masked || a.account_number}</option>)}
            </select>
            <button className="btn-primary shrink-0" disabled={!accountId || req.isPending} onClick={() => req.mutate()}>
              {req.isPending ? 'Requesting…' : 'Request a card'}
            </button>
          </div>
          {reqs.length > 0 && (
            <div className="mt-4 space-y-2">
              {reqs.slice(0, 5).map((r: any) => (
                <p key={r.id} className="text-sm text-slate-500">{r.reference} · <StatusBadge value={r.status} /></p>
              ))}
            </div>
          )}
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">{list.map((c: any) => (
            <Card key={c.id} className="bg-slate-900 !text-white dark:bg-slate-800">
              <CardTitle className="!text-white">{c.card_type || 'Debit card'}</CardTitle>
              <p className="mt-2 font-mono tracking-wider">{maskCard(c.last4)}</p>
              <div className="mt-2 flex items-center gap-2 text-xs"><StatusBadge value={c.status} /><span>Limit {inr(c.spending_limit ?? 0)}</span></div>
              <div className="mt-3">
                <button className="text-xs text-blue-300 hover:underline" onClick={() => {
                  const v = prompt('New spending limit (₹)', String(c.spending_limit ?? 100000));
                  if (v && Number(v) > 0) limit.mutate({ id: c.id, v: Number(v) });
                }}>Change limit</button>
              </div>
            </Card>))}
          </div>
          <Card>
            <CardTitle>Request another card</CardTitle>
            <div className="mt-3 flex max-w-md gap-2">
              <select className="input" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                <option value="">Select account…</option>
                {accounts.map((a: any) => <option key={a.id} value={a.id}>{a.masked || a.account_number}</option>)}
              </select>
              <button className="btn-ghost shrink-0" disabled={!accountId || req.isPending} onClick={() => req.mutate()}>Submit request</button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
