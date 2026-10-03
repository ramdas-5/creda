import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { loansApi } from '../api/loans';
import { inr } from '../utils/currency';
import { Card, CardTitle } from '../components/ui/Card';
import { SkeletonRows } from '../components/ui/Skeleton';
import { ErrorState, EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';

export default function LoanDetail() {
  const { id = '' } = useParams();
  const q = useQuery({ queryKey: ['loan', id], queryFn: () => loansApi.get(id) });
  if (q.isLoading) return <SkeletonRows n={4} />;
  if (q.isError) return <ErrorState message="Could not load loan." onRetry={() => q.refetch()} />;
  const l: any = q.data || {};
  const sched: any[] = l.repayment_schedule || l.schedule || [];
  return (
    <div className="space-y-4">
      <Link to="/loans" className="text-sm text-blue-700">← All loans</Link>
      <Card><div className="flex items-center justify-between"><CardTitle>{l.product || 'Loan'}</CardTitle><Badge value={l.status} /></div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
          <div><p className="text-slate-500">Amount</p><p className="font-semibold">{inr(l.amount)}</p></div>
          <div><p className="text-slate-500">Rate</p><p className="font-semibold">{l.interest_rate}%</p></div>
          <div><p className="text-slate-500">Tenure</p><p className="font-semibold">{l.tenure_months} mo</p></div>
          <div><p className="text-slate-500">EMI</p><p className="font-semibold">{inr(l.emi ?? 0)}</p></div>
        </div>
      </Card>
      <Card><CardTitle>Repayment schedule</CardTitle>
        {sched.length === 0 ? <div className="mt-2"><EmptyState title="No schedule" hint="Schedule appears after approval." /></div>
        : <div className="table-wrap mt-3"><table className="data"><thead><tr><th>#</th><th>Due</th><th>EMI</th><th>Status</th></tr></thead><tbody>{sched.map((s: any, i: number) => <tr key={i}><td>{i + 1}</td><td>{s.due_date || '—'}</td><td>{inr(s.emi || s.amount)}</td><td><Badge value={s.status} /></td></tr>)}</tbody></table></div>}
      </Card>
    </div>
  );
}
