import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supportApi } from '../api/support';
import { Card, CardTitle } from '../components/ui/Card';
import { SkeletonRows } from '../components/ui/Skeleton';
import { ErrorState, EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { ApiError } from '../api/client';

export default function SupportDetail() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const [msg, setMsg] = useState('');
  const q = useQuery({ queryKey: ['ticket', id], queryFn: () => supportApi.get(id) });
  const reply = useMutation({
    mutationFn: () => supportApi.reply(id, msg),
    onSuccess: () => { setMsg(''); toast.success('Reply sent'); qc.invalidateQueries({ queryKey: ['ticket', id] }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Reply failed'),
  });
  if (q.isLoading) return <SkeletonRows n={4} />;
  if (q.isError) return <ErrorState message="Could not load ticket." onRetry={() => q.refetch()} />;
  const t: any = q.data || {};
  const msgs: any[] = t.messages || [];
  return (
    <div className="space-y-4">
      <Link to="/support" className="text-sm text-blue-700">← All tickets</Link>
      <Card><div className="flex items-center justify-between"><CardTitle>{t.subject}</CardTitle><Badge value={t.status} /></div></Card>
      {msgs.length === 0 ? <EmptyState title="No replies yet" hint="Replies from the support team will appear here." /> :
        <div className="space-y-2">{msgs.map((m: any) => <Card key={m.id}><p className="text-sm">{m.body}</p><p className="mt-1 text-[11px] text-slate-400">{m.author || ''} · {m.created_at ? new Date(m.created_at).toLocaleString('en-IN') : ''}</p></Card>)}</div>}
      <Card>
        <textarea className="input min-h-[90px]" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Write a reply…" />
        <button className="btn-primary mt-2" disabled={!msg.trim() || reply.isPending} onClick={() => reply.mutate()}>{reply.isPending ? 'Sending…' : 'Send reply'}</button>
      </Card>
    </div>
  );
}
