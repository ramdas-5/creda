import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './stores/auth';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import AccountDetail from './pages/AccountDetail';
import Transactions from './pages/Transactions';
import TransactionDetail from './pages/TransactionDetail';
import Transfers from './pages/Transfers';
import TransferNew from './pages/TransferNew';
import Beneficiaries from './pages/Beneficiaries';
import Cards from './pages/Cards';
import Loans from './pages/Loans';
import LoanApply from './pages/LoanApply';
import LoanDetail from './pages/LoanDetail';
import LoanCalculator from './pages/LoanCalculator';
import FixedDeposits from './pages/FixedDeposits';
import Deposit from './pages/Deposit';
import Withdraw from './pages/Withdraw';
import Requests from './pages/Requests';
import Statements from './pages/Statements';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Security from './pages/Security';
import Support from './pages/Support';
import SupportDetail from './pages/SupportDetail';
import AdminDashboard from './pages/admin/AdminDashboard';
import RequestCenter from './pages/admin/RequestCenter';
import DepositRequests from './pages/admin/DepositRequests';
import LoanRequests from './pages/admin/LoanRequests';
import CardRequests from './pages/admin/CardRequests';
import AdminTeller from './pages/admin/Teller';
import AdminUsers from './pages/admin/Users';
import AdminCustomers from './pages/admin/Customers';
import AdminAccounts from './pages/admin/Accounts';
import AdminTransactions from './pages/admin/Transactions';
import AdminBranches from './pages/admin/Branches';
import AdminReports from './pages/admin/Reports';
import AdminAuditLogs from './pages/admin/AuditLogs';
import AdminSettings from './pages/admin/Settings';
import Forbidden from './pages/Forbidden';
import NotFound from './pages/NotFound';

function Protected({ children, roles }: { children: JSX.Element; roles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-8 text-sm text-slate-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.some((r) => user.roles?.includes(r))) return <Navigate to="/403" replace />;
  return children;
}

const ADMIN = ['admin'];
const STAFF = ['admin', 'manager', 'employee'];

export default function App() {
  const { theme } = useAuth();
  useEffect(() => {
    const root = document.documentElement;
    const resolved = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
    root.classList.toggle('dark', resolved === 'dark');
  }, [theme]);
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/403" element={<Forbidden />} />
      <Route element={<Protected><AppLayout /></Protected>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/accounts/:id" element={<AccountDetail />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/transactions/:id" element={<TransactionDetail />} />
        <Route path="/transfers" element={<Transfers />} />
        <Route path="/transfers/new" element={<TransferNew />} />
        <Route path="/beneficiaries" element={<Beneficiaries />} />
        <Route path="/deposit" element={<Deposit />} />
        <Route path="/withdraw" element={<Withdraw />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/cards" element={<Cards />} />
        <Route path="/loans" element={<Loans />} />
        <Route path="/loans/apply" element={<LoanApply />} />
        <Route path="/loans/calculator" element={<LoanCalculator />} />
        <Route path="/loans/:id" element={<LoanDetail />} />
        <Route path="/fixed-deposits" element={<FixedDeposits />} />
        <Route path="/statements" element={<Statements />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/security" element={<Security />} />
        <Route path="/support" element={<Support />} />
        <Route path="/support/:id" element={<SupportDetail />} />
        <Route path="/admin" element={<Protected roles={STAFF}><AdminDashboard /></Protected>} />
        <Route path="/admin/requests" element={<Protected roles={STAFF}><RequestCenter /></Protected>} />
        <Route path="/admin/deposit-requests" element={<Protected roles={STAFF}><DepositRequests /></Protected>} />
        <Route path="/admin/loan-requests" element={<Protected roles={STAFF}><LoanRequests /></Protected>} />
        <Route path="/admin/card-requests" element={<Protected roles={STAFF}><CardRequests /></Protected>} />
        <Route path="/admin/teller" element={<Protected roles={STAFF}><AdminTeller /></Protected>} />
        <Route path="/admin/users" element={<Protected roles={ADMIN}><AdminUsers /></Protected>} />
        <Route path="/admin/customers" element={<Protected roles={STAFF}><AdminCustomers /></Protected>} />
        <Route path="/admin/accounts" element={<Protected roles={STAFF}><AdminAccounts /></Protected>} />
        <Route path="/admin/transactions" element={<Protected roles={STAFF}><AdminTransactions /></Protected>} />
        <Route path="/admin/branches" element={<Protected roles={ADMIN}><AdminBranches /></Protected>} />
        <Route path="/admin/reports" element={<Protected roles={STAFF}><AdminReports /></Protected>} />
        <Route path="/admin/audit-logs" element={<Protected roles={ADMIN}><AdminAuditLogs /></Protected>} />
        <Route path="/admin/settings" element={<Protected roles={ADMIN}><AdminSettings /></Protected>} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
