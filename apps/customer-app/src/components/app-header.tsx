'use client';

import Link from 'next/link';
import { UserCircle } from 'lucide-react';
import { routes } from '@/lib/routes';
import { t } from '@/lib/i18n';
import { useAppStore } from '@/store/app.store';
import { useLanguageStore } from '@/store/language.store';

export function AppHeader() {
  const language = useLanguageStore((state) => state.language);
  const context = useAppStore((state) => state.context);
  const copy = t(language);

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-[#e4beb4] bg-white px-5">
      <Link href={routes.menus(context)} className="text-2xl font-black text-[#ff5722]">
        {copy.brand}
      </Link>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-[#eeeeee] px-4 py-1.5 text-sm font-semibold text-[#5b4039]">
          {copy.table}
        </span>
        <UserCircle className="h-7 w-7 text-[#ff5722]" aria-hidden="true" />
      </div>
    </header>
  );
}
