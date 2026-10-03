import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { authApi } from '../api/auth';
import { useAuth } from '../stores/auth';
import { Card, CardTitle } from '../components/ui/Card';
import { Input, Field } from '../components/ui/Input';
import { ApiError } from '../api/client';

export default function Security() {
  const { theme, setTheme } = useAuth();
  const [busy, setBusy] = useState(false);
  const { register, handleSubmit, reset } = useForm<{ current_password: string; new_password: string }>();
  const submit = async (v: { current_password: string; new_password: string }) => {
    setBusy(true);
    try { await authApi.changePassword(v.current_password, v.new_password); toast.success('Password changed'); reset(); }
    catch (e) { toast.error(e instanceof ApiError ? e.message : 'Change failed'); }
    finally { setBusy(false); }
  };
  const logoutAll = async () => {
    try { await authApi.logoutAll(); toast.success('All other sessions revoked'); }
    catch (e) { toast.error(e instanceof ApiError ? e.message : 'Failed'); }
  };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Security</h1>
      <Card><CardTitle>Change password</CardTitle>
        <form onSubmit={handleSubmit(submit)} className="mt-3 space-y-3">
          <Field label="Current password"><Input type="password" {...register('current_password', { required: true })} /></Field>
          <Field label="New password (min 8)"><Input type="password" {...register('new_password', { required: true, minLength: 8 })} /></Field>
          <button className="btn-primary" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button>
        </form>
      </Card>
      <Card><CardTitle>Sessions</CardTitle><button className="btn-ghost mt-3" onClick={logoutAll}>Log out all other sessions</button></Card>
      <Card><CardTitle>Appearance</CardTitle>
        <select className="input mt-3 max-w-xs" value={theme} onChange={(e) => setTheme(e.target.value as any)}>
          <option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option>
        </select>
      </Card>
    </div>
  );
}
