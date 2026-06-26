'use client';

import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Language } from '@/types/menu';
import type { OrderContextDTO } from '@/types/order';
import { getOrCreateGuestSessionId } from '@/lib/guest-session';
import { routes } from '@/lib/routes';
import { t } from '@/lib/i18n';
import { useAppStore } from '@/store/app.store';
import { useLanguageStore } from '@/store/language.store';

const languages: Array<{ value: Language; label: string; native: string; mark: string }> = [
  { value: 'ar', label: 'Arabic', native: 'العربية', mark: 'ع' },
  { value: 'en', label: 'English', native: 'English', mark: 'EN' },
  { value: 'fr', label: 'French', native: 'Francais', mark: 'FR' },
];

type LanguageSelectorProps = {
  initialContext: OrderContextDTO | null;
};

export function LanguageSelector({ initialContext }: LanguageSelectorProps) {
  const router = useRouter();
  const storedContext = useAppStore((state) => state.context);
  const setOrderContext = useAppStore((state) => state.setOrderContext);
  const language = useLanguageStore((state) => state.language);
  const setLanguage = useLanguageStore((state) => state.setLanguage);
  const copy = t(language);
  const context = initialContext ?? storedContext;

  return (
    <main className="flex min-h-screen flex-col bg-white">
      <header className="flex h-20 items-center justify-between px-5 pt-5">
        <span className="text-2xl font-black text-[#ff5722]">{copy.brand}</span>
        <span className="rounded-full bg-[#eeeeee] px-4 py-2 text-sm font-semibold text-[#5b4039]">
          {copy.table}
        </span>
      </header>

      <section className="flex flex-1 flex-col items-center justify-center px-5 py-8">
        <div className="mb-12 text-center">
          <h1 className="mb-2 text-4xl font-black text-[#121212] md:text-5xl">
            {copy.chooseLanguage}
          </h1>
          <p className="text-lg text-[#6f6f6f]">{copy.chooseLanguageHint}</p>
        </div>

        <div className="grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
          {languages.map((item) => {
            const active = item.value === language;
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => setLanguage(item.value)}
                className="group flex flex-col items-center gap-5 transition active:scale-95"
              >
                <span
                  className={`flex h-32 w-32 items-center justify-center rounded-full border-4 bg-[#eeeeee] text-4xl font-black shadow-lg transition md:h-48 md:w-48 md:text-6xl ${
                    active ? 'border-[#ff5722]' : 'border-transparent group-hover:border-[#ff5722]'
                  }`}
                >
                  {item.mark}
                </span>
                <span className="text-center">
                  <span
                    className={`block text-2xl font-bold ${active ? 'text-[#ff5722]' : 'text-[#121212]'}`}
                  >
                    {item.label}
                  </span>
                  <span className="text-lg text-[#6f6f6f]">{item.native}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <footer className="px-5 pb-8">
        <button
          type="button"
          disabled={!context}
          onClick={() => {
            if (!context) {
              return;
            }
            setOrderContext(context);
            getOrCreateGuestSessionId(context);
            router.push(routes.menus(context));
          }}
          className="mx-auto flex h-16 w-full max-w-md items-center justify-center gap-3 rounded-lg bg-[#ff5722] text-xl font-bold text-white shadow-lg transition hover:brightness-110 active:scale-[0.98]"
        >
          {copy.continue}
          <ArrowRight className="h-6 w-6 rtl:rotate-180" aria-hidden="true" />
        </button>
        <p className="mt-5 text-center text-sm text-[#9e9e9e]">{copy.changeLater}</p>
      </footer>
    </main>
  );
}
