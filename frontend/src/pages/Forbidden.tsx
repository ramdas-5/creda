import { Link } from 'react-router-dom';
export default function Forbidden() {
  return <div className="card p-10 text-center"><h1 className="text-xl font-bold">403 — Forbidden</h1><p className="mt-2 text-sm text-slate-500">Your role cannot access this page.</p><Link to="/dashboard" className="btn-ghost mt-4 inline-flex">Go to dashboard</Link></div>;
}
