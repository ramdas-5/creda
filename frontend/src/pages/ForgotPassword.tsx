import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '../api/auth';
import { Input } from '../components/ui/Input';
import { ApiError } from '../api/client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { await authApi.forgot(email); toast.success('If the email exists, a reset link was sent.'); }
    catch (err) { toast.error(err instanceof ApiError ? err.message : 'Request failed'); }
    finally { setBusy(false); }
  };
  return (
    <div className="flex min-h-full items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-lg font-bold">Forgot password</h1>
        <p className="mb-4 text-sm text-slate-500">Enter your account email to receive a reset link.</p>
        <form onSubmit={submit} className="space-y-4">
          <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
        </form>
        <p className="mt-4 text-sm"><Link to="/login" className="text-blue-700 hover:underline">Back to sign in</Link></p>
      </div>
    </div>
  );
}
