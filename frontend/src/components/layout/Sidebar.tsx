import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, ArrowLeftRight, ReceiptText, Users, CreditCard,
  Landmark, PiggyBank, FileText, Bell, User, ShieldCheck, LifeBuoy,
  Settings, Building2, BarChart3, ScrollText, ShieldAlert, Banknote,
  ArrowDownToLine, ArrowUpFromLine, ClipboardList, Inbox,
} from 'lucide-react';
import { useAuth } from '../../stores/auth';
import { cn } from '../../utils/cn';

interface Item { to: string; label: string; icon: any; roles?: string[]; end?: boolean }
const sections: { title: string; items: Item[] }[] = [
  { title: 'Overview', items: [{ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true }] },
  { title: 'Banking', items: [
    { to: '/accounts', label: 'Accounts', icon: Wallet },
    { to: '/deposit', label: 'Deposit', icon: ArrowDownToLine },
    { to: '/withdraw', label: 'Withdraw', icon: ArrowUpFromLine },
    { to: '/transfers', label: 'Transfers', icon: ArrowLeftRight },
    { to: '/transactions', label: 'Transactions', icon: ReceiptText },
    { to: '/beneficiaries', label: 'Beneficiaries', icon: Users },
  ]},
  { title: 'Borrow & Save', items: [
    { to: '/loans', label: 'Loans', icon: Landmark },
    { to: '/fixed-deposits', label: 'Fixed Deposits', icon: PiggyBank },
    { to: '/cards', label: 'Cards', icon: CreditCard },
    { to: '/requests', label: 'My Requests', icon: ClipboardList },
  ]},
  { title: 'Account', items: [
    { to: '/support', label: 'Support', icon: LifeBuoy },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/security', label: 'Security', icon: ShieldCheck },
  ]},
  { title: 'Staff Operations', items: [
    { to: '/admin', label: 'Operations Console', icon: BarChart3, roles: ['admin', 'manager', 'employee'], end: true },
    { to: '/admin/requests', label: 'Request Center', icon: Inbox, roles: ['admin', 'manager', 'employee'] },
    { to: '/admin/deposit-requests', label: 'Deposit Requests', icon: ArrowDownToLine, roles: ['admin', 'manager', 'employee'] },
    { to: '/admin/loan-requests', label: 'Loan Requests', icon: Landmark, roles: ['admin', 'manager', 'employee'] },
    { to: '/admin/card-requests', label: 'Card Requests', icon: CreditCard, roles: ['admin', 'manager', 'employee'] },
    { to: '/admin/teller', label: 'Branch Counter', icon: Banknote, roles: ['admin', 'manager', 'employee'] },
    { to: '/admin/customers', label: 'Customers & KYC', icon: Users, roles: ['admin', 'manager', 'employee'] },
    { to: '/admin/accounts', label: 'Accounts', icon: Wallet, roles: ['admin', 'manager', 'employee'] },
    { to: '/admin/transactions', label: 'Transactions', icon: ReceiptText, roles: ['admin', 'manager', 'employee'] },
    { to: '/admin/reports', label: 'Reports', icon: FileText, roles: ['admin', 'manager', 'employee'] },
  ]},
  { title: 'Administration', items: [
    { to: '/admin/users', label: 'Users & Access', icon: ShieldAlert, roles: ['admin'] },
    { to: '/admin/branches', label: 'Branches', icon: Building2, roles: ['admin'] },
    { to: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText, roles: ['admin'] },
    { to: '/admin/settings', label: 'Settings', icon: Settings, roles: ['admin'] },
  ]},
];

export function useVisibleSections() {
  const { user } = useAuth();
  const roles = user?.roles || ['customer'];
  return sections.map((s) => ({
    ...s,
    items: s.items.filter((i) => !i.roles || i.roles.some((r) => roles.includes(r))),
  })).filter((s) => s.items.length > 0);
}

export default function Sidebar() {
  const visible = useVisibleSections();
  return (
    <aside className="hidden w-[260px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-slate-200/80 bg-white/80 p-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/60 lg:flex">
      <div className="flex items-center gap-2.5 px-2 pt-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-indigo-600 text-lg font-black text-white shadow">N</div>
        <div>
          <p className="text-sm font-bold leading-tight">Nexus Bank</p>
          <p className="text-[11px] text-slate-500">Personal banking</p>
        </div>
      </div>
      {visible.map((s) => (
        <nav key={s.title} className="space-y-1">
          <p className="px-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{s.title}</p>
          {s.items.map((i) => (
            <NavLink key={i.to} to={i.to} end={i.end}
              className={({ isActive }) => cn('nav-link', isActive && 'nav-link-active')}>
              <i.icon className="h-[18px] w-[18px] shrink-0" />{i.label}
            </NavLink>
          ))}
        </nav>
      ))}
    </aside>
  );
}
