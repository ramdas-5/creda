import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { Card } from '../../components/ui/Card';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';

export default function AuditLogs() {
  const [page, setPage] = useState(1);
  const q = useQuery({ queryKey: ['audit', page], queryFn: () => adminApi.auditLogs(page) });
  const list: any[] = Array.isArray(q.data) ? q.data : ((q.data as any)?.items || []);
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Audit logs</h1>
      {q.isLoading ? <SkeletonRows n={6} /> : q.isError ? <ErrorState message="Could not load audit logs." onRetry={() => q.refetch()} />
      : list.length === 0 ? <EmptyState title="No audit events" hint="LOGIN, TRANSFER_* and ADMIN_ACTION events will appear here." />
      : <Card className="!p-0"><div className="table-wrap !border-0"><table className="data"><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th></tr></thead>
        <tbody>{list.map((l: any, i: number) => <tr key={l.id || i}><td>{l.created_at ? new Date(l.created_at).toLocaleString('en-IN') : '—'}</td><td>{l.user_email || l.user_id || '—'}</td><td>{l.action}</td><td>{l.entity ? `${l.entity}:${l.entity_id || ''}` : '—'}</td></tr>)}</tbody></table></div>
        <div className="flex justify-end gap-2 p-4"><button className="btn-ghost !px-3 !py-1" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button><button className="btn-ghost !px-3 !py-1" onClick={() => setPage(page + 1)}>Next</button></div></Card>}
    </div>
  );
}
