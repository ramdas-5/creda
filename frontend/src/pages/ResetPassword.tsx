import { useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '../api/auth';
import { Input } from '../components/ui/Input';
import { ApiError } from '../api/client';

export default function ResetPassword() {
  const [q] = useSearchParams();
  const nav = useNavigate();
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { await authApi.reset(q.get('token') || '', pw); toast.success('Password reset — please sign in'); nav('/login'); }
    catch (err) { toast.error(err instanceof ApiError ? err.message : 'Reset failed'); }
    finally { setBusy(false); }
  };
  return (
    <div className="flex min-h-full items-center justify-center bg-slate-50 p-4 dark:bg-slate-950">
      <div className="card w-full max-w-md p-8">
        <h1 className="text-lg font-bold">Reset password</h1>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <Input type="password" required minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} placeholder="New password (min 8)" />
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Resetting…' : 'Reset password'}</button>
        </form>
        <p className="mt-4 text-sm"><Link to="/login" className="text-blue-700 hover:underline">Back to sign in</Link></p>
      </div>
    </div>
  );
}
