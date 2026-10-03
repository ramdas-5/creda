import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, Wallet, ArrowDownToLine, ArrowUpFromLine, ShieldCheck, AlertTriangle } from 'lucide-react';
import { adminApi } from '../../api/admin';
import { inr } from '../../utils/currency';
import { Card, CardTitle } from '../../components/ui/Card';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/EmptyState';
import { Volume } from '../../components/charts/Volume';

export default function AdminDashboard() {
  const q = useQuery({ queryKey: ['admin-overview'], queryFn: adminApi.overview });
  if (q.isLoading) return <SkeletonRows n={5} />;
  if (q.isError) return <ErrorState message="Could not load admin overview." onRetry={() => q.refetch()} />;
  const d: any = q.data || {};
  const cards = [
    { label: 'Customers', value: String(d.total_customers ?? '—'), icon: Users, tone: 'bg-blue-600' },
    { label: 'Accounts', value: String(d.total_accounts ?? '—'), icon: Wallet, tone: 'bg-indigo-600' },
    { label: 'Money in (credits)', value: inr(d.total_deposits ?? 0), icon: ArrowDownToLine, tone: 'bg-emerald-600' },
    { label: 'Money out (debits)', value: inr(d.total_withdrawals ?? 0), icon: ArrowUpFromLine, tone: 'bg-amber-600' },
    { label: 'Active users', value: String(d.active_users ?? '—'), icon: ShieldCheck, tone: 'bg-slate-700' },
    { label: 'Pending approvals', value: String(d.pending_approvals ?? '—'), icon: AlertTriangle, tone: 'bg-rose-600' },
  ];
  const vol = ((d.monthly_activity || d.volume || []) as any[]).map((v: any) => ({ label: v.label || v.month || '', volume: Number(v.volume || v.count || 0) }));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-900 p-5 text-white">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Operations console</h1>
          <p className="text-sm text-slate-300">Deposits {d.pending_deposits ?? 0} · Loans {d.pending_loans ?? 0} · Cards {d.pending_cards ?? 0} · Support {d.pending_support ?? 0} pending</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/requests" className="btn-primary !bg-white !text-slate-900">Request center</Link>
          <Link to="/admin/teller" className="btn-ghost !border-slate-600 !bg-transparent !text-white">Branch counter</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label} className="flex items-center gap-4">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-white ${c.tone}`}>
              <c.icon className="h-5 w-5" />
            </span>
            <span><CardTitle>{c.label}</CardTitle><p className="mt-1 text-xl font-bold">{c.value}</p></span>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardTitle>Transaction volume</CardTitle><div className="mt-3"><Volume data={vol} /></div></Card>
        <Card>
          <CardTitle>Staff quick actions</CardTitle>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <Link to="/admin/requests" className="btn-ghost">Request center</Link>
            <Link to="/admin/deposit-requests" className="btn-ghost">Deposit approvals</Link>
            <Link to="/admin/loan-requests" className="btn-ghost">Loan approvals</Link>
            <Link to="/admin/card-requests" className="btn-ghost">Card approvals</Link>
            <Link to="/admin/customers" className="btn-ghost">Approve KYC</Link>
            <Link to="/admin/transactions" className="btn-ghost">Reverse txn</Link>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Withdrawals settle instantly; deposits settle only on approval. All state changes
            are backend transactions with audit + notifications.
          </p>
        </Card>
      </div>
    </div>
  );
}
