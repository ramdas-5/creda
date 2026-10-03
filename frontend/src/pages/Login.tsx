import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { loginSchema, type LoginInput } from '../schemas/auth';
import { useAuth } from '../stores/auth';
import { Input, Field } from '../components/ui/Input';
import { ApiError } from '../api/client';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [show, setShow] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  const onSubmit = async (v: LoginInput) => {
    try { await login(v.identifier, v.password); toast.success('Welcome back'); nav('/dashboard'); }
    catch (e) { toast.error(e instanceof ApiError ? e.message : 'Login failed'); }
  };
  return (
    <div className="flex min-h-full items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-700 to-indigo-600 font-bold text-white">N</div>
          <div><h1 className="text-lg font-bold">Nexus Bank</h1><p className="text-xs text-slate-500">Secure banking sign-in</p></div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field label="Email or Account Number" error={(errors as any).identifier?.message}>
            <Input autoComplete="username" placeholder="you@example.com or 12-digit account no." {...register('identifier')} />
          </Field>
          <Field label="Password" error={errors.password?.message}>
            <div className="relative">
              <Input type={show ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••" {...register('password')} />
              <button type="button" className="absolute right-2 top-2 text-slate-500" onClick={() => setShow(!show)} aria-label="Toggle password">{show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>
          </Field>
          <button className="btn-primary w-full" disabled={isSubmitting}>{isSubmitting ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <div className="mt-4 flex justify-between text-sm">
          <Link to="/forgot-password" className="text-blue-700 hover:underline">Forgot password?</Link>
          <Link to="/register" className="text-blue-700 hover:underline">Create account</Link>
        </div>
        <p className="mt-6 text-[11px] text-slate-500">Your 12-digit account number was issued at registration. Never share your password.</p>
      </div>
    </div>
  );
}
