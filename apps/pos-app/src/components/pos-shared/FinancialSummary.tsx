'use client';

import { formatMoney } from '@/lib/format';

type SummaryCard = {
  label: string;
  value: string;
};

type FinancialSummaryProps =
  | {
      variant: 'total-line';
      label: string;
      amount: number;
    }
  | {
      variant: 'summary-grid';
      cards: SummaryCard[];
    };

export function FinancialSummary(props: FinancialSummaryProps) {
  if (props.variant === 'total-line') {
    return (
      <div className="mt-6 flex justify-between border-t border-dashed border-slate-200 pt-4 text-xl font-bold">
        <span>{props.label}</span>
        <span className="text-[#a73308]">{formatMoney(props.amount)}</span>
      </div>
    );
  }

  return (
    <div className="mt-5 grid gap-4 md:grid-cols-3">
      {props.cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
          <p className="mt-2 text-xl font-bold text-slate-900">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
