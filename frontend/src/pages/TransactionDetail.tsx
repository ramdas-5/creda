import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { transactionsApi } from '../api/transactions';
import { inr } from '../utils/currency';
import { Card, CardTitle } from '../components/ui/Card';
import { SkeletonRows } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';

export default function TransactionDetail() {
  const { id = '' } = useParams();
  const q = useQuery({ queryKey: ['txn', id], queryFn: () => transactionsApi.get(id) });
  if (q.isLoading) return <SkeletonRows n={5} />;
  if (q.isError) return <ErrorState message="Could not load transaction." onRetry={() => q.refetch()} />;
  const t: any = q.data || {};
  const rows: [string, string][] = [
    ['Reference', t.reference_number || t.id || '—'],
    ['Amount', inr(t.amount)],
    ['Direction', t.direction || t.type || '—'],
    ['Status', ''],
    ['Sender', t.sender || '—'],
    ['Receiver', t.receiver || '—'],
    ['Fees', inr(t.fees ?? 0)],
    ['Balance after', t.balance_after !== undefined ? inr(t.balance_after) : '—'],
    ['Date', t.created_at ? new Date(t.created_at).toLocaleString('en-IN') : '—'],
    ['Description', t.description || '—'],
  ];
  return (
    <div className="space-y-4">
      <Link to="/transactions" className="text-sm text-blue-700">← All transactions</Link>
      <Card><CardTitle>Transaction {t.reference_number || id}</CardTitle>
        <dl className="mt-4 space-y-2 text-sm">
          {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4"><dt className="text-slate-500">{k}</dt><dd className="text-right">{k === 'Status' ? <Badge value={t.status} /> : v}</dd></div>)}
        </dl>
      </Card>
    </div>
  );
}
