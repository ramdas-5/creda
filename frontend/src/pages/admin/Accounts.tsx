import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi } from '../../api/admin';
import { inr } from '../../utils/currency';
import { Card } from '../../components/ui/Card';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { ApiError } from '../../api/client';

function usePaged(qk: string, fn: () => Promise<any>) {
  const [page, setPage] = useState(1);
  const q = useQuery({ queryKey: [qk, page], queryFn: fn });
  return { page, setPage, q };
}

export function AdminAccounts() {
  const qc = useQueryClient();
  const { page, setPage, q } = usePaged('admin-accounts', () => adminApi.accounts(page));
  const list: any[] = Array.isArray(q.data) ? q.data : ((q.data as any)?.items || []);
  const status = useMutation({
    mutationFn: ({ id, s }: { id: number; s: string }) => adminApi.setAccountStatus(id, s),
    onSuccess: () => { toast.success('Account status updated'); qc.invalidateQueries({ queryKey: ['admin-accounts'] }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Update failed'),
  });
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">All accounts</h1>
          <p className="text-sm text-slate-500">Freeze suspicious accounts, close dormant ones. Frozen accounts block transfers automatically.</p>
        </div>
        <Link to="/admin/teller" className="btn-primary">Open counter</Link>
      </div>
      {q.isLoading ? <SkeletonRows n={5} /> : q.isError ? <ErrorState message="Could not load accounts." onRetry={() => q.refetch()} />
      : list.length === 0 ? <EmptyState title="No accounts" hint="Records will appear here." />
      : <Card className="!p-0"><div className="table-wrap !border-0"><table className="data">
        <thead><tr><th>Account</th><th>Balance</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
        <tbody>{list.map((a: any) => <tr key={a.id}>
          <td className="font-medium">{a.masked || a.account_number} <span className="text-slate-400">· #{a.id}</span></td>
          <td>{inr(a.balance)}</td>
          <td><Badge value={a.status} /></td>
          <td className="text-right">
            <div className="flex justify-end gap-2 text-sm font-medium">
              {a.status !== 'ACTIVE' && <button className="text-emerald-600 hover:underline" onClick={() => status.mutate({ id: a.id, s: 'ACTIVE' })}>Activate</button>}
              {a.status !== 'FROZEN' && <button className="text-amber-600 hover:underline" onClick={() => status.mutate({ id: a.id, s: 'FROZEN' })}>Freeze</button>}
              {a.status !== 'CLOSED' && <button className="text-red-600 hover:underline" onClick={() => status.mutate({ id: a.id, s: 'CLOSED' })}>Close</button>}
            </div>
          </td>
        </tr>)}</tbody></table></div>
        <div className="flex justify-end gap-2 p-4"><button className="btn-ghost !px-3 !py-1" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button><button className="btn-ghost !px-3 !py-1" onClick={() => setPage(page + 1)}>Next</button></div></Card>}
    </div>
  );
}

export function AdminTransactions() {
  const qc = useQueryClient();
  const { page, setPage, q } = usePaged('admin-txns', () => adminApi.transactions(page));
  const list: any[] = Array.isArray(q.data) ? q.data : ((q.data as any)?.items || []);
  const rev = useMutation({
    mutationFn: (id: number) => adminApi.reverseTxn(id),
    onSuccess: () => { toast.success('Transaction reversed — funds moved back'); qc.invalidateQueries({ queryKey: ['admin-txns'] }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Reverse failed'),
  });
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">All transactions</h1>
        <p className="text-sm text-slate-500">Only staff can reverse a settled entry. Reversals move funds back and are audit-logged.</p>
      </div>
      {q.isLoading ? <SkeletonRows n={5} /> : q.isError ? <ErrorState message="Could not load transactions." onRetry={() => q.refetch()} />
      : list.length === 0 ? <EmptyState title="No transactions" hint="Records will appear here." />
      : <Card className="!p-0"><div className="table-wrap !border-0"><table className="data">
        <thead><tr><th>Reference</th><th>Type</th><th>Amount</th><th>Status</th><th className="text-right">Action</th></tr></thead>
        <tbody>{list.map((t: any) => <tr key={t.id}>
          <td className="font-mono text-xs">{t.reference || t.reference_number || t.id}</td>
          <td>{t.type || '—'}</td><td>{inr(t.amount)}</td><td><Badge value={t.status} /></td>
          <td className="text-right">
            {t.status === 'REVERSED'
              ? <span className="text-xs text-slate-400">reversed</span>
              : <button className="text-sm font-medium text-red-600 hover:underline" disabled={rev.isPending} onClick={() => rev.mutate(t.id)}>Reverse</button>}
          </td>
        </tr>)}</tbody></table></div>
        <div className="flex justify-end gap-2 p-4"><button className="btn-ghost !px-3 !py-1" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button><button className="btn-ghost !px-3 !py-1" onClick={() => setPage(page + 1)}>Next</button></div></Card>}
    </div>
  );
}

export default AdminAccounts;
