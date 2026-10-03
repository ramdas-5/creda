import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { accountsApi } from '../api/accounts';
import { inr, maskAccount } from '../utils/currency';
import { Card, CardTitle } from '../components/ui/Card';
import { SkeletonRows } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';

export default function Accounts() {
  const q = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list });
  const list: any[] = Array.isArray(q.data) ? q.data : ((q.data as any)?.items || (q.data as any)?.accounts || []);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="page-title">My accounts</h1>
          <p className="page-sub">Only your accounts — never another customer's.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/deposit" className="btn-primary !py-2">Deposit</Link>
          <Link to="/withdraw" className="btn-ghost !py-2">Withdraw</Link>
        </div>
      </div>
      {q.isLoading ? <SkeletonRows n={3} /> : q.isError ? <ErrorState message="Could not load accounts — backend may be offline." onRetry={() => q.refetch()} />
      : list.length === 0 ? <EmptyState title="No accounts" hint="Your account is created automatically at registration." />
      : <div className="grid gap-4 md:grid-cols-2">
        {list.map((a: any) => (
          <Link key={a.id} to={`/accounts/${a.id}`}>
            <Card className="card-hover">
              <CardTitle>{a.account_type || 'Savings Account'} · {maskAccount(a.account_number)}</CardTitle>
              <p className="mt-1 font-mono text-xs text-slate-500">{a.account_number}</p>
              <p className="mt-2 text-2xl font-bold">{inr(a.balance)}</p>
              <div className="mt-2 flex items-center gap-2"><StatusBadge value={a.status} /></div>
              <p className="mt-3 text-xs text-blue-700">Open → Deposit · Withdraw · Transfer · Statement →</p>
            </Card>
          </Link>
        ))}
      </div>}
    </div>
  );
}
