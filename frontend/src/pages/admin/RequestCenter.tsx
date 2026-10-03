import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { Card, CardTitle } from '../../components/ui/Card';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/EmptyState';

export default function RequestCenter() {
  const q = useQuery({ queryKey: ['req-summary'], queryFn: adminApi.requestSummary });
  if (q.isLoading) return <SkeletonRows n={4} />;
  if (q.isError) return <ErrorState message="Could not load request center." onRetry={() => q.refetch()} />;
  const d: any = q.data || {};
  const items = [
    { label: 'Deposit requests', count: d.deposit_requests ?? 0, to: '/admin/deposit-requests', hint: 'Verify then approve — balance moves only on approval' },
    { label: 'Loan applications', count: d.loan_applications ?? 0, to: '/admin/loan-requests', hint: 'Review terms then disburse to customer account' },
    { label: 'Card requests', count: d.card_requests ?? 0, to: '/admin/card-requests', hint: 'Issue tokenized card only on approval' },
    { label: 'Support requests', count: d.support_requests ?? 0, to: '/support', hint: 'Customer help queue' },
  ];
  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Request center</h1>
        <p className="page-sub">Banking operations queue — every approval is transactional, audit-logged and notified.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((i) => (
          <Link key={i.label} to={i.to}>
            <Card className="card-hover">
              <CardTitle>{i.label}</CardTitle>
              <p className="mt-2 text-3xl font-bold">{i.count}<span className="ml-2 text-xs font-normal text-slate-500">pending</span></p>
              <p className="mt-1 text-xs text-slate-500">{i.hint}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
