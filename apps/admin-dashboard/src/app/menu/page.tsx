'use client';

import Link from 'next/link';
import { Plus, Settings2 } from 'lucide-react';
import { AdminShell } from '@/components/admin/admin-shell';
import { useI18n } from '@/hooks/use-i18n';

function EntryCard({
  href,
  title,
  description,
  links,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  links: Array<{ href: string; label: string }>;
  icon: React.ReactNode;
}) {
  return (
    <section className="panel rounded-[28px] border border-white/70 bg-white/80 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff0e8] text-[#ac2d00]">
            {icon}
          </div>
          <h3 className="mt-4 text-xl font-bold text-slate-900">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="mt-4">
        <Link
          href={href}
          className="inline-flex items-center gap-2 rounded-full bg-[#ac2d00] px-4 py-2 text-sm font-bold text-white"
        >
          {title}
        </Link>
      </div>
    </section>
  );
}

export default function MenuPage() {
  const { t } = useI18n();

  return (
    <AdminShell activeScreen="menu">
      <div className="space-y-6">
        <section className="page-header">
          <div>
            <h2>{t('menu.title')}</h2>
            <p>{t('menu.workspaceSubtitle')}</p>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <EntryCard
            href="/menu/add/menu"
            title={t('menu.modeAdd')}
            description={t('menu.addSectionSubtitle')}
            icon={<Plus size={20} />}
            links={[
              { href: '/menu/add/menu', label: t('menu.addMenu') },
              { href: '/menu/add/item', label: t('menu.addItemShortcut') },
              { href: '/menu/add/addon', label: t('menu.addModifierShortcut') },
            ]}
          />
          <EntryCard
            href="/menu/manage/menu"
            title={t('menu.modeEdit')}
            description={t('menu.manageSectionSubtitle')}
            icon={<Settings2 size={20} />}
            links={[
              { href: '/menu/manage/menu', label: t('menu.editMenu') },
              { href: '/menu/manage/item', label: t('menu.editItemShortcut') },
              { href: '/menu/manage/addon', label: t('menu.editModifierShortcut') },
            ]}
          />
        </section>
      </div>
    </AdminShell>
  );
}
