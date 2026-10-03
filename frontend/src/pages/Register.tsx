import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { registerSchema, type RegisterInput } from '../schemas/auth';
import { authApi } from '../api/auth';
import { Input, Field } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { ApiError } from '../api/client';

export default function Register() {
  const nav = useNavigate();
  const [acct, setAcct] = useState('');
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });
  const onSubmit = async (v: RegisterInput) => {
    try {
      const d: any = await authApi.register(v);
      const num = d?.account_number || '';
      if (num) {
        setAcct(num);
        toast.success(`Account ${num} created — please sign in`);
      } else {
        toast.success('Account created — please sign in');
        nav('/login');
      }
    } catch (e) { toast.error(e instanceof ApiError ? e.message : 'Registration failed'); }
  };
  return (
    <div className="flex min-h-full items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-lg font-bold">Open an account</h1>
        <p className="mb-5 text-xs text-slate-500">Name + email + password — your 12-digit account number is issued instantly.</p>
        {acct ? (
          <Card className="mb-4 border-emerald-200 bg-emerald-50 text-center">
            <p className="text-xs text-slate-500">Your new account number</p>
            <p className="mt-1 font-mono text-2xl font-bold tracking-widest">{acct}</p>
            <p className="mt-1 text-xs text-slate-500">Save it — you can sign in with email OR this number.</p>
            <button className="btn-primary mt-3 w-full" onClick={() => nav('/login')}>Continue to sign in</button>
          </Card>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Full name" error={errors.full_name?.message}><Input {...register('full_name')} placeholder="Asha Sharma" /></Field>
            <Field label="Email" error={errors.email?.message}><Input type="email" {...register('email')} placeholder="you@example.com" /></Field>
            <Field label="Phone (optional)"><Input {...register('phone')} placeholder="+91…" /></Field>
            <Field label="Password" error={errors.password?.message}><Input type="password" {...register('password')} placeholder="Min 8 chars, A-Z + number" /></Field>
            <button className="btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? 'Creating…' : 'Create account'}</button>
          </form>
        )}
        <p className="mt-4 text-sm">Have an account? <Link to="/login" className="text-blue-700 hover:underline">Sign in</Link></p>
      </div>
    </div>
  );
}
