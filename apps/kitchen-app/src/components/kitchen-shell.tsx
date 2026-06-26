'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { logout } from '@/auth/service';
import { useAuthStore } from '@/auth/store';
import { kitchenDir, kitchenT, replaceTemplate } from '@/lib/i18n';
import { useAppStore } from '@/store/app.store';

type KitchenShellProps = {
  children: ReactNode;
  mounted: boolean;
  now: Date | null;
  status: 'connected' | 'connecting' | 'disconnected';
  lastSyncAt: Date | null;
  kitchenPrintingEnabled?: boolean;
  printingBusy?: boolean;
  onToggleKitchenPrinting?: () => void;
};

function formatClock(date: Date) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function KitchenShell({
  children,
  mounted,
  now,
  status,
  lastSyncAt,
  kitchenPrintingEnabled = true,
  printingBusy = false,
  onToggleKitchenPrinting,
}: KitchenShellProps) {
  const session = useAuthStore((state) => state.session);
  const pathname = usePathname();
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const t = kitchenT(language);
  const dir = kitchenDir(language);

  const connectionLabel =
    status === 'connected' ? t.live : status === 'connecting' ? t.connecting : t.offline;
  const syncLabel = lastSyncAt
    ? replaceTemplate(t.syncAgo, {
        seconds: Math.max(0, Math.floor((Date.now() - lastSyncAt.getTime()) / 1000)),
      })
    : t.syncIdle;

  const links = [
    { href: '/', icon: 'dashboard', label: t.dashboard },
    { href: '/availability', icon: 'restaurant_menu', label: t.availability },
  ];

  return (
    <div dir={dir} className="flex h-screen flex-col overflow-hidden">
      <header className="flex h-14 w-full items-center justify-between border-b border-outline-variant bg-surface-container-high px-4 shrink-0">
        <div className="flex items-center gap-6">
          <span className="text-2xl font-black uppercase tracking-tighter text-on-surface">
            KHALOU-FODIL <span className="text-primary-container">KITCHEN</span>
          </span>
          <div className="flex items-center gap-4 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-1.5">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-tertiary">sensors</span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                {syncLabel}
              </span>
            </div>
            <div className="h-3 w-px bg-outline-variant" />
            <div className="flex items-center gap-2">
              <span
                className={`material-symbols-outlined text-[16px] ${
                  status === 'connected'
                    ? 'text-tertiary'
                    : status === 'connecting'
                      ? 'text-primary'
                      : 'text-error'
                }`}
              >
                wifi
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                {connectionLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-1 text-sm font-semibold text-on-surface md:block">
            {session?.user.name ?? t.stationLabel}
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-1 text-sm font-semibold text-on-surface">
            <span>{t.language}</span>
            <select
              className="bg-transparent text-sm outline-none"
              value={language}
              onChange={(event) => setLanguage(event.target.value as typeof language)}
            >
              <option value="en">{t.english}</option>
              <option value="fr">{t.french}</option>
              <option value="ar">{t.arabic}</option>
            </select>
          </label>

          <button
            type="button"
            onClick={onToggleKitchenPrinting}
            disabled={!onToggleKitchenPrinting || printingBusy}
            className={`rounded-lg border px-3 py-1 text-sm font-semibold ${
              kitchenPrintingEnabled
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-700'
            } disabled:opacity-60`}
          >
            {printingBusy
              ? '...'
              : kitchenPrintingEnabled
                ? 'Kitchen Print ON'
                : 'Kitchen Print OFF'}
          </button>

          <div className="flex items-center gap-3 rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-1">
            <span
              className="text-xl font-bold tracking-tight text-primary"
              style={{ fontFamily: 'var(--font-jetbrains)' }}
            >
              {mounted && now ? formatClock(now) : '--:--'}
            </span>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-3 py-1 text-sm font-semibold text-on-surface"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="group z-50 flex h-full w-16 shrink-0 flex-col gap-4 overflow-hidden border-r border-outline-variant bg-surface-container px-2 py-4 shadow-2xl transition-all duration-300 ease-in-out hover:w-64">
          <div className="px-2">
            <div className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-1.5 transition-all group-hover:p-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-container/20">
                <span className="material-symbols-outlined text-sm text-primary-container">
                  skillet
                </span>
              </div>
              <div className="hidden overflow-hidden whitespace-nowrap group-hover:block">
                <p className="text-[10px] font-black uppercase text-primary">{t.brandStation}</p>
                <p className="text-[10px] text-on-surface-variant">{t.stationLabel}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-2">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-4 rounded-lg px-3 py-2.5 font-bold ${
                    active
                      ? 'bg-primary-container text-on-primary-container'
                      : 'text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined">{link.icon}</span>
                  <span className="hidden text-xs group-hover:block">{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-x-auto bg-background p-4">{children}</main>
      </div>
    </div>
  );
}
