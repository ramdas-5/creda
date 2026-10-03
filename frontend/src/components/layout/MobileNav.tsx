import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { useVisibleSections } from './Sidebar';
import { cn } from '../../utils/cn';

export default function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const visible = useVisibleSections();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative h-full w-72 overflow-y-auto bg-white p-4 dark:bg-slate-950">
        <button className="btn-ghost mb-4 !px-2.5 !py-2" onClick={onClose} aria-label="Close navigation"><X className="h-5 w-5" /></button>
        {visible.map((s) => (
          <nav key={s.title} className="mb-4 space-y-1">
            <p className="px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{s.title}</p>
            {s.items.map((i) => (
              <NavLink key={i.to} to={i.to} end={i.end} onClick={onClose}
                className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}>
                <i.icon className="h-4 w-4" />{i.label}
              </NavLink>
            ))}
          </nav>
        ))}
      </div>
    </div>
  );
}
