'use client';

import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import { login } from '@/auth/service';
import { useAuthStore } from '@/auth/store';
import { getApiErrorMessage } from '@/lib/api-error';
import { setupHttpInterceptors } from '@/lib/http';
import { useAppStore } from '@/store/app.store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

export function AppProviders({ children }: Readonly<{ children: React.ReactNode }>) {
  const status = useAuthStore((state) => state.status);
  const session = useAuthStore((state) => state.session);
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.clearSession);
  const language = useAppStore((state) => state.language);
  const direction = useAppStore((state) => state.direction);
  const setRestaurantId = useAppStore((state) => state.setRestaurantId);
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
    document.documentElement.dir = direction;
  }, [language, direction]);

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
    setRestaurantId(session?.user.restaurantId);
  }, [session?.user.restaurantId, setRestaurantId]);

  const hasAccess = session?.user.role === 'ADMIN';

  useEffect(() => {
    if (status === 'authenticated' && session && !hasAccess) {
      clearSession();
      setError('Please sign in with an ADMIN account.');
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
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="rounded-3xl border border-white/10 bg-white/5 px-8 py-6 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-300">
            Admin Access
          </p>
          <p className="mt-3 text-lg font-semibold">Loading secure session...</p>
        </div>
      </div>
    );
  }

  if (status !== 'authenticated' || !hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),transparent_30%),linear-gradient(180deg,#020617,#0f172a)] px-6 text-white">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-md rounded-[28px] border border-white/10 bg-slate-900/80 p-8 shadow-2xl backdrop-blur"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-500/15 p-3 text-sky-300">
              <ShieldCheck size={24} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-300">
                Internal Admin
              </p>
              <h1 className="mt-1 text-2xl font-bold">Sign in to dashboard</h1>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Staff Code</span>
              <input
                value={staffCode}
                onChange={(event) => setStaffCode(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none focus:border-sky-400"
                type="text"
                autoComplete="username"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm text-slate-300">Password</span>
              <div className="relative">
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 pr-12 outline-none focus:border-sky-400"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 font-semibold text-slate-950 transition hover:bg-sky-400 disabled:opacity-60"
          >
            <LogIn size={18} />
            {submitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    );
  }
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
