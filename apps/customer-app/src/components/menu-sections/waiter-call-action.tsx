'use client';

import { t } from '@/lib/i18n';
import type { Language } from '@/types/menu';
import type { ThemeConfig } from './MenuThemes';

export function WaiterCallButton({
  onClick,
  callingWaiter,
  theme,
  language,
}: {
  onClick: () => void;
  callingWaiter: boolean;
  theme: ThemeConfig;
  language: Language;
}) {
  const copy = t(language);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={callingWaiter}
      className={`rounded-full px-4 py-2 text-sm font-bold ${theme.accent} ${theme.accentText} disabled:opacity-60`}
    >
      {callingWaiter ? copy.connecting : copy.callWaiter}
    </button>
  );
}

export function WaiterComingBanner({
  message,
  theme,
}: {
  message: string;
  theme: ThemeConfig;
}) {
  return (
    <div
      className={`rounded-full border px-5 py-3 text-sm font-bold ${theme.panel} ${theme.border} ${theme.shadow} bg-amber-500/10`}
    >
      {message}
    </div>
  );
}
