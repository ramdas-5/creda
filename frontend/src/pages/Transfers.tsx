import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { transfersApi } from '../api/transfers';
import { inr } from '../utils/currency';
import { Card, CardTitle } from '../components/ui/Card';
import { SkeletonRows } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';

export default function Transfers() {
  const q = useQuery({ queryKey: ['transfers'], queryFn: () => transfersApi.list({ page: 1, page_size: 15 }) });
  const raw: any = q.data;
  const items: any[] = Array.isArray(raw) ? raw : (raw?.items || []);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold">Transfers</h1><Link to="/transfers/new" className="btn-primary">New transfer</Link></div>
      {q.isLoading ? <SkeletonRows n={5} /> : q.isError ? <ErrorState message="Could not load transfers." onRetry={() => q.refetch()} />
      : items.length === 0 ? <EmptyState title="No transfers yet" hint="Create your first transfer — a TXN reference is generated on success." action={<Link to="/transfers/new" className="btn-primary mt-2">New transfer</Link>} />
      : <Card className="!p-0"><div className="table-wrap !border-0"><table className="data"><thead><tr><th>Reference</th><th>Amount</th><th>Status</th><th>Date</th></tr></thead>
        <tbody>{items.map((t: any) => <tr key={t.id}><td>{t.reference_number || t.id}</td><td>{inr(t.amount)}</td><td><Badge value={t.status} /></td><td>{t.created_at ? new Date(t.created_at).toLocaleString('en-IN') : '—'}</td></tr>)}</tbody></table></div></Card>}
    </div>
  );
}
