import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminApi } from '../../api/admin';
import { Card, CardTitle } from '../../components/ui/Card';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/EmptyState';
import { ApiError } from '../../api/client';

export default function Settings() {
  const q = useQuery({ queryKey: ['settings'], queryFn: adminApi.settings });
  const [raw, setRaw] = useState('');
  const [init, setInit] = useState(false);
  const save = useMutation({
    mutationFn: () => adminApi.saveSettings(JSON.parse(raw)),
    onSuccess: () => toast.success('Settings saved'),
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Save failed — check JSON'),
  });
  if (q.isLoading) return <SkeletonRows n={4} />;
  if (q.isError) return <ErrorState message="Could not load settings." onRetry={() => q.refetch()} />;
  if (!init) { setRaw(JSON.stringify(q.data ?? {}, null, 2)); setInit(true); }
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Settings</h1>
      <Card><CardTitle>System configuration (JSON)</CardTitle>
        <textarea className="input mt-3 min-h-[280px] font-mono text-xs" value={raw} onChange={(e) => setRaw(e.target.value)} />
        <button className="btn-primary mt-3" disabled={save.isPending} onClick={() => save.mutate()}>{save.isPending ? 'Saving…' : 'Save settings'}</button>
      </Card>
    </div>
  );
}
