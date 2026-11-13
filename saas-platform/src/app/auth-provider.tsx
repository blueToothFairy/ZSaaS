'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

export interface AuthUser { id: string; email: string; name: string | null; }
interface AuthResult { success: boolean; accessToken: string; user: AuthUser; message?: string; code?: string; }
interface AuthContextValue {
  user: AuthUser | null; isLoaded: boolean; getToken: () => Promise<string | null>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>; addPassword: (password: string) => Promise<void>; linkGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
let cachedToken: string | null = null;
let cachedUser: AuthUser | null = null;
let authReady = false;
let startupPromise: Promise<AuthResult | null> | null = null;

const readJsonResponse = async <T,>(response: Response): Promise<T | null> => {
  const body = await response.text();
  if (!body.trim()) return null;
  try { return JSON.parse(body) as T; } catch { return null; }
};

const ensureStartup = (): Promise<AuthResult | null> => {
  if (!startupPromise) {
    startupPromise = fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin' })
      .then(async (response) => {
        if (!response.ok) return null;
        const result = await response.json() as AuthResult;
        cachedToken = result.accessToken; cachedUser = result.user;
        return result;
      }).catch(() => null).finally(() => { authReady = true; });
  }
  return startupPromise;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(cachedUser);
  const [isLoaded, setIsLoaded] = useState(authReady);
  const syncSession = useCallback((result: AuthResult | null) => {
    cachedToken = result?.accessToken || null; cachedUser = result?.user || null;
    authReady = true; setUser(cachedUser); setIsLoaded(true);
  }, []);
  useEffect(() => {
    let active = true;
    void ensureStartup().then((result) => { if (active) syncSession(result); });
    return () => { active = false; };
  }, [syncSession]);

  const getToken = useCallback(async () => {
    if (!authReady) { const restored = await ensureStartup(); if (restored) syncSession(restored); }
    return cachedToken;
  }, [syncSession]);
  const submit = async (path: string, body: Record<string, string>) => {
    const response = await fetch(`/api/auth/${path}`, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const result = await readJsonResponse<AuthResult>(response);
    if (!response.ok) throw new Error(result?.message || `Authentication failed (HTTP ${response.status}).`);
    if (!result?.accessToken || !result.user) throw new Error('The server returned an incomplete sign-in response. Please try again.');
    startupPromise = Promise.resolve(result); syncSession(result);
  };
  const login = (email: string, password: string) => submit('login', { email, password });
  const register = (email: string, password: string, name?: string) => submit('register', { email, password, ...(name ? { name } : {}) });
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined);
    cachedToken = null; cachedUser = null; authReady = true; startupPromise = Promise.resolve(null); setUser(null); setIsLoaded(true);
  };
  const addPassword = async (password: string) => {
    const token = await getToken();
    const response = await fetch('/api/auth/password/link', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ password }) });
    if (!response.ok) { const result = await response.json() as { message?: string }; throw new Error(result.message || 'Could not add password.'); }
  };
  const linkGoogle = async () => {
    const token = await getToken();
    const response = await fetch('/api/auth/google/link/start', { method: 'POST', credentials: 'same-origin', headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json() as { url?: string; message?: string };
    if (!response.ok || !result.url) throw new Error(result.message || 'Could not start Google linking.');
    window.location.assign(result.url);
  };
  return <AuthContext.Provider value={{ user, isLoaded, getToken, login, register, logout, addPassword, linkGoogle }}>{children}</AuthContext.Provider>;
}

export function useAppAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAppAuth must be used within AuthProvider');
  return context;
}
