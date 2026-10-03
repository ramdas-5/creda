import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi } from '../../api/admin';
import { Card, CardTitle } from '../../components/ui/Card';
import { Input, Field } from '../../components/ui/Input';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { Dialog } from '../../components/ui/Dialog';
import { ApiError } from '../../api/client';

export default function Branches() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ code: '', name: '', address: '', phone: '', email: '' });
  const q = useQuery({ queryKey: ['branches'], queryFn: adminApi.branches });
  const list: any[] = Array.isArray(q.data) ? q.data : ((q.data as any)?.items || []);
  const create = useMutation({
    mutationFn: () => adminApi.createBranch(form),
    onSuccess: () => { toast.success('Branch created'); setOpen(false); qc.invalidateQueries({ queryKey: ['branches'] }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed'),
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold">Branches</h1><button className="btn-primary" onClick={() => setOpen(true)}>Add branch</button></div>
      {q.isLoading ? <SkeletonRows n={4} /> : q.isError ? <ErrorState message="Could not load branches." onRetry={() => q.refetch()} />
      : list.length === 0 ? <EmptyState title="No branches" hint="Add the first branch to get started." />
      : <div className="grid gap-4 md:grid-cols-2">{list.map((b: any) => <Card key={b.id}><CardTitle>{b.name} · {b.code}</CardTitle><p className="text-sm text-slate-500">{b.address || ''} · {b.phone || ''}</p></Card>)}</div>}
      <Dialog open={open} onClose={() => setOpen(false)} title="Add branch">
        <div className="space-y-3">
          <Field label="Code"><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></Field>
          <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
          <Field label="Address"><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Email"><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <button className="btn-primary w-full" disabled={create.isPending} onClick={() => create.mutate()}>{create.isPending ? 'Saving…' : 'Save'}</button>
        </div>
      </Dialog>
    </div>
  );
}
