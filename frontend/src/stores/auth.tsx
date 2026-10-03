import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { User } from '../types';

type Theme = 'light' | 'dark' | 'system';
interface Ctx {
  user: User | null; loading: boolean; theme: Theme;
  setTheme: (t: Theme) => void;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}
const C = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setThemeState] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');
  const setTheme = (t: Theme) => { setThemeState(t); localStorage.setItem('theme', t); };

  const refreshMe = async () => {
    if (!localStorage.getItem('access_token')) { setUser(null); setLoading(false); return; }
    try {
      const me = await api.get<User>('/auth/me');
      setUser(me as User);
    } catch { setUser(null); } finally { setLoading(false); }
  };
  useEffect(() => { refreshMe(); }, []);

  const login = async (identifier: string, password: string) => {
    const data = await api.post<any>('/auth/login', { identifier, password });
    const at = data?.access_token;
    const rt = data?.refresh_token;
    if (at) localStorage.setItem('access_token', at);
    if (rt) localStorage.setItem('refresh_token', rt);
    const u = (data?.user as User) || null;
    if (u) setUser(u); else await refreshMe();
  };
  const logout = async () => {
    try { await api.post('/auth/logout', {}); } catch { /* ignore */ }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };
  return <C.Provider value={{ user, loading, theme, setTheme, login, logout, refreshMe }}>{children}</C.Provider>;
}
export function useAuth(): Ctx {
  const v = useContext(C);
  if (!v) throw new Error('useAuth outside provider');
  return v;
}
