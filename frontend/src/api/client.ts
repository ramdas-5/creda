const BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000/api/v1';

export class ApiError extends Error {
  code: string; status: number; detail: unknown;
  constructor(code: string, message: string, status = 0, detail: unknown = null) {
    super(message); this.code = code; this.status = status; this.detail = detail;
  }
}

function getTokens() {
  return { access: localStorage.getItem('access_token'), refresh: localStorage.getItem('refresh_token') };
}

async function raw(path: string, init: RequestInit = {}): Promise<Response> {
  const { access } = getTokens();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...((init.headers as Record<string,string>) || {}) };
  if (access) headers['Authorization'] = `Bearer ${access}`;
  return fetch(`${BASE}${path}`, { ...init, headers });
}

function toApiError(status: number, body: any, fallback: string): ApiError {
  const err = body?.error || body?.detail;
  if (err && typeof err === 'object' && 'code' in err) return new ApiError(String(err.code), String((err as any).message || fallback), status, body);
  if (typeof err === 'string') return new ApiError('REQUEST_FAILED', err, status, body);
  return new ApiError('REQUEST_FAILED', body?.message || fallback, status, body);
}

let refreshing: Promise<boolean> | null = null;
async function tryRefresh(): Promise<boolean> {
  if (!refreshing) {
    refreshing = (async () => {
      const { refresh } = getTokens();
      if (!refresh) return false;
      try {
        const res = await fetch(`${BASE}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: refresh }) });
        if (!res.ok) return false;
        const data = await res.json();
        const at = data?.access_token || data?.data?.access_token;
        const rt = data?.refresh_token || data?.data?.refresh_token;
        if (at) localStorage.setItem('access_token', at);
        if (rt) localStorage.setItem('refresh_token', rt);
        return !!at;
      } catch { return false; } finally { refreshing = null; }
    })();
  }
  return refreshing;
}

export function isOffline(e: unknown) {
  return e instanceof TypeError && String((e as Error).message || '').toLowerCase().includes('fetch');
}

export async function apiFetch<T>(path: string, init: RequestInit = {}, retried = false): Promise<T> {
  let res: Response;
  try { res = await raw(path, init); }
  catch (e) { throw new ApiError('NETWORK_OFFLINE', 'Backend is unreachable. Showing empty state — no demo data is fabricated.', 0, null); }
  if (res.status === 401 && !retried && getTokens().refresh) {
    const ok = await tryRefresh();
    if (ok) return apiFetch<T>(path, init, true);
  }
  const text = await res.text();
  const body = text ? safeJson(text) : null;
  if (!res.ok) throw toApiError(res.status, body, `Request failed (${res.status})`);
  const data = (body as any)?.data !== undefined ? (body as any).data : (body ?? ({} as T));
  return data as T;
}

function safeJson(t: string) { try { return JSON.parse(t); } catch { return { message: t }; } }

export const api = {
  get: <T>(p: string) => apiFetch<T>(p),
  post: <T>(p: string, b?: unknown) => apiFetch<T>(p, { method: 'POST', body: b === undefined ? undefined : JSON.stringify(b) }),
  patch: <T>(p: string, b?: unknown) => apiFetch<T>(p, { method: 'PATCH', body: b === undefined ? undefined : JSON.stringify(b) }),
  put: <T>(p: string, b?: unknown) => apiFetch<T>(p, { method: 'PUT', body: b === undefined ? undefined : JSON.stringify(b) }),
  del: <T>(p: string) => apiFetch<T>(p, { method: 'DELETE' }),
};
