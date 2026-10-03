import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { supportApi } from '../api/support';
import { ticketSchema } from '../schemas/auth';
import { Card, CardTitle } from '../components/ui/Card';
import { Input, Field } from '../components/ui/Input';
import { SkeletonRows } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { Dialog } from '../components/ui/Dialog';
import { ApiError } from '../api/client';

type Form = z.infer<typeof ticketSchema>;

export default function Support() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const q = useQuery({ queryKey: ['tickets'], queryFn: supportApi.list });
  const list: any[] = Array.isArray(q.data) ? q.data : ((q.data as any)?.items || []);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({ resolver: zodResolver(ticketSchema) });
  const create = useMutation({
    mutationFn: (b: Form) => supportApi.create(b),
    onSuccess: () => { toast.success('Ticket created'); setOpen(false); reset(); qc.invalidateQueries({ queryKey: ['tickets'] }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Failed'),
  });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold">Support</h1><button className="btn-primary" onClick={() => setOpen(true)}>New ticket</button></div>
      {q.isLoading ? <SkeletonRows n={4} /> : q.isError ? <ErrorState message="Could not load tickets." onRetry={() => q.refetch()} />
      : list.length === 0 ? <EmptyState title="No tickets" hint="Raise a ticket and the support team will respond here." />
      : <div className="space-y-2">{list.map((t: any) => <Link key={t.id} to={`/support/${t.id}`}><Card className="flex items-center justify-between"><div><CardTitle>{t.subject}</CardTitle><p className="text-xs text-slate-500">{t.category}</p></div><Badge value={t.status} /></Card></Link>)}</div>}
      <Dialog open={open} onClose={() => setOpen(false)} title="New ticket">
        <form onSubmit={handleSubmit((v) => create.mutate(v))} className="space-y-3">
          <Field label="Subject" error={errors.subject?.message}><Input {...register('subject')} /></Field>
          <Field label="Category" error={errors.category?.message}><Input {...register('category')} placeholder="payments / cards / loans…" /></Field>
          <Field label="Message" error={errors.message?.message}><textarea className="input min-h-[100px]" {...register('message')} /></Field>
          <button className="btn-primary w-full" disabled={create.isPending}>{create.isPending ? 'Creating…' : 'Submit'}</button>
        </form>
      </Dialog>
    </div>
  );
}
