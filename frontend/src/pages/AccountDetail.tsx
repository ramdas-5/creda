import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { accountsApi } from '../api/accounts';
import { transactionsApi } from '../api/transactions';
import { api } from '../api/client';
import { inr, maskAccount } from '../utils/currency';
import { Card, CardTitle } from '../components/ui/Card';
import { SkeletonRows } from '../components/ui/Skeleton';
import { ErrorState, EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';

export default function AccountDetail() {
  const { id = '' } = useParams();
  const q = useQuery({ queryKey: ['account', id], queryFn: () => accountsApi.get(id) });
  const tx = useQuery({ queryKey: ['account-tx', id], queryFn: () => transactionsApi.list({ account_id: id, page_size: 10 }) });
  const a: any = q.data || {};
  const txns: any[] = Array.isArray(tx.data) ? tx.data : ((tx.data as any)?.items || []);
  if (q.isLoading) return <SkeletonRows n={4} />;
  if (q.isError) return <ErrorState message="Could not load account." onRetry={() => q.refetch()} />;

  const download = async (format: string) => {
    const blob = await api.get<Blob>(`/statements?account_id=${id}&format=${format}`);
    void blob;
  };

  const dl = (format: 'CSV' | 'PDF') => {
    const base = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000/api/v1';
    const token = localStorage.getItem('access_token');
    fetch(`${base}/statements?account_id=${id}&format=${format}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((r) => r.blob())
      .then((b) => {
        const url = URL.createObjectURL(b);
        const el = document.createElement('a');
        el.href = url; el.download = `statement-${id}.${format.toLowerCase()}`; el.click();
        URL.revokeObjectURL(url);
      });
  };

  return (
    <div className="space-y-5">
      <Link to="/accounts" className="text-sm text-blue-700">← All accounts</Link>
      <Card>
        <CardTitle>{a.account_type || 'Account'} · {maskAccount(a.account_number)}</CardTitle>
        <p className="mt-1 font-mono text-xs text-slate-500">Account No: {a.account_number}</p>
        <p className="mt-2 text-3xl font-bold">{inr(a.balance)}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs"><StatusBadge value={a.status} /><span className="text-slate-500">Type: {a.account_type_id || '—'} · Branch: {a.branch_id || '—'}</span></div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/deposit" className="btn-primary !px-3 !py-1.5 text-xs">Deposit</Link>
          <Link to="/withdraw" className="btn-ghost !px-3 !py-1.5 text-xs">Withdraw</Link>
          <Link to="/transfers/new" className="btn-ghost !px-3 !py-1.5 text-xs">Transfer</Link>
          <Link to="/transactions" className="btn-ghost !px-3 !py-1.5 text-xs">Transactions</Link>
          <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => dl('PDF')}>Download statement (PDF)</button>
          <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => dl('CSV')}>CSV</button>
        </div>
      </Card>
      <Card>
        <div className="mb-2 flex items-center justify-between"><CardTitle>Recent transactions</CardTitle><Link to="/transactions" className="text-sm text-blue-700">View all</Link></div>
        {tx.isLoading ? <div className="mt-2"><SkeletonRows n={3} /></div>
        : txns.length === 0 ? <div className="mt-2"><EmptyState title="No transactions yet." hint="Your completed transactions will appear here." /></div>
        : <div className="table-wrap mt-3"><table className="data"><thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>{txns.map((t: any) => <tr key={t.id}><td>{t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN') : '—'}</td><td>{t.type}</td><td>{inr(t.amount)}</td><td><StatusBadge value={t.status} /></td></tr>)}</tbody></table></div>}
      </Card>
    </div>
  );
}
