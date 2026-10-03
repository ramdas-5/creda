import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi } from '../../api/admin';
import { inr } from '../../utils/currency';
import { Card, CardTitle } from '../../components/ui/Card';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Confirm } from '../../components/ui/Dialog';
import { ApiError } from '../../api/client';

export default function DepositRequests() {
  const qc = useQueryClient();
  const [rej, setRej] = useState<any | null>(null);
  const [reason, setReason] = useState('');
  const q = useQuery({ queryKey: ['adm-dep-req'], queryFn: () => adminApi.depositRequests('PENDING') });
  const list: any[] = Array.isArray(q.data) ? q.data : ((q.data as any)?.items || []);
  const approve = useMutation({
    mutationFn: (id: number) => adminApi.approveDeposit(id),
    onSuccess: () => { toast.success('Deposit approved — balance credited'); qc.invalidateQueries({ queryKey: ['adm-dep-req'] }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Approve failed'),
  });
  const reject = useMutation({
    mutationFn: () => adminApi.rejectDeposit(rej.id, reason),
    onSuccess: () => { toast.success('Deposit rejected'); setRej(null); setReason(''); qc.invalidateQueries({ queryKey: ['adm-dep-req'] }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Reject failed'),
  });
  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Deposit requests</h1>
        <p className="page-sub">Verify customer, account and amount. Balance moves only on approval — double approval is blocked.</p>
      </div>
      {q.isLoading ? <SkeletonRows n={4} /> : q.isError ? <ErrorState message="Could not load requests." onRetry={() => q.refetch()} />
      : list.length === 0 ? <EmptyState title="No pending deposits" hint="New customer requests will appear here." />
      : <Card className="!p-0"><div className="table-wrap !border-0"><table className="data">
        <thead><tr><th>Request</th><th>Customer</th><th>Account</th><th>Amount</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
        <tbody>{list.map((r: any) => (
          <tr key={r.id}>
            <td className="font-mono text-xs">{r.reference}</td>
            <td>{r.customer || `#${r.customer_id}`}</td>
            <td className="font-mono text-xs">{r.account_number || r.account_id}</td>
            <td className="font-medium">{inr(r.amount)}</td>
            <td><StatusBadge value={r.status} /></td>
            <td className="text-right">
              <button className="mr-3 text-sm font-medium text-emerald-600 hover:underline" disabled={approve.isPending} onClick={() => approve.mutate(r.id)}>Approve</button>
              <button className="text-sm font-medium text-red-600 hover:underline" onClick={() => setRej(r)}>Reject</button>
            </td>
          </tr>))}</tbody></table></div></Card>}
      <Confirm open={!!rej} onClose={() => setRej(null)} onConfirm={() => reject.mutate()}
        title={`Reject ${rej?.reference}?`} message="Balance will NOT change. Provide a reason for the customer." />
      {rej && (
        <Card><CardTitle>Rejection reason</CardTitle>
          <input className="input mt-2" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Unverified cash source" />
        </Card>
      )}
    </div>
  );
}
