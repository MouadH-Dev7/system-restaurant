'use client';

import { useCallback } from 'react';
import { useAppStore } from '@/store/app.store';
import {
  defaultLocale,
  isRtl,
  translate,
  translatePrinterType,
  translatePaymentMethod,
  translateDiscountType,
  translateRiskFlag,
  translateReportType,
  translateRole,
  translateStatus,
} from '@/lib/i18n';

export function useI18n() {
  const language = useAppStore((state) => state.language);
  const direction = useAppStore((state) => state.direction);
  const locale = useAppStore((state) => state.locale);
  const dateFormat = useAppStore((state) => state.dateFormat);
  const currency = useAppStore((state) => state.currency);

  const currentLocale = locale || defaultLocale(language);
  const currentDir = direction || (isRtl(language) ? 'rtl' : 'ltr');

  const t = useCallback((key: string) => translate(language, key), [language]);

  const statusLabel = useCallback(
    (status: string) => translateStatus(language, status),
    [language],
  );

  const roleLabel = useCallback((role: string) => translateRole(language, role), [language]);

  const printerTypeLabel = useCallback(
    (type: string) => translatePrinterType(language, type),
    [language],
  );

  const reportTypeLabel = useCallback(
    (type: string) => translateReportType(language, type),
    [language],
  );

  const paymentMethodLabel = useCallback(
    (method: string) => translatePaymentMethod(language, method),
    [language],
  );

  const discountTypeLabel = useCallback(
    (type: string) => translateDiscountType(language, type),
    [language],
  );

  const riskFlagLabel = useCallback(
    (flag: string) => translateRiskFlag(language, flag),
    [language],
  );

  const formatCurrency = useCallback(
    (value: number, currentCurrency = currency || 'DZD') =>
      new Intl.NumberFormat(currentLocale, {
        style: 'currency',
        currency: currentCurrency,
        maximumFractionDigits: 0,
      }).format(value),
    [currentLocale, currency],
  );

  const formatNumber = useCallback(
    (value: number) => new Intl.NumberFormat(currentLocale).format(value),
    [currentLocale],
  );

  const formatDateTime = useCallback(
    (value: string | Date) =>
      new Intl.DateTimeFormat(currentLocale, {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(typeof value === 'string' ? new Date(value) : value),
    [currentLocale],
  );

  return {
    language,
    locale: currentLocale,
    dateFormat,
    currency,
    dir: currentDir,
    t,
    statusLabel,
    roleLabel,
    printerTypeLabel,
    reportTypeLabel,
    paymentMethodLabel,
    discountTypeLabel,
    riskFlagLabel,
    formatCurrency,
    formatNumber,
    formatDateTime,
  };
}
