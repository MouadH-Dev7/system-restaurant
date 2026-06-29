'use client';

import { PlusCircle, ReceiptText, TrendingDown, TrendingUp } from 'lucide-react';
import { useI18n } from '@/hooks/use-i18n';

export type RiskSummaryCardsProps = {
  totalEdits: number;
  reducedAmount: number;
  addedAmount: number;
  netImpact: number;
  highRiskCount: number;
};

export function RiskSummaryCards({ totalEdits, reducedAmount, addedAmount, netImpact, highRiskCount }: RiskSummaryCardsProps) {
  const { t, formatCurrency, formatNumber } = useI18n();

  return (
    <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className="panel rounded-[28px] border border-slate-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">{t('employeeRisk.totalEdits')}</p>
            <p className="mt-3 text-3xl font-black text-slate-950">{formatNumber(totalEdits)}</p>
          </div>
          <ReceiptText className="h-9 w-9 text-[#b55229]" />
        </div>
      </div>
      <div className="panel rounded-[28px] border border-rose-200 bg-rose-50/70">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-rose-500">{t('employeeRisk.totalReduced')}</p>
            <p className="mt-3 text-3xl font-black text-rose-900">{formatCurrency(reducedAmount)}</p>
          </div>
          <TrendingDown className="h-9 w-9 text-rose-600" />
        </div>
      </div>
      <div className="panel rounded-[28px] border border-amber-200 bg-amber-50/70">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-600">{t('employeeRisk.totalAdded')}</p>
            <p className="mt-3 text-3xl font-black text-amber-900">{formatCurrency(addedAmount)}</p>
          </div>
          <PlusCircle className="h-9 w-9 text-amber-600" />
        </div>
      </div>
      <div className="panel rounded-[28px] border border-emerald-200 bg-emerald-50/70">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">{t('employeeRisk.netImpact')}</p>
            <p className="mt-3 text-3xl font-black text-emerald-900">{formatCurrency(netImpact)}</p>
            <p className="mt-2 text-xs text-emerald-700">{t('employeeRisk.highRiskCases')}: {formatNumber(highRiskCount)}</p>
          </div>
          <TrendingUp className="h-9 w-9 text-emerald-600" />
        </div>
      </div>
    </section>
  );
}
