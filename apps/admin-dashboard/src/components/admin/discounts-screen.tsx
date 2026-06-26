'use client';

import { useEffect, useState } from 'react';
import type { DiscountDTO } from '@repo/shared-types';
import { getApiErrorMessage } from '@/lib/api-error';
import { useI18n } from '@/hooks/use-i18n';
import { approveDiscount, listDiscounts, rejectDiscount } from '@/services/discounts.service';

export function DiscountsScreen() {
  const { t, formatDateTime, formatNumber, statusLabel, discountTypeLabel } = useI18n();
  const [discounts, setDiscounts] = useState<DiscountDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approvalStatus, setApprovalStatus] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const data = await listDiscounts({
        ...(approvalStatus ? { approvalStatus } : {}),
        ...(type ? { type } : {}),
        ...(search ? { search } : {}),
      });
      setDiscounts(data);
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t('discounts.title')));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleApprove(discount: DiscountDTO) {
    const reason = window.prompt(t('discounts.approvalReasonPrompt'));
    if (!reason) {
      return;
    }
    await approveDiscount(discount.id, { reason });
    await load();
  }

  async function handleReject(discount: DiscountDTO) {
    const reason = window.prompt(t('discounts.rejectionReasonPrompt'));
    if (!reason) {
      return;
    }
    await rejectDiscount(discount.id, { reason });
    await load();
  }

  return (
    <div className="space-y-6">
      <section className="page-header">
        <div>
          <h2>{t('discounts.title')}</h2>
          <p>{t('discounts.subtitle')}</p>
        </div>
      </section>

      {error ? <div className="panel error-banner">{error}</div> : null}

      <section className="panel">
        <div className="grid gap-3 md:grid-cols-4">
          <input
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            placeholder={t('discounts.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            value={approvalStatus}
            onChange={(e) => setApprovalStatus(e.target.value)}
          >
            <option value="">{t('discounts.allApprovals')}</option>
            <option value="PENDING_APPROVAL">{t('discounts.pendingApproval')}</option>
            <option value="APPROVED">{t('discounts.approved')}</option>
            <option value="REJECTED">{t('discounts.rejected')}</option>
          </select>
          <select
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">{t('discounts.allTypes')}</option>
            <option value="PERCENTAGE">{discountTypeLabel('PERCENTAGE')}</option>
            <option value="FIXED_AMOUNT">{discountTypeLabel('FIXED_AMOUNT')}</option>
          </select>
          <button type="button" className="primary-btn" onClick={() => void load()}>
            {t('discounts.applyFilters')}
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <h3>{t('discounts.recordsTitle')}</h3>
            <p>{formatNumber(discounts.length)} {t('discounts.records')}</p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-slate-400">{t('discounts.loading')}</div>
        ) : discounts.length === 0 ? (
          <div className="p-8 text-slate-400">{t('discounts.empty')}</div>
        ) : (
          <div className="mt-4 space-y-3">
            {discounts.map((discount) => (
              <div key={discount.id} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <strong className="block">
                      {t('discounts.orderShort')} {discount.orderId.slice(0, 8)}
                    </strong>
                    <span className="text-xs text-slate-500">
                      {discountTypeLabel(discount.type)} - {statusLabel(discount.approvalStatus)}
                    </span>
                    <div className="mt-2 text-xs text-slate-500">
                      {formatDateTime(discount.createdAt)}
                    </div>
                  </div>
                  <strong>{discount.type === 'PERCENTAGE' ? `${discount.value}%` : discount.value}</strong>
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  {t('discounts.reason')}: {discount.reason}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {t('discounts.createdBy')}: {discount.createdBy ?? t('discounts.unknown')} -{' '}
                  {t('discounts.approvedBy')}: {discount.approvedBy ?? t('discounts.pending')}
                </div>
                <div className="mt-3 flex gap-2">
                  {discount.approvalStatus === 'PENDING_APPROVAL' ? (
                    <>
                      <button
                        type="button"
                        className="ghost-btn small"
                        onClick={() => void handleApprove(discount)}
                      >
                        {t('discounts.approve')}
                      </button>
                      <button
                        type="button"
                        className="ghost-btn small"
                        onClick={() => void handleReject(discount)}
                      >
                        {t('discounts.reject')}
                      </button>
                    </>
                  ) : null}
                  <button type="button" className="ghost-btn small">
                    {t('discounts.viewAudit')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
