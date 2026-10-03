import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { loansApi } from '../api/loans';
import { inr } from '../utils/currency';
import { Card, CardTitle } from '../components/ui/Card';
import { SkeletonRows } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';

export default function Loans() {
  const q = useQuery({ queryKey: ['loans'], queryFn: () => loansApi.list() });
  const list: any[] = Array.isArray(q.data) ? q.data : ((q.data as any)?.items || []);
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="page-title">Loans</h1>
          <p className="page-sub">Apply, track approval, and see disbursement in your account.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/loans/calculator" className="btn-ghost">EMI calculator</Link>
          <Link to="/loans/apply" className="btn-primary">Apply for loan</Link>
        </div>
      </div>
      {q.isLoading ? <SkeletonRows n={3} /> : q.isError ? <ErrorState message="Could not load loans." onRetry={() => q.refetch()} />
      : list.length === 0 ? <EmptyState title="No loans yet" hint="Your applications will appear here with live status." action={<Link to="/loans/apply" className="btn-primary mt-2">Apply for loan</Link>} />
      : <div className="grid gap-4 md:grid-cols-2">{list.map((l: any) => (
        <Link key={l.id} to={`/loans/${l.id}`}>
          <Card className="card-hover">
            <CardTitle>{l.loan_type || 'Loan'} · {l.reference}</CardTitle>
            <p className="mt-2 text-sm">Requested <b>{inr(l.principal)}</b>
              {l.approved_amount && <span> · Approved <b className="text-emerald-600">{inr(l.approved_amount)}</b></span>}</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <StatusBadge value={l.status} /><span>Outstanding {inr(l.outstanding)}</span><span>· {l.tenure_months} mo</span>
            </div>
          </Card>
        </Link>))}</div>}
    </div>
  );
}
