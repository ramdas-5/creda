import { useMemo, useState } from 'react';
import { emiCalc, inr } from '../utils/currency';
import { Card, CardTitle } from '../components/ui/Card';
import { Input, Field } from '../components/ui/Input';

export default function LoanCalculator() {
  const [p, setP] = useState(500000);
  const [r, setR] = useState(9);
  const [n, setN] = useState(60);
  const emi = useMemo(() => emiCalc(p, r, n), [p, r, n]);
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-xl font-bold">EMI calculator</h1>
      <Card className="space-y-4">
        <Field label={`Principal: ${inr(p)}`}><Input type="range" min={10000} max={10000000} step={10000} value={p} onChange={(e) => setP(Number(e.target.value))} /></Field>
        <Field label={`Interest: ${r}% p.a.`}><Input type="range" min={1} max={24} step={0.1} value={r} onChange={(e) => setR(Number(e.target.value))} /></Field>
        <Field label={`Tenure: ${n} months`}><Input type="range" min={6} max={360} step={6} value={n} onChange={(e) => setN(Number(e.target.value))} /></Field>
      </Card>
      <Card><CardTitle>Monthly EMI</CardTitle><p className="mt-2 text-3xl font-bold">{inr(emi)}</p><p className="mt-1 text-sm text-slate-500">Total payable {inr(emi * n)} · Interest {inr(emi * n - p)}</p></Card>
    </div>
  );
}
