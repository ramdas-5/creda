const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
export function inr(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === '') return '—';
  const n = typeof v === 'string' ? Number(v) : v;
  if (!Number.isFinite(n)) return '—';
  return fmt.format(n);
}
export function maskAccount(n?: string): string {
  if (!n) return '—';
  const d = n.replace(/\s/g, '');
  return d.length <= 4 ? '****' + d : '****' + d.slice(-4);
}
export function maskCard(n?: string): string {
  if (!n) return '—';
  return '•••• •••• •••• ' + n.slice(-4);
}
export function emiCalc(principal: number, annualRatePct: number, months: number): number {
  if (months <= 0) return 0;
  const r = annualRatePct / 1200;
  if (r === 0) return principal / months;
  const f = Math.pow(1 + r, months);
  return (principal * r * f) / (f - 1);
}
export function fdMaturity(principal: number, annualRatePct: number, months: number): number {
  return principal * Math.pow(1 + annualRatePct / 400, (months / 3));
}
