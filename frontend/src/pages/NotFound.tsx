import { Link } from 'react-router-dom';
export default function NotFound() {
  return <div className="flex min-h-full items-center justify-center p-8"><div className="card p-10 text-center"><h1 className="text-xl font-bold">404 — Not found</h1><Link to="/dashboard" className="btn-ghost mt-4 inline-flex">Go home</Link></div></div>;
}
