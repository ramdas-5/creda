import { useQuery } from '@tanstack/react-query';
import { depositsApi } from '../api/deposits';
import { inr, fdMaturity } from '../utils/currency';
import { Card, CardTitle } from '../components/ui/Card';
import { SkeletonRows } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';

export default function FixedDeposits() {
  const q = useQuery({ queryKey: ['fds'], queryFn: depositsApi.fds });
  const list: any[] = Array.isArray(q.data) ? q.data : ((q.data as any)?.items || []);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Fixed Deposits</h1>
      <Card className="text-sm text-slate-500">Maturity preview: {inr(100000)} @ 7.1% for 12 months → <b>{inr(fdMaturity(100000, 7.1, 12))}</b></Card>
      {q.isLoading ? <SkeletonRows n={3} /> : q.isError ? <ErrorState message="Could not load FDs." onRetry={() => q.refetch()} />
      : list.length === 0 ? <EmptyState title="No fixed deposits" hint="FDs created via the API will appear here." />
      : <div className="grid gap-4 md:grid-cols-2">{list.map((d: any) => (
        <Card key={d.id}><CardTitle>{inr(d.principal ?? d.amount)} · {d.tenure_months} mo</CardTitle>
          <p className="mt-1 text-sm text-slate-500">Rate {d.interest_rate}% · Maturity {inr(d.maturity_amount ?? 0)} · {d.maturity_date || ''}</p>
          <div className="mt-2"><Badge value={d.status} /></div>
        </Card>))}</div>}
    </div>
  );
}
