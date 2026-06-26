'use client';

import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import type { Menu } from '@/types/menu';
import type { OrderContextDTO } from '@/types/order';
import { localize, t } from '@/lib/i18n';
import { routes } from '@/lib/routes';
import { useLanguageStore } from '@/store/language.store';

type MenuCatalogCardProps = {
  menu: Menu;
  context: OrderContextDTO;
};

export function MenuCatalogCard({ menu, context }: MenuCatalogCardProps) {
  const language = useLanguageStore((state) => state.language);
  const copy = t(language);

  return (
    <Link
      href={routes.menuItems(menu.id, context)}
      className="group relative flex min-h-[220px] flex-col overflow-hidden rounded-lg border border-[#e4beb4]/40 bg-white shadow-sm transition hover:shadow-md"
    >
      <div className="aspect-[16/9] overflow-hidden bg-[#eeeeee]">
        {menu.image ? (
          <img
            src={menu.image}
            alt={localize(menu.name)}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#ff5722]/10 to-[#5b4039]/10 px-6 text-center text-2xl font-black text-[#5b4039]">
            {localize(menu.name)}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h2 className="mb-2 text-2xl font-black text-[#1a1c1c]">{localize(menu.name)}</h2>
        {menu.description ? (
          <p className="line-clamp-2 flex-1 text-sm leading-6 text-[#5b4039]">
            {localize(menu.description)}
          </p>
        ) : null}
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#ff5722]">
          {copy.viewMenu}
          <ChevronLeft className="h-4 w-4 rotate-180 rtl:rotate-0" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
