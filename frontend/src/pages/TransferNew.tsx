import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { transferSchema, type TransferInput } from '../schemas/auth';
import { accountsApi } from '../api/accounts';
import { beneficiariesApi } from '../api/beneficiaries';
import { transfersApi } from '../api/transfers';
import { inr, maskAccount } from '../utils/currency';
import { Card, CardTitle } from '../components/ui/Card';
import { Input, Field } from '../components/ui/Input';
import { Dialog } from '../components/ui/Dialog';
import { ApiError } from '../api/client';

export default function TransferNew() {
  const [confirm, setConfirm] = useState<TransferInput | null>(null);
  const [result, setResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const accQ = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list });
  const benQ = useQuery({ queryKey: ['beneficiaries'], queryFn: beneficiariesApi.list });
  const accounts: any[] = Array.isArray(accQ.data) ? accQ.data : ((accQ.data as any)?.items || []);
  const bens: any[] = Array.isArray(benQ.data) ? benQ.data : ((benQ.data as any)?.items || []);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<TransferInput>({ resolver: zodResolver(transferSchema), defaultValues: { mode: 'beneficiary' } });
  const mode = watch('mode');

  const srcAcc = (id?: string) => accounts.find((a) => a.id === id);
  const ben = (id?: string) => bens.find((b) => b.id === id);
  const fee = 0;

  const execute = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      const res = await transfersApi.create(confirm);
      setResult(res);
      toast.success(`Transfer successful · ${res?.reference_number || res?.reference || 'TXN recorded'}`);
      setConfirm(null);
    } catch (e) { toast.error(e instanceof ApiError ? e.message : 'Transfer failed — nothing was debited.'); }
    finally { setBusy(false); }
  };

  if (result) {
    return (
      <div className="mx-auto max-w-lg"><Card className="text-center">
        <p className="text-5xl">✅</p>
        <h1 className="mt-2 text-lg font-bold text-emerald-600">Transfer successful</h1>
        <p className="mt-2 font-mono text-sm">{result.reference_number || result.reference || result.id}</p>
        <p className="mt-1 text-2xl font-bold">{inr(result.amount)}</p>
        <div className="mt-4 flex justify-center gap-2"><Link to="/transfers" className="btn-ghost">All transfers</Link><button className="btn-primary" onClick={() => setResult(null)}>New transfer</button></div>
      </Card></div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-bold">New transfer</h1>
      <Card>
        <form onSubmit={handleSubmit((v) => setConfirm(v))} className="space-y-4">
          <Field label="Mode">
            <select className="input" {...register('mode')}>
              <option value="beneficiary">To beneficiary</option>
              <option value="internal">Internal (account → account)</option>
              <option value="self">Self transfer</option>
            </select>
          </Field>
          <Field label="Source account" error={errors.source_account_id?.message}>
            <select className="input" {...register('source_account_id')}>
              <option value="">Select account</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.account_type} {maskAccount(a.account_number)} · {inr(a.balance)}</option>)}
            </select>
          </Field>
          {mode === 'beneficiary' ? (
            <Field label="Beneficiary" error={errors.beneficiary_id?.message}>
              <select className="input" {...register('beneficiary_id')}>
                <option value="">Select beneficiary</option>
                {bens.map((b) => <option key={b.id} value={b.id}>{b.nickname || b.full_name} · {maskAccount(b.account_number)}</option>)}
              </select>
            </Field>
          ) : (
            <Field label="Destination account">
              <select className="input" {...register('destination_account_id')}>
                <option value="">Select account</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{a.account_type} {maskAccount(a.account_number)}</option>)}
              </select>
            </Field>
          )}
          <Field label="Amount (INR)" error={errors.amount?.message}><Input type="number" step="0.01" min="1" placeholder="10000" {...register('amount')} /></Field>
          <Field label="Remarks (optional)"><Input {...register('remarks')} placeholder="Rent, family…" /></Field>
          <button className="btn-primary w-full">Review & confirm</button>
        </form>
      </Card>

      <Dialog open={!!confirm} onClose={() => setConfirm(null)} title="Confirm transfer">
        {confirm && (
          <div className="space-y-2 text-sm">
            <p><span className="text-slate-500">From:</span> {srcAcc(confirm.source_account_id)?.account_type} {maskAccount(srcAcc(confirm.source_account_id)?.account_number)}</p>
            <p><span className="text-slate-500">To:</span> {confirm.mode === 'beneficiary' ? `${ben(confirm.beneficiary_id)?.nickname} ${maskAccount(ben(confirm.beneficiary_id)?.account_number)}` : `${maskAccount(srcAcc(confirm.destination_account_id)?.account_number)}`}</p>
            <p><span className="text-slate-500">Amount:</span> <b>{inr(confirm.amount)}</b></p>
            <p><span className="text-slate-500">Transfer fee:</span> {inr(fee)}</p>
            <p className="border-t pt-2"><span className="text-slate-500">Total:</span> <b>{inr(Number(confirm.amount) + fee)}</b></p>
            <div className="flex justify-end gap-2 pt-3"><button className="btn-ghost" onClick={() => setConfirm(null)}>Back</button><button className="btn-primary" disabled={busy} onClick={execute}>{busy ? 'Sending…' : 'Confirm & send'}</button></div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
