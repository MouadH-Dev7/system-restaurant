'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff, LogIn, NotebookPen } from 'lucide-react';
import { login } from '@/auth/service';
import { useAuthStore } from '@/auth/store';
import { getApiErrorMessage } from '@/lib/api-error';
import { setupHttpInterceptors } from '@/lib/http';
import { WaiterProvider } from '@/components/waiter/waiter-provider';
import { useWaiterStore } from '@/store/waiter.store';

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  const status = useAuthStore((state) => state.status);
  const session = useAuthStore((state) => state.session);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const resetWaiter = useWaiterStore((state) => state.reset);
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
      resetWaiter();
    }
  }, [resetWaiter, status]);

  const role = session?.user.role;
  const hasAccess = role === 'ADMIN' || role === 'WAITER';

  useEffect(() => {
    if (status === 'authenticated' && session && !hasAccess) {
      clearSession();
      setError('Please sign in with an ADMIN or WAITER account.');
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
      <div className="flex min-h-screen items-center justify-center bg-[#fff8f2] text-slate-900">
        <div className="rounded-[28px] border border-[#efd9c8] bg-white px-8 py-6 text-center shadow-[0_18px_60px_rgba(98,48,22,0.12)]">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#b55229]">
            Waiter Access
          </p>
          <p className="mt-3 text-lg font-semibold">Loading secure session...</p>
        </div>
      </div>
    );
  }

  if (status !== 'authenticated' || !hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fff8f2] px-6 text-slate-900">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-[28px] border border-[#efd9c8] bg-white p-8 shadow-[0_18px_60px_rgba(98,48,22,0.12)]"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#fff0e8] p-3 text-[#b55229]">
              <NotebookPen size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#b55229]">
                Internal Waiter
              </p>
              <h1 className="mt-1 text-2xl font-bold">Sign in to floor service</h1>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-600">Staff Code</span>
              <input
                value={staffCode}
                onChange={(event) => setStaffCode(event.target.value)}
                className="w-full rounded-2xl border border-[#ead7c8] bg-[#fffdfa] px-4 py-3 outline-none focus:border-[#cf835f]"
                type="text"
                autoComplete="username"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-600">Password</span>
              <div className="relative">
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-[#ead7c8] bg-[#fffdfa] px-4 py-3 pr-12 outline-none focus:border-[#cf835f]"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#8d2d0e] font-semibold text-white transition hover:opacity-95 disabled:opacity-60"
          >
            <LogIn size={18} />
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    );
  }
  return <WaiterProvider>{children}</WaiterProvider>;
}
