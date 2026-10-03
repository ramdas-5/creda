import React from 'react';
import { cn } from '../../utils/cn';
export function Button({ variant = 'primary', className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const v = variant === 'primary' ? 'btn-primary' : variant === 'danger' ? 'inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50' : 'btn-ghost';
  return <button className={cn(v, className)} {...p} />;
}
