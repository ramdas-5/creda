import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { transactionsApi } from '../api/transactions';
import { inr } from '../utils/currency';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { SkeletonRows } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';

export default function Transactions() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const q = useQuery({ queryKey: ['txns', page, status, type], queryFn: () => transactionsApi.list({ page, page_size: 15, status: status || undefined, type: type || undefined }) });
  const raw: any = q.data;
  const all: any[] = Array.isArray(raw) ? raw : (raw?.items || []);
  const items = search ? all.filter((t) => JSON.stringify(t).toLowerCase().includes(search.toLowerCase())) : all;
  const total = raw?.total || items.length;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="page-title">My transactions</h1>
          <p className="page-sub">Only your accounts — filtered server-side by ownership.</p>
        </div>
        <Link to="/accounts" className="btn-ghost !py-2">Download statement via account →</Link>
      </div>
      <Card>
        <div className="flex flex-wrap gap-2">
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <select className="input max-w-[180px]" value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
            <option value="">All types</option>
            {['DEPOSIT', 'WITHDRAWAL', 'TRANSFER'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="input max-w-[180px]" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All statuses</option>
            {['COMPLETED', 'PENDING', 'FAILED', 'REVERSED', 'CANCELLED'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </Card>
      {q.isLoading ? <SkeletonRows n={6} /> : q.isError ? <ErrorState message="Could not load transactions." onRetry={() => q.refetch()} />
      : items.length === 0 ? <EmptyState title="No transactions yet." hint="Your completed transactions will appear here." />
      : <Card className="!p-0">
        <div className="table-wrap !border-0"><table className="data"><thead><tr><th>Date</th><th>Type</th><th>Description</th><th>Amount</th><th>Status</th><th></th></tr></thead>
          <tbody>{items.map((t: any) => <tr key={t.id}><td>{t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN') : '—'}</td><td>{t.type}</td><td className="max-w-[220px] truncate text-slate-500">{t.description || '—'}</td><td>{inr(t.amount)}</td><td><StatusBadge value={t.status} /></td><td><Link to={`/transactions/${t.id}`} className="text-blue-700">View</Link></td></tr>)}</tbody></table></div>
        <div className="flex items-center justify-between p-4 text-sm">
          <span className="text-slate-500">Page {page} · {total} total</span>
          <div className="flex gap-2"><button className="btn-ghost !px-3 !py-1" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button><button className="btn-ghost !px-3 !py-1" onClick={() => setPage(page + 1)}>Next</button></div>
        </div>
      </Card>}
    </div>
  );
}
