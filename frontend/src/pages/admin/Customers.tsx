import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi } from '../../api/admin';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { ApiError } from '../../api/client';

export default function Customers() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useQuery({ queryKey: ['admin-customers', page, search], queryFn: () => adminApi.customers(page, search) });
  const list: any[] = Array.isArray(q.data) ? q.data : ((q.data as any)?.items || []);
  const kyc = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => adminApi.setKyc(id, status),
    onSuccess: () => { toast.success('KYC updated'); qc.invalidateQueries({ queryKey: ['admin-customers'] }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'KYC update failed'),
  });
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Customers & KYC</h1>
        <p className="text-sm text-slate-500">Staff can verify or reject KYC. Customers cannot change their own KYC status to VERIFIED.</p>
      </div>
      <Card><Input placeholder="Search customers…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="max-w-sm" /></Card>
      {q.isLoading ? <SkeletonRows n={5} /> : q.isError ? <ErrorState message="Could not load customers." onRetry={() => q.refetch()} />
      : list.length === 0 ? <EmptyState title="No customers" hint="Try a different search." />
      : <Card className="!p-0"><div className="table-wrap !border-0"><table className="data">
        <thead><tr><th>Customer</th><th>Email</th><th>KYC</th><th className="text-right">Actions</th></tr></thead>
        <tbody>{list.map((c: any) => <tr key={c.id}>
          <td className="font-medium">{c.full_name || `Customer #${c.id}`}</td>
          <td>{c.email || '—'}</td>
          <td><Badge value={c.kyc_status} /></td>
          <td className="text-right">
            <div className="flex justify-end gap-2">
              <button className="text-sm font-medium text-emerald-600 hover:underline" disabled={kyc.isPending} onClick={() => kyc.mutate({ id: c.id, status: 'VERIFIED' })}>Verify</button>
              <button className="text-sm font-medium text-red-600 hover:underline" disabled={kyc.isPending} onClick={() => kyc.mutate({ id: c.id, status: 'REJECTED' })}>Reject</button>
            </div>
          </td>
        </tr>)}</tbody></table></div>
        <div className="flex justify-end gap-2 p-4"><button className="btn-ghost !px-3 !py-1" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button><button className="btn-ghost !px-3 !py-1" onClick={() => setPage(page + 1)}>Next</button></div></Card>}
    </div>
  );
}
