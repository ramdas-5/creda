import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNav from './MobileNav';

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex h-full bg-slate-100 dark:bg-slate-950">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setOpen(true)} />
        <MobileNav open={open} onClose={() => setOpen(false)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl animate-[fadeIn_.2s_ease]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
