'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

export interface AuthUser { id: string; email: string; name: string | null; authMethods?: { password: boolean; google: boolean }; }
interface AuthResult { success: boolean; accessToken: string; user: AuthUser; isNewUser?: boolean; message?: string; code?: string; }
interface AuthContextValue {
  user: AuthUser | null; isLoaded: boolean; getToken: () => Promise<string | null>;
  requestWithAuth: <T>(request: (token: string) => Promise<T>) => Promise<T>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<boolean>;
  logout: () => Promise<void>; addPassword: (password: string) => Promise<void>; linkGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
let cachedToken: string | null = null;
let cachedUser: AuthUser | null = null;
let authReady = false;
let startupPromise: Promise<AuthResult | null> | null = null;
let refreshPromise: Promise<AuthResult | null> | null = null;

const readJsonResponse = async <T,>(response: Response): Promise<T | null> => {
  const body = await response.text();
  if (!body.trim()) return null;
  try { return JSON.parse(body) as T; } catch { return null; }
};

const refreshSession = (): Promise<AuthResult | null> => {
  if (!refreshPromise) {
    refreshPromise = fetch('/api/auth/refresh', { method: 'POST', credentials: 'same-origin' })
      .then(async (response) => {
        if (!response.ok) return null;
        const result = await response.json() as AuthResult;
        if (!result?.accessToken || !result.user) return null;
        cachedToken = result.accessToken;
        cachedUser = result.user;
        return result;
      }).catch(() => null).finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};

const ensureStartup = (): Promise<AuthResult | null> => {
  if (!startupPromise) {
    startupPromise = refreshSession().finally(() => { authReady = true; });
  }
  return startupPromise;
};

const isUnauthorized = (value: unknown): boolean => {
  if (typeof value !== 'object' || value === null) return false;
  if ('status' in value && value.status === 401) return true;
  if ('response' in value && typeof value.response === 'object' && value.response !== null && 'status' in value.response) {
    return value.response.status === 401;
  }
  return false;
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
  const requestWithAuth = useCallback(async <T,>(request: (token: string) => Promise<T>): Promise<T> => {
    const token = await getToken();
    if (!token) throw new Error('Your session has expired. Please sign in again.');
    try {
      const result = await request(token);
      if (!isUnauthorized(result)) return result;
    } catch (error) {
      if (!isUnauthorized(error)) throw error;
    }

    const refreshed = await refreshSession();
    if (!refreshed) {
      syncSession(null);
      startupPromise = Promise.resolve(null);
      throw new Error('Your session has expired. Please sign in again.');
    }
    startupPromise = Promise.resolve(refreshed);
    syncSession(refreshed);
    return request(refreshed.accessToken);
  }, [getToken, syncSession]);
  const submit = async (path: string, body: Record<string, string>) => {
    const response = await fetch(`/api/auth/${path}`, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const result = await readJsonResponse<AuthResult>(response);
    if (!response.ok) throw new Error(result?.message || `Authentication failed (HTTP ${response.status}).`);
    if (!result?.accessToken || !result.user) throw new Error('The server returned an incomplete sign-in response. Please try again.');
    startupPromise = Promise.resolve(result); syncSession(result);
    return result;
  };
  const login = async (email: string, password: string) => { await submit('login', { email, password }); };
  const register = async (email: string, password: string, name?: string) => {
    const result = await submit('register', { email, password, ...(name ? { name } : {}) });
    return result?.isNewUser === true;
  };
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }).catch(() => undefined);
    cachedToken = null; cachedUser = null; authReady = true; startupPromise = Promise.resolve(null); setUser(null); setIsLoaded(true);
  };
  const addPassword = async (password: string) => {
    const response = await requestWithAuth((token) => fetch('/api/auth/password/link', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ password }) }));
    if (!response.ok) { const result = await response.json() as { message?: string }; throw new Error(result.message || 'Could not add password.'); }
    const result = await refreshSession();
    if (result) {
      startupPromise = Promise.resolve(result);
      syncSession(result);
    }
  };
  const linkGoogle = async () => {
    const response = await requestWithAuth((token) => fetch('/api/auth/google/link/start', { method: 'POST', credentials: 'same-origin', headers: { Authorization: `Bearer ${token}` } }));
    const result = await response.json() as { url?: string; message?: string };
    if (!response.ok || !result.url) throw new Error(result.message || 'Could not start Google linking.');
    window.location.assign(result.url);
  };
  return <AuthContext.Provider value={{ user, isLoaded, getToken, requestWithAuth, login, register, logout, addPassword, linkGoogle }}>{children}</AuthContext.Provider>;
}

export function useAppAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAppAuth must be used within AuthProvider');
  return context;
}
