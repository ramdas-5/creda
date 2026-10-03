import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi } from '../../api/admin';
import { Card } from '../../components/ui/Card';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { ApiError } from '../../api/client';

export default function CardRequests() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['adm-cards'], queryFn: () => adminApi.cardRequests('PENDING') });
  const list: any[] = Array.isArray(q.data) ? q.data : ((q.data as any)?.items || []);
  const approve = useMutation({
    mutationFn: (id: number) => adminApi.approveCard(id),
    onSuccess: () => { toast.success('Card issued'); qc.invalidateQueries({ queryKey: ['adm-cards'] }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Approve failed'),
  });
  const reject = useMutation({
    mutationFn: (id: number) => adminApi.rejectCard(id, 'Declined'),
    onSuccess: () => { toast.success('Card rejected'); qc.invalidateQueries({ queryKey: ['adm-cards'] }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Reject failed'),
  });
  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Card requests</h1>
        <p className="page-sub">Issue tokenized cards only on approval — no CVV/PAN stored.</p>
      </div>
      {q.isLoading ? <SkeletonRows n={4} /> : q.isError ? <ErrorState message="Could not load requests." onRetry={() => q.refetch()} />
      : list.length === 0 ? <EmptyState title="No pending cards" hint="New requests will appear here." />
      : <Card className="!p-0"><div className="table-wrap !border-0"><table className="data">
        <thead><tr><th>Request</th><th>Customer</th><th>Account</th><th>Type</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
        <tbody>{list.map((r: any) => (
          <tr key={r.id}>
            <td className="font-mono text-xs">{r.reference}</td>
            <td>{r.customer || `#${r.customer_id}`}</td>
            <td className="font-mono text-xs">{r.account_number || r.account_id}</td>
            <td>{r.card_type}</td><td><StatusBadge value={r.status} /></td>
            <td className="text-right">
              <button className="mr-3 text-sm font-medium text-emerald-600 hover:underline" disabled={approve.isPending} onClick={() => approve.mutate(r.id)}>Approve & issue</button>
              <button className="text-sm font-medium text-red-600 hover:underline" disabled={reject.isPending} onClick={() => reject.mutate(r.id)}>Reject</button>
            </td>
          </tr>))}</tbody></table></div></Card>}
    </div>
  );
}
