import React from 'react';
import { cn } from '../../utils/cn';

export function Card({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('card', className)} {...p} />;
}

export function CardTitle({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-sm font-semibold text-slate-800 dark:text-slate-100', className)} {...p} />;
}

export function StatCard({ label, value, icon, tone = 'bg-blue-600' }: {
  label: string; value: string; icon?: React.ReactNode; tone?: string;
}) {
  return (
    <div className="card card-hover flex items-center gap-4">
      {icon && <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ${tone}`}>{icon}</span>}
      <span className="min-w-0">
        <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</span>
        <span className="mt-0.5 block truncate text-xl font-bold">{value}</span>
      </span>
    </div>
  );
}
