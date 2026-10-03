import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { Card, CardTitle } from '../components/ui/Card';
import { SkeletonRows } from '../components/ui/Skeleton';
import { ErrorState } from '../components/ui/EmptyState';

export default function Profile() {
  const q = useQuery({ queryKey: ['me'], queryFn: authApi.me });
  if (q.isLoading) return <SkeletonRows n={4} />;
  if (q.isError) return <ErrorState message="Could not load profile." onRetry={() => q.refetch()} />;
  const u: any = (q.data as any)?.user || q.data || {};
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Profile</h1>
      <Card><CardTitle>{u.full_name || u.email}</CardTitle>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd>{u.email}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Phone</dt><dd>{u.phone || '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">Roles</dt><dd>{(u.roles || []).join(', ') || 'customer'}</dd></div>
          <div className="flex justify-between"><dt className="text-slate-500">KYC</dt><dd>{u.kyc_status || 'NOT_SUBMITTED'}</dd></div>
        </dl>
        <p className="mt-3 text-xs text-slate-500">Profile edits are available once the backend exposes them; no fake update is wired.</p>
      </Card>
    </div>
  );
}
