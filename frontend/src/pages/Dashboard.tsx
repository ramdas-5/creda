import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, ArrowDownToLine, ArrowUpFromLine, Wallet, ClipboardList } from 'lucide-react';
import { accountsApi } from '../api/accounts';
import { transactionsApi } from '../api/transactions';
import { depositsApi } from '../api/deposits';
import { loansApi } from '../api/loans';
import { cardsApi } from '../api/cards';
import { inr, maskAccount } from '../utils/currency';
import { Card, CardTitle, StatCard } from '../components/ui/Card';
import { SkeletonRows } from '../components/ui/Skeleton';
import { EmptyState, ErrorState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { IncomeExpense } from '../components/charts/IncomeExpense';

function toList(d: any): any[] {
  if (!d) return [];
  if (Array.isArray(d)) return d;
  return d.items || d.accounts || [];
}

export default function Dashboard() {
  const acc = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list });
  const txn = useQuery({ queryKey: ['recent-tx'], queryFn: () => transactionsApi.list({ page: 1, page_size: 6 }) });
  const dep = useQuery({ queryKey: ['my-deposits'], queryFn: () => depositsApi.requests() });
  const loans = useQuery({ queryKey: ['my-loans'], queryFn: () => loansApi.list() });
  const cards = useQuery({ queryKey: ['my-cards'], queryFn: cardsApi.list });

  const accounts = toList(acc.data);
  const txns = toList(txn.data);
  const pendingDeps = toList(dep.data).filter((r) => r.status === 'PENDING');
  const myLoans = toList(loans.data).slice(0, 2);
  const myCards = toList(cards.data).slice(0, 2);
  const total = accounts.reduce((s, a) => s + Number(a.balance || 0), 0);
  const income = txns.filter((t) => String(t.direction || '').toUpperCase() === 'CREDIT').reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0);
  const expense = txns.filter((t) => String(t.direction || '').toUpperCase() === 'DEBIT').reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-slate-900 p-5 text-white md:p-6">
        <p className="text-sm text-slate-300">Welcome back</p>
        <h1 className="mt-1 text-xl font-bold md:text-2xl">Total balance {accounts.length ? inr(total) : '—'}</h1>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/deposit" className="btn-primary !bg-white !text-slate-900"><ArrowDownToLine className="h-4 w-4" /> Deposit</Link>
          <Link to="/withdraw" className="btn-ghost !border-slate-600 !bg-transparent !text-white"><ArrowUpFromLine className="h-4 w-4" /> Withdraw</Link>
          <Link to="/transfers/new" className="btn-ghost !border-slate-600 !bg-transparent !text-white"><ArrowLeftRight className="h-4 w-4" /> Transfer</Link>
          <Link to="/transactions" className="btn-ghost !border-slate-600 !bg-transparent !text-white">View transactions</Link>
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">My accounts ({accounts.length})</h2>
          <Link to="/accounts" className="text-sm text-blue-700 hover:underline">View all</Link>
        </div>
        {acc.isLoading ? <SkeletonRows n={2} /> : acc.isError ? <ErrorState message="Could not load accounts." onRetry={() => acc.refetch()} />
        : accounts.length === 0 ? <EmptyState title="No accounts" hint="Your bank account appears automatically after registration." />
        : <div className="grid gap-4 md:grid-cols-2">{accounts.map((a: any) => (
          <Link key={a.id} to={`/accounts/${a.id}`}>
            <Card className="card-hover">
              <CardTitle>{a.account_type_name || 'Savings Account'}</CardTitle>
              <p className="font-mono text-xs text-slate-500">{maskAccount(a.account_number)}</p>
              <p className="mt-2 text-2xl font-bold">{inr(a.balance)}</p>
              <div className="mt-2"><StatusBadge value={a.status} /></div>
            </Card>
          </Link>))}</div>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Money in (recent)" value={txns.length ? inr(income) : '—'} tone="bg-emerald-600" />
        <StatCard label="Money out (recent)" value={txns.length ? inr(expense) : '—'} tone="bg-amber-600" />
        <Card><CardTitle>Pending requests</CardTitle>
          <p className="mt-2 text-2xl font-bold">{pendingDeps.length}</p>
          <Link to="/requests" className="mt-1 inline-flex items-center gap-1 text-sm text-blue-700 hover:underline"><ClipboardList className="h-4 w-4" /> Track in My Requests</Link>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardTitle>Income vs expense</CardTitle>
          <div className="mt-3"><IncomeExpense data={txns.length ? [{ month: 'Recent', income, expense }] : []} /></div>
        </Card>
        <Card>
          <div className="mb-2 flex items-center justify-between"><CardTitle>Recent transactions</CardTitle><Link to="/transactions" className="text-sm text-blue-700">View all</Link></div>
          {txn.isLoading ? <SkeletonRows /> : txns.length === 0 ? <EmptyState title="No transactions yet" hint="Deposits, withdrawals and transfers will appear here." />
          : <div className="table-wrap !border-0"><table className="data"><thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead>
            <tbody>{txns.slice(0, 5).map((t: any) => (
              <tr key={t.id}><td>{t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN') : '—'}</td><td>{t.type}</td><td>{inr(t.amount)}</td><td><StatusBadge value={t.status} /></td></tr>
            ))}</tbody></table></div>}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-2 flex items-center justify-between"><CardTitle>Loans</CardTitle><Link to="/loans" className="text-sm text-blue-700">View all</Link></div>
          {myLoans.length === 0 ? <p className="text-sm text-slate-500">No loans. <Link to="/loans/apply" className="text-blue-700 hover:underline">Apply for a loan</Link></p>
          : myLoans.map((l: any) => <p key={l.id} className="py-1 text-sm">{l.loan_type} · {inr(l.principal)} · <StatusBadge value={l.status} /></p>)}
        </Card>
        <Card>
          <div className="mb-2 flex items-center justify-between"><CardTitle>Cards</CardTitle><Link to="/cards" className="text-sm text-blue-700">View all</Link></div>
          {myCards.length === 0 ? <p className="text-sm text-slate-500">No cards. <Link to="/cards" className="text-blue-700 hover:underline">Request a card</Link></p>
          : myCards.map((c: any) => <p key={c.id} className="py-1 font-mono text-sm">****{c.last4} · <StatusBadge value={c.status} /></p>)}
        </Card>
      </div>

      {!accounts.length && !acc.isLoading && (
        <Card className="flex items-center gap-3"><Wallet className="h-5 w-5 text-slate-400" /><p className="text-sm text-slate-500">Account provisioning runs automatically at registration.</p></Card>
      )}
    </div>
  );
}
