import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';
import { Card, CardTitle } from '../../components/ui/Card';
import { SkeletonRows } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/EmptyState';
import { Volume } from '../../components/charts/Volume';
import { IncomeExpense } from '../../components/charts/IncomeExpense';

export default function Reports() {
  const q = useQuery({ queryKey: ['reports'], queryFn: adminApi.reports });
  if (q.isLoading) return <SkeletonRows n={5} />;
  if (q.isError) return <ErrorState message="Could not load reports." onRetry={() => q.refetch()} />;
  const d: any = q.data || {};
  const vol = ((d.volume || []) as any[]).map((v: any) => ({ label: v.label || v.month || '', volume: Number(v.volume || 0) }));
  const io = ((d.deposits_withdrawals || []) as any[]).map((v: any) => ({ month: v.month || '', income: Number(v.deposits || 0), expense: Number(v.withdrawals || 0) }));
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Reports</h1>
      <Card><CardTitle>Deposits vs withdrawals</CardTitle><div className="mt-3"><IncomeExpense data={io} /></div></Card>
      <Card><CardTitle>Volume</CardTitle><div className="mt-3"><Volume data={vol} /></div></Card>
    </div>
  );
}
