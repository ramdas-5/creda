import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { accountsApi } from '../api/accounts';
import { statementsApi } from '../api/statements';
import { inr } from '../utils/currency';
import { Card, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';

function toCsv(rows: any[]): string {
  const head = 'date,reference,description,debit,credit,balance';
  const lines = rows.map((t) => [t.created_at || '', t.reference_number || t.id || '', JSON.stringify(t.description || ''), t.direction === 'debit' ? t.amount : '', t.direction === 'credit' ? t.amount : '', t.balance_after ?? ''].join(','));
  return [head, ...lines].join('\n');
}

export default function Statements() {
  const [accountId, setAccountId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [run, setRun] = useState(false);
  const accQ = useQuery({ queryKey: ['accounts'], queryFn: accountsApi.list });
  const accounts: any[] = Array.isArray(accQ.data) ? accQ.data : ((accQ.data as any)?.items || []);
  const st = useQuery({ queryKey: ['statement', accountId, from, to, run], queryFn: () => statementsApi.get({ account_id: accountId, from, to }), enabled: run && !!accountId });
  const rows: any[] = (st.data as any)?.transactions || (st.data as any)?.items || [];

  const download = () => {
    const blob = new Blob([toCsv(rows)], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `statement-${accountId}-${from || 'all'}-${to || 'all'}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Statements</h1>
      <Card>
        <div className="grid gap-3 md:grid-cols-4">
          <select className="input" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">Select account</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.account_type} ··{String(a.account_number || '').slice(-4)}</option>)}
          </select>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <button className="btn-primary" disabled={!accountId} onClick={() => setRun(true)}>Generate</button>
        </div>
        {rows.length > 0 && <div className="mt-3 flex gap-2"><button className="btn-ghost" onClick={download}>Download CSV</button><button className="btn-ghost" onClick={() => window.print()}>Print / PDF</button></div>}
      </Card>
      {!run ? <EmptyState title="No statement yet" hint="Pick an account and date range, then generate." />
      : st.isLoading ? <Card>Loading statement…</Card>
      : rows.length === 0 ? <EmptyState title="Empty statement" hint="No transactions in this period, or the backend is offline." />
      : <Card className="!p-0">
        <div className="border-b p-4 text-sm"><CardTitle>Statement · {(st.data as any)?.account_number || accountId}</CardTitle><p className="text-slate-500">Opening {inr((st.data as any)?.opening_balance)} · Closing {inr((st.data as any)?.closing_balance)}</p></div>
        <div className="table-wrap !border-0"><table className="data"><thead><tr><th>Date</th><th>Description</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
          <tbody>{rows.map((t: any, i: number) => <tr key={t.id || i}><td>{t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN') : '—'}</td><td>{t.description || t.reference_number || '—'} <Badge value={t.status} /></td><td>{t.direction === 'debit' ? inr(t.amount) : '—'}</td><td>{t.direction === 'credit' ? inr(t.amount) : '—'}</td><td>{t.balance_after !== undefined ? inr(t.balance_after) : '—'}</td></tr>)}</tbody></table></div>
      </Card>}
    </div>
  );
}
