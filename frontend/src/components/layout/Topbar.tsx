import { Link } from 'react-router-dom';
import { Bell, Menu, Moon, Sun, LogOut } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../stores/auth';
import { notificationsApi } from '../../api/notifications';
import { Badge } from '../ui/Badge';

export default function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, logout, theme, setTheme } = useAuth();
  const { data } = useQuery({ queryKey: ['notif-count'], queryFn: async () => {
    try { return await notificationsApi.list(); } catch { return null; }
  }});
  const items: any[] = Array.isArray(data) ? data : (data as any)?.items || [];
  const unread = items.filter((n) => !(n.is_read ?? n.read)).length;
  const role = (user?.roles || [])[0] || 'customer';
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
      <button className="btn-ghost !px-2.5 !py-2 lg:hidden" onClick={onMenu} aria-label="Open navigation"><Menu className="h-5 w-5" /></button>
      <div className="font-bold lg:hidden">Nexus Bank</div>
      <div className="ml-auto flex items-center gap-2">
        <Badge value={role} />
        <button className="btn-ghost !px-2.5 !py-2" aria-label="Toggle theme"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <Link to="/notifications" className="btn-ghost relative !px-2.5 !py-2" aria-label="Notifications">
          <Bell className="h-4 w-4" />
          {unread > 0 && <span className="absolute -right-1 -top-1 min-w-[20px] rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-5 text-white">{unread}</span>}
        </Link>
        <span className="hidden max-w-[200px] truncate text-sm font-medium text-slate-600 dark:text-slate-300 sm:block">{user?.full_name || user?.email}</span>
        <button className="btn-ghost !px-2.5 !py-2" onClick={() => logout()} aria-label="Logout"><LogOut className="h-4 w-4" /></button>
      </div>
    </header>
  );
}
