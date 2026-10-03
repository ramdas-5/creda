import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { notificationsApi } from '../api/notifications';
import { Card } from '../components/ui/Card';
import { SkeletonRows } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';
import { ApiError } from '../api/client';

export default function Notifications() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['notifications'], queryFn: notificationsApi.list });
  const list: any[] = Array.isArray(q.data) ? q.data : ((q.data as any)?.items || []);
  const read = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed'),
  });
  const all = useMutation({
    mutationFn: notificationsApi.markAll,
    onSuccess: () => { toast.success('All marked as read'); qc.invalidateQueries({ queryKey: ['notifications'] }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed'),
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold">Notifications</h1><button className="btn-ghost" onClick={() => all.mutate()}>Mark all read</button></div>
      {q.isLoading ? <SkeletonRows n={5} /> : q.isError ? <ErrorState message="Could not load notifications." onRetry={() => q.refetch()} />
      : list.length === 0 ? <EmptyState title="All caught up" hint="Transfer alerts, logins and security events will appear here." />
      : <div className="space-y-2">{list.map((n: any) => {
        const unread = !(n.is_read ?? n.read);
        return <Card key={n.id} className={unread ? '!border-blue-300' : ''}>
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-sm font-semibold">{n.title}</p><p className="text-sm text-slate-500">{n.body || n.message}</p><p className="mt-1 text-[11px] text-slate-400">{n.created_at ? new Date(n.created_at).toLocaleString('en-IN') : ''}</p></div>
            {unread && <button className="btn-ghost !px-3 !py-1 text-xs" onClick={() => read.mutate(n.id)}>Mark read</button>}
          </div>
        </Card>;
      })}</div>}
    </div>
  );
}
