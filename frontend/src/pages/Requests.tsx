import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { depositsApi } from '../api/deposits';
import { loansApi } from '../api/loans';
import { cardsApi } from '../api/cards';
import { inr } from '../utils/currency';
import { Card, CardTitle } from '../components/ui/Card';
import { SkeletonRows } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';

function toList(d: any): any[] {
  return Array.isArray(d) ? d : (d?.items || []);
}

export default function Requests() {
  const dep = useQuery({ queryKey: ['my-deposits'], queryFn: () => depositsApi.requests() });
  const loans = useQuery({ queryKey: ['my-loans'], queryFn: () => loansApi.list() });
  const cards = useQuery({ queryKey: ['my-card-reqs'], queryFn: cardsApi.requests });

  const sections = [
    { title: 'Deposit requests', q: dep, cta: '/deposit', ctaLabel: 'New deposit',
      cols: (r: any) => [r.reference, inr(r.amount), r.status, r.review_note || '—'] },
    { title: 'Loan applications', q: loans, cta: '/loans/apply', ctaLabel: 'Apply for loan',
      cols: (r: any) => [r.reference, `${r.loan_type} · ${inr(r.principal)}`, r.status, r.approved_amount ? inr(r.approved_amount) : '—'] },
    { title: 'Card requests', q: cards, cta: '/cards', ctaLabel: 'Request card',
      cols: (r: any) => [r.reference, r.card_type, r.status, r.review_note || '—'] },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">My requests</h1>
        <p className="page-sub">One place for every deposit, loan and card request with live status.</p>
      </div>
      {sections.map((s) => {
        const list = toList(s.q.data);
        return (
          <Card key={s.title} className="!p-0">
            <div className="flex items-center justify-between p-5 pb-2">
              <CardTitle>{s.title} ({list.length})</CardTitle>
              <Link to={s.cta} className="text-sm font-medium text-blue-700 hover:underline">{s.ctaLabel}</Link>
            </div>
            {s.q.isLoading ? <div className="p-5 pt-0"><SkeletonRows n={2} /></div>
            : s.q.isError ? <div className="p-5 pt-0"><ErrorState message={`Could not load ${s.title.toLowerCase()}.`} onRetry={() => s.q.refetch()} /></div>
            : list.length === 0 ? <div className="p-5 pt-0"><EmptyState title={`No ${s.title.toLowerCase()}`} hint="Requests you submit will appear here." /></div>
            : <div className="table-wrap !border-0"><table className="data">
              <thead><tr><th>Reference</th><th>Detail</th><th>Status</th><th>Note / Approved</th></tr></thead>
              <tbody>{list.slice(0, 10).map((r: any) => {
                const c = s.cols(r);
                return <tr key={r.id}><td className="font-mono text-xs">{c[0]}</td><td>{c[1]}</td><td><StatusBadge value={c[2]} /></td><td className="text-slate-500">{c[3]}</td></tr>;
              })}</tbody></table></div>}
          </Card>
        );
      })}
    </div>
  );
}
