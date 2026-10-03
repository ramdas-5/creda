import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi } from '../../api/admin';
import { inr } from '../../utils/currency';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ApiError } from '../../api/client';

export default function LoanRequests() {
  const qc = useQueryClient();
  const [amt, setAmt] = useState<Record<number, string>>({});
  const q = useQuery({ queryKey: ['adm-loans'], queryFn: () => adminApi.loanApplications('PENDING') });
  const list: any[] = Array.isArray(q.data) ? q.data : ((q.data as any)?.items || []);
  const approve = useMutation({
    mutationFn: ({ id, a }: { id: number; a: string }) => adminApi.approveLoan(id, a),
    onSuccess: () => { toast.success('Loan approved — amount disbursed to customer account'); qc.invalidateQueries({ queryKey: ['adm-loans'] }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Approve failed'),
  });
  const reject = useMutation({
    mutationFn: (id: number) => adminApi.rejectLoan(id, 'Not eligible'),
    onSuccess: () => { toast.success('Loan rejected'); qc.invalidateQueries({ queryKey: ['adm-loans'] }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Reject failed'),
  });
  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Loan applications</h1>
        <p className="page-sub">Approve with equal or reduced amount — disbursement credits the customer account atomically.</p>
      </div>
      {q.isLoading ? <SkeletonRows n={4} /> : q.isError ? <ErrorState message="Could not load loans." onRetry={() => q.refetch()} />
      : list.length === 0 ? <EmptyState title="No pending loans" hint="New applications will appear here." />
      : <Card className="!p-0"><div className="table-wrap !border-0"><table className="data">
        <thead><tr><th>Application</th><th>Customer</th><th>Requested</th><th>Approve amount</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
        <tbody>{list.map((l: any) => (
          <tr key={l.id}>
            <td className="font-mono text-xs">{l.reference}<br /><span className="text-slate-500">{l.loan_type} · {l.tenure_months}mo · {l.purpose}</span></td>
            <td>{l.customer || `#${l.customer_id}`}</td>
            <td className="font-medium">{inr(l.principal)}</td>
            <td><Input className="!w-32" value={amt[l.id] ?? l.principal} onChange={(e) => setAmt({ ...amt, [l.id]: e.target.value })} /></td>
            <td><StatusBadge value={l.status} /></td>
            <td className="text-right">
              <button className="mr-3 text-sm font-medium text-emerald-600 hover:underline" disabled={approve.isPending} onClick={() => approve.mutate({ id: l.id, a: amt[l.id] ?? l.principal })}>Approve & disburse</button>
              <button className="text-sm font-medium text-red-600 hover:underline" disabled={reject.isPending} onClick={() => reject.mutate(l.id)}>Reject</button>
            </td>
          </tr>))}</tbody></table></div></Card>}
    </div>
  );
}
