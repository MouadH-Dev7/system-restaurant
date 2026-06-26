'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PaymentDTO, PaymentMethod, StaffMemberDTO } from '@repo/shared-types';
import { getApiErrorMessage } from '@/lib/api-error';
import { useI18n } from '@/hooks/use-i18n';
import { useAppStore } from '@/store/app.store';
import {
  changePaymentMethod,
  listPaymentHistory,
  listPayments,
  refundPayment,
  } from '@/services/payments.service';
import { listStaff } from '@/services/staff.service';

export function PaymentsScreen() {
  const {
    t,
    formatCurrency,
    formatDateTime,
    formatNumber,
    statusLabel,
    paymentMethodLabel,
    roleLabel,
  } = useI18n();
  const restaurantId = useAppStore((state) => state.restaurantId);
  const [payments, setPayments] = useState<PaymentDTO[]>([]);
  const [staff, setStaff] = useState<StaffMemberDTO[]>([]);
  const [selectedOrderHistory, setSelectedOrderHistory] = useState<PaymentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [status, setStatus] = useState('');
  const [createdBy, setCreatedBy] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const [data, nextStaff] = await Promise.all([
        listPayments({
          ...(search ? { search } : {}),
          ...(paymentMethod ? { paymentMethod } : {}),
          ...(status ? { status } : {}),
          ...(createdBy ? { createdBy } : {}),
        }),
        restaurantId ? listStaff(restaurantId) : Promise.resolve([]),
      ]);
      setPayments(data);
      setStaff(nextStaff);
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('payments.title')));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [restaurantId]);

  const stats = useMemo(() => {
    const totalRevenue = payments.reduce(
      (sum, payment) => sum + (payment.amount - payment.refundedAmount),
      0,
    );
    const totalRefunds = payments.reduce((sum, payment) => sum + payment.refundedAmount, 0);
    const outstanding = payments.reduce((sum, payment) => sum + payment.remainingAmount, 0);
    return { totalRevenue, totalRefunds, outstanding };
  }, [payments]);

  async function handleShowHistory(orderId: string) {
    const history = await listPaymentHistory(orderId);
    setSelectedOrderHistory(history);
  }

  async function handleRefund(payment: PaymentDTO) {
    const reason = window.prompt(t('payments.refundReasonPrompt'));
    if (!reason) {
      return;
    }
    await refundPayment(payment.id, { amount: payment.remainingAmount, reason });
    await load();
    await handleShowHistory(payment.orderId);
  }

  async function handleChangeMethod(payment: PaymentDTO) {
    const nextMethod = window.prompt(t('payments.newMethodPrompt'));
    const reason = window.prompt(t('payments.changeReasonPrompt'));
    if (!nextMethod || !reason) {
      return;
    }
    await changePaymentMethod(payment.id, {
      paymentMethod: nextMethod as PaymentMethod,
      reason,
    });
    await load();
    await handleShowHistory(payment.orderId);
  }

  return (
    <div className="space-y-6">
      <section className="page-header">
        <div>
          <h2>{t('payments.title')}</h2>
          <p>{t('payments.subtitle')}</p>
        </div>
      </section>

      {error ? <div className="panel error-banner">{error}</div> : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="panel">
          <strong>{formatCurrency(stats.totalRevenue)}</strong>
          <p>{t('payments.totalRevenue')}</p>
        </div>
        <div className="panel">
          <strong>{formatCurrency(stats.totalRefunds)}</strong>
          <p>{t('payments.totalRefunds')}</p>
        </div>
        <div className="panel">
          <strong>{formatCurrency(stats.outstanding)}</strong>
          <p>{t('payments.outstandingBalance')}</p>
        </div>
      </div>

      <section className="panel">
        <div className="grid gap-3 md:grid-cols-5">
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder={t('payments.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="">{t('payments.allMethods')}</option>
            <option value="CASH">{paymentMethodLabel('CASH')}</option>
            <option value="CARD">{paymentMethodLabel('CARD')}</option>
            <option value="BANK_TRANSFER">{paymentMethodLabel('BANK_TRANSFER')}</option>
            <option value="MOBILE_PAYMENT">{paymentMethodLabel('MOBILE_PAYMENT')}</option>
          </select>
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            value={createdBy}
            onChange={(e) => setCreatedBy(e.target.value)}
          >
            <option value="">{t('payments.allStaff')}</option>
            {staff.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} - {roleLabel(member.role)}
              </option>
            ))}
          </select>
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">{t('payments.allStatuses')}</option>
            <option value="PAID">{statusLabel('PAID')}</option>
            <option value="PARTIALLY_REFUNDED">{statusLabel('PARTIALLY_REFUNDED')}</option>
            <option value="REFUNDED">{statusLabel('REFUNDED')}</option>
            <option value="CANCELLED">{statusLabel('CANCELLED')}</option>
          </select>
          <button type="button" className="primary-btn" onClick={() => void load()}>
            {t('payments.applyFilters')}
          </button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <article className="panel">
          {loading ? (
            <div className="p-8 text-slate-400">{t('payments.loading')}</div>
          ) : payments.length === 0 ? (
            <div className="p-8 text-slate-400">{t('payments.empty')}</div>
          ) : (
            <div className="space-y-3">
              {payments.map((payment) => (
                <div key={payment.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <strong className="block">#{payment.id.slice(0, 8)}</strong>
                      <span className="text-xs text-slate-500">
                        {t('payments.orderShort')} {payment.orderId.slice(0, 8)} -{' '}
                        {paymentMethodLabel(payment.paymentMethod)} - {statusLabel(payment.status)}
                      </span>
                      <div className="mt-2 text-xs text-slate-500">
                        {formatDateTime(payment.createdAt)}
                      </div>
                    </div>
                    <strong>{formatCurrency(payment.amount - payment.refundedAmount)}</strong>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      className="ghost-btn small"
                      onClick={() => void handleShowHistory(payment.orderId)}
                    >
                      {t('payments.viewDetails')}
                    </button>
                    <button
                      type="button"
                      className="ghost-btn small"
                      onClick={() => void handleRefund(payment)}
                    >
                      {t('payments.refund')}
                    </button>
                    <button
                      type="button"
                      className="ghost-btn small"
                      onClick={() => void handleChangeMethod(payment)}
                    >
                      {t('payments.changeMethod')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <aside className="panel">
          <div className="panel-header">
            <div>
              <h3>{t('payments.historyTitle')}</h3>
              <p>{formatNumber(selectedOrderHistory.length)} records</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            {selectedOrderHistory.map((payment) => (
              <div key={payment.id} className="rounded-2xl border border-slate-100 p-4 text-sm">
                <div className="flex justify-between gap-3">
                  <strong>{paymentMethodLabel(payment.paymentMethod)}</strong>
                  <span>{formatCurrency(payment.amount - payment.refundedAmount)}</span>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {statusLabel(payment.status)} - {formatDateTime(payment.createdAt)} -{' '}
                  {payment.createdBy ?? t('payments.unknown')}
                </div>
                {payment.reason ? (
                  <div className="mt-2 text-xs text-slate-600">
                    {t('payments.reason')}: {payment.reason}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
