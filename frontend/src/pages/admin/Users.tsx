import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi } from '../../api/admin';
import { Card, CardTitle } from '../../components/ui/Card';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { Confirm } from '../../components/ui/Dialog';
import { Badge } from '../../components/ui/Badge';
import { ApiError } from '../../api/client';

export default function Users() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [sus, setSus] = useState<any | null>(null);
  const q = useQuery({ queryKey: ['admin-users', page], queryFn: () => adminApi.users(page) });
  const list: any[] = Array.isArray(q.data) ? q.data : ((q.data as any)?.items || []);
  const suspend = useMutation({
    mutationFn: (id: string) => adminApi.suspendUser(id),
    onSuccess: () => { toast.success('User suspended — sign-in blocked'); setSus(null); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Action failed'),
  });
  const activate = useMutation({
    mutationFn: (id: string) => adminApi.activateUser(id),
    onSuccess: () => { toast.success('User re-activated'); qc.invalidateQueries({ queryKey: ['admin-users'] }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Action failed'),
  });
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Users & access</h1>
        <p className="text-sm text-slate-500">Admin-only. Suspend blocks sign-in instantly; activation clears lockouts.</p>
      </div>
      {q.isLoading ? <SkeletonRows n={5} /> : q.isError ? <ErrorState message="Could not load users." onRetry={() => q.refetch()} />
      : list.length === 0 ? <EmptyState title="No users" hint="User records will appear here." />
      : <Card className="!p-0">
        <div className="table-wrap !border-0"><table className="data">
          <thead><tr><th>Email</th><th>Name</th><th>Role</th><th>Status</th><th className="text-right">Actions</th></tr></thead>
          <tbody>{list.map((u: any) => {
            const role = u.role || (u.roles || [])[0] || '—';
            return <tr key={u.id}>
              <td className="font-medium">{u.email}</td>
              <td>{u.full_name || '—'}</td>
              <td><Badge value={role} /></td>
              <td><Badge value={u.is_active ? 'ACTIVE' : 'SUSPENDED'} /></td>
              <td className="text-right">
                {u.is_active
                  ? <button className="text-sm font-medium text-red-600 hover:underline" onClick={() => setSus(u)}>Suspend</button>
                  : <button className="text-sm font-medium text-emerald-600 hover:underline" disabled={activate.isPending} onClick={() => activate.mutate(u.id)}>Activate</button>}
              </td>
            </tr>;
          })}</tbody>
        </table></div>
        <div className="flex justify-end gap-2 p-4"><button className="btn-ghost !px-3 !py-1" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button><button className="btn-ghost !px-3 !py-1" onClick={() => setPage(page + 1)}>Next</button></div>
      </Card>}
      <Confirm open={!!sus} onClose={() => setSus(null)} onConfirm={() => sus && suspend.mutate(sus.id)} title={`Suspend ${sus?.email}?`} message="Suspending blocks sign-in for this user immediately. Their accounts stay frozen as-is. Continue?" />
    </div>
  );
}
