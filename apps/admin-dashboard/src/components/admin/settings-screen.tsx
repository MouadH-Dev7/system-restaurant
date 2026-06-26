'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, Save } from 'lucide-react';
import type { SettingsDTO } from '@repo/shared-types';
import { getApiErrorMessage } from '@/lib/api-error';
import { useI18n } from '@/hooks/use-i18n';
import { getSettings, saveSettings } from '@/services/settings.service';
import { useAppStore } from '@/store/app.store';

const defaultSettings: Omit<SettingsDTO, 'id' | 'createdAt' | 'updatedAt'> = {
  restaurantId: '',
  restaurantName: 'Restaurant',
  contactPhone: '',
  contactEmail: '',
  businessAddress: '',
  receiptLogoUrl: '',
  receiptFooterMessage: '',
  openingHours: '09:00',
  closingHours: '23:00',
  currency: 'DZD',
  salesTax: 0,
  defaultDiscountLabel: '',
  maxAutoDiscountPercent: 10,
  refundAlertThreshold: 0,
  language: 'en',
  direction: 'ltr',
  locale: 'ar-DZ',
  dateFormat: 'dd/MM/yyyy',
  acceptsCash: true,
  acceptsCard: true,
  acceptsQrOrdering: true,
  kitchenPrintingEnabled: true,
  stripeEnabled: false,
  whatsappEnabled: false,
  smtpEnabled: false,
};

export function SettingsScreen() {
  const { t, dir } = useI18n();
  const restaurantId = useAppStore((state) => state.restaurantId);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const setDirection = useAppStore((state) => state.setDirection);
  const setLocale = useAppStore((state) => state.setLocale);
  const setDateFormat = useAppStore((state) => state.setDateFormat);
  const setCurrency = useAppStore((state) => state.setCurrency);
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const activeRestaurantId = restaurantId;

    if (!activeRestaurantId) {
      setSettings(defaultSettings);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getSettings(activeRestaurantId);
      if (data) {
        const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = data;
        setSettings(rest);
        if (rest.language === 'en' || rest.language === 'fr' || rest.language === 'ar') {
          setLanguage(rest.language);
        }
        if (rest.direction === 'ltr' || rest.direction === 'rtl') {
          setDirection(rest.direction);
        }
        setLocale(rest.locale);
        setDateFormat(rest.dateFormat);
        setCurrency(rest.currency);
      } else {
        setSettings((current) => ({ ...current, restaurantId: activeRestaurantId, currency: 'DZD' }));
      }
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('settings.error.load')));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [restaurantId]);

  async function handleSave() {
    const activeRestaurantId = restaurantId;

    if (!activeRestaurantId) {
      setError(t('settings.title'));
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await saveSettings({ ...settings, restaurantId: activeRestaurantId });
      await load();
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('settings.error.save')));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="page-header">
        <div>
          <h2>{t('settings.title')}</h2>
          <p>{t('settings.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button type="button" className="ghost-btn" onClick={() => void load()}>
            <RefreshCw size={16} />
            <span>{t('settings.refresh')}</span>
          </button>
          <button
            type="button"
            className="primary-btn"
            disabled={saving || loading}
            onClick={() => void handleSave()}
          >
            <Save size={16} />
            <span>{saving ? t('common.saving') : t('settings.save')}</span>
          </button>
        </div>
      </section>

      {error ? (
        <div className="panel error-banner mt-4 flex items-center gap-2 text-xs font-bold">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      <section className="panel mt-6 grid gap-3 md:grid-cols-2" dir={dir}>
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          placeholder={t('settings.restaurantName')}
          value={settings.restaurantName}
          onChange={(e) => setSettings((s) => ({ ...s, restaurantName: e.target.value }))}
        />
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          placeholder={t('settings.contactPhone')}
          value={settings.contactPhone}
          onChange={(e) => setSettings((s) => ({ ...s, contactPhone: e.target.value }))}
        />
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          placeholder="Email"
          value={settings.contactEmail ?? ''}
          onChange={(e) => setSettings((s) => ({ ...s, contactEmail: e.target.value }))}
        />
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm md:col-span-2"
          placeholder={t('settings.address')}
          value={settings.businessAddress}
          onChange={(e) => setSettings((s) => ({ ...s, businessAddress: e.target.value }))}
        />
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm md:col-span-2"
          placeholder="Receipt logo URL"
          value={settings.receiptLogoUrl ?? ''}
          onChange={(e) => setSettings((s) => ({ ...s, receiptLogoUrl: e.target.value }))}
        />
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm md:col-span-2"
          placeholder="Receipt footer message"
          value={settings.receiptFooterMessage ?? ''}
          onChange={(e) => setSettings((s) => ({ ...s, receiptFooterMessage: e.target.value }))}
        />
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          placeholder={t('settings.openingHours')}
          value={settings.openingHours}
          onChange={(e) => setSettings((s) => ({ ...s, openingHours: e.target.value }))}
        />
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          placeholder={t('settings.closingHours')}
          value={settings.closingHours}
          onChange={(e) => setSettings((s) => ({ ...s, closingHours: e.target.value }))}
        />
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          placeholder={t('settings.currency')}
          value={settings.currency}
          onChange={(e) => {
            setSettings((s) => ({ ...s, currency: e.target.value }));
            setCurrency(e.target.value);
          }}
        />
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          placeholder={t('settings.salesTax')}
          value={settings.salesTax}
          onChange={(e) => setSettings((s) => ({ ...s, salesTax: Number(e.target.value) || 0 }))}
        />
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          placeholder={t('settings.discount')}
          value={settings.defaultDiscountLabel ?? ''}
          onChange={(e) => setSettings((s) => ({ ...s, defaultDiscountLabel: e.target.value }))}
        />
        <select
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          value={settings.language}
          onChange={(e) => {
            const language = e.target.value as 'en' | 'fr' | 'ar';
            setSettings((s) => ({ ...s, language }));
            setLanguage(language);
          }}
        >
          <option value="en">{t('language.en')}</option>
          <option value="fr">{t('language.fr')}</option>
          <option value="ar">{t('language.ar')}</option>
        </select>
        <select
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          value={settings.direction}
          onChange={(e) => {
            const direction = e.target.value as 'ltr' | 'rtl';
            setSettings((s) => ({ ...s, direction }));
            setDirection(direction);
          }}
        >
          <option value="ltr">{t('settings.ltr')}</option>
          <option value="rtl">{t('settings.rtl')}</option>
        </select>
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          placeholder={t('settings.locale')}
          value={settings.locale}
          onChange={(e) => {
            setSettings((s) => ({ ...s, locale: e.target.value }));
            setLocale(e.target.value);
          }}
        />
        <input
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
          placeholder={t('settings.dateFormat')}
          value={settings.dateFormat}
          onChange={(e) => {
            setSettings((s) => ({ ...s, dateFormat: e.target.value }));
            setDateFormat(e.target.value);
          }}
        />
      </section>
    </>
  );
}
