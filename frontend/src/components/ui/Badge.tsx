const tones: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  ACTIVE: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  VERIFIED: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  APPROVED: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300',
  PENDING: 'bg-amber-100 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300',
  APPLIED: 'bg-amber-100 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300',
  UNDER_REVIEW: 'bg-amber-100 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300',
  SUBMITTED: 'bg-amber-100 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300',
  FAILED: 'bg-red-100 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-300',
  REJECTED: 'bg-red-100 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-300',
  SUSPENDED: 'bg-red-100 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-300',
  FROZEN: 'bg-orange-100 text-orange-700 ring-orange-600/20 dark:bg-orange-500/10 dark:text-orange-300',
  CLOSED: 'bg-slate-200 text-slate-600 ring-slate-500/20 dark:bg-slate-700/40 dark:text-slate-300',
  REVERSED: 'bg-purple-100 text-purple-700 ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-300',
  OPEN: 'bg-blue-100 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300',
  ADMIN: 'bg-indigo-100 text-indigo-700 ring-indigo-600/20 dark:bg-indigo-500/10 dark:text-indigo-300',
  MANAGER: 'bg-violet-100 text-violet-700 ring-violet-600/20 dark:bg-violet-500/10 dark:text-violet-300',
  EMPLOYEE: 'bg-sky-100 text-sky-700 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-300',
  CUSTOMER: 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-700/40 dark:text-slate-300',
};

export function Badge({ value }: { value?: string }) {
  const v = (value || '—').toUpperCase();
  const tone = tones[v] || 'bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-800 dark:text-slate-300';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${tone}`}>
      {value || '—'}
    </span>
  );
}
