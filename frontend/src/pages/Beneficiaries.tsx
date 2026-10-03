import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { z } from 'zod';
import { beneficiariesApi } from '../api/beneficiaries';
import { beneficiarySchema } from '../schemas/auth';
import { maskAccount } from '../utils/currency';
import { Card, CardTitle } from '../components/ui/Card';
import { Input, Field } from '../components/ui/Input';
import { SkeletonRows } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';
import { Dialog, Confirm } from '../components/ui/Dialog';
import { ApiError } from '../api/client';

type Form = z.infer<typeof beneficiarySchema>;

export default function Beneficiaries() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['beneficiaries'], queryFn: beneficiariesApi.list });
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState<string | null>(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({ resolver: zodResolver(beneficiarySchema) });
  const list: any[] = Array.isArray(q.data) ? q.data : ((q.data as any)?.items || []);

  const create = useMutation({
    mutationFn: (b: Form) => beneficiariesApi.create(b),
    onSuccess: () => { toast.success('Beneficiary added'); setOpen(false); reset(); qc.invalidateQueries({ queryKey: ['beneficiaries'] }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not add beneficiary'),
  });
  const remove = useMutation({
    mutationFn: (id: string) => beneficiariesApi.remove(id),
    onSuccess: () => { toast.success('Beneficiary deleted'); setDel(null); qc.invalidateQueries({ queryKey: ['beneficiaries'] }); },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Delete failed'),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold">Beneficiaries</h1><button className="btn-primary" onClick={() => setOpen(true)}>Add beneficiary</button></div>
      {q.isLoading ? <SkeletonRows n={4} /> : q.isError ? <ErrorState message="Could not load beneficiaries." onRetry={() => q.refetch()} />
      : list.length === 0 ? <EmptyState title="No beneficiaries" hint="Add a beneficiary to start transferring money." />
      : <div className="grid gap-4 md:grid-cols-2">{list.map((b: any) => (
        <Card key={b.id}><CardTitle>{b.nickname || b.full_name}</CardTitle>
          <p className="mt-1 text-sm text-slate-500">{b.full_name} · {maskAccount(b.account_number)} · {b.bank_name}</p>
          <div className="mt-3 flex gap-2"><button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => setDel(b.id)}>Delete</button></div>
        </Card>))}</div>}
      <Dialog open={open} onClose={() => setOpen(false)} title="Add beneficiary">
        <form onSubmit={handleSubmit((v) => create.mutate(v))} className="space-y-3">
          <Field label="Nickname" error={errors.nickname?.message}><Input {...register('nickname')} /></Field>
          <Field label="Full name" error={errors.full_name?.message}><Input {...register('full_name')} /></Field>
          <Field label="Account number" error={errors.account_number?.message}><Input {...register('account_number')} /></Field>
          <Field label="Bank name" error={errors.bank_name?.message}><Input {...register('bank_name')} /></Field>
          <Field label="IFSC (optional)"><Input {...register('ifsc')} /></Field>
          <button className="btn-primary w-full" disabled={create.isPending}>{create.isPending ? 'Saving…' : 'Save beneficiary'}</button>
        </form>
      </Dialog>
      <Confirm open={!!del} onClose={() => setDel(null)} onConfirm={() => del && remove.mutate(del)} title="Delete beneficiary" message="This will remove the beneficiary. Future transfers to them will be unavailable. Continue?" />
    </div>
  );
}
