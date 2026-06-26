'use client';

import { useEffect, useState } from 'react';
import { ChefHat, Eye, EyeOff, LogIn } from 'lucide-react';
import { login } from '@/auth/service';
import { useAuthStore } from '@/auth/store';
import { getApiErrorMessage } from '@/lib/api-error';
import { setupHttpInterceptors } from '@/lib/http';
import { useKitchenStore } from '@/store/kitchen.store';
import { useAppStore } from '@/store/app.store';

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  const status = useAuthStore((state) => state.status);
  const session = useAuthStore((state) => state.session);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const resetKitchen = useKitchenStore((state) => state.reset);
  const language = useAppStore((state) => state.language);
  const [hydrated, setHydrated] = useState(false);
  const [staffCode, setStaffCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setupHttpInterceptors();
  }, []);

  useEffect(() => {
    const persistApi = useAuthStore.persist;
    setHydrated(persistApi.hasHydrated());
    const unsubscribeHydrate = persistApi.onHydrate(() => setHydrated(false));
    const unsubscribeFinish = persistApi.onFinishHydration(() => setHydrated(true));
    void persistApi.rehydrate();

    return () => {
      unsubscribeHydrate();
      unsubscribeFinish();
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    if (!hydrated || status !== 'loading') {
      return;
    }

    if (session) {
      setSession(session);
      return;
    }

    clearSession();
  }, [clearSession, hydrated, session, setSession, status]);

  useEffect(() => {
    if (status !== 'authenticated') {
      resetKitchen();
    }
  }, [resetKitchen, status]);

  const role = session?.user.role;
  const hasAccess = role === 'ADMIN' || role === 'CHEF';

  useEffect(() => {
    if (status === 'authenticated' && session && !hasAccess) {
      clearSession();
      setError('Please sign in with an ADMIN or CHEF account.');
    }
  }, [clearSession, hasAccess, session, status]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const nextSession = await login({ staffCode, password });
      setSession(nextSession);
    } catch (nextError) {
      clearSession();
      setError(getApiErrorMessage(nextError, 'Login failed'));
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated || status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-on-surface">
        <div className="rounded-3xl border border-outline-variant bg-surface-container-high px-8 py-6 text-center">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-primary-container">
            Kitchen Access
          </p>
          <p className="mt-3 text-lg font-bold">Loading secure session...</p>
        </div>
      </div>
    );
  }

  if (status !== 'authenticated' || !hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-on-surface">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-[28px] border border-outline-variant bg-surface-container-high p-8 shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary-container/15 p-3 text-primary-container">
              <ChefHat size={24} />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-primary-container">
                Internal Kitchen
              </p>
              <h1 className="mt-1 text-2xl font-bold">Sign in to kitchen display</h1>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm text-on-surface-variant">Staff Code</span>
              <input
                value={staffCode}
                onChange={(event) => setStaffCode(event.target.value)}
                className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 outline-none focus:border-primary-container"
                type="text"
                autoComplete="username"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-on-surface-variant">Password</span>
              <div className="relative">
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-outline-variant bg-surface px-4 py-3 pr-12 outline-none focus:border-primary-container"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant transition hover:text-on-surface"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary-container font-bold text-on-primary-container transition hover:brightness-110 disabled:opacity-60"
          >
            <LogIn size={18} />
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    );
  }
  return children;
}
