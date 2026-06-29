'use client';

import { memo } from 'react';
import { Minus, Plus } from 'lucide-react';
import { formatMoney } from '@/lib/format';

type OrderItemView = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  modifiers?: string[];
};

type OrderItemListProps =
  | {
      variant: 'card';
      items: OrderItemView[];
      canEdit?: boolean;
      onQuantityChange?: (lineId: string, delta: number) => void;
      unitPriceLabel: string;
      emptyMessage: string;
    }
  | {
      variant: 'inline';
      items: OrderItemView[];
    };

function OrderItemListComponent(props: OrderItemListProps) {
  if (props.variant === 'inline') {
    if (props.items.length === 0) {
      return null;
    }

    return (
      <>
        {props.items.map((item) => (
          <div key={item.id} className="flex justify-between gap-3 text-sm">
            <span>
              {item.quantity}x {item.name}
            </span>
            <span className="font-semibold">{formatMoney(item.total)}</span>
          </div>
        ))}
      </>
    );
  }

  if (props.items.length === 0) {
    return <p className="text-sm text-slate-500">{props.emptyMessage}</p>;
  }

  return (
    <>
      {props.items.map((item) => (
        <article
          key={item.id}
          className="flex items-center justify-between rounded-[24px] border border-slate-200 bg-white p-4"
        >
          <div className="flex items-center gap-4">
            {props.canEdit && props.onQuantityChange ? (
              <div className="rounded-2xl bg-[#eef4fb] p-2 text-[#39506b]">
                <button
                  type="button"
                  className="block p-1"
                  onClick={() => props.onQuantityChange!(item.id, 1)}
                >
                  <Plus size={16} />
                </button>
                <div className="py-1 text-center text-lg font-bold">{item.quantity}</div>
                <button
                  type="button"
                  className="block p-1"
                  onClick={() => props.onQuantityChange!(item.id, -1)}
                >
                  <Minus size={16} />
                </button>
              </div>
            ) : (
              <span className="text-lg font-bold">{item.quantity}x</span>
            )}
            <div>
              <h4 className="text-lg font-bold">{item.name}</h4>
              <p className="text-sm text-slate-500">
                {formatMoney(item.unitPrice)} {props.unitPriceLabel}
              </p>
              {item.modifiers && item.modifiers.length > 0 ? (
                <p className="mt-1 text-xs text-slate-500">{item.modifiers.join(' | ')}</p>
              ) : null}
            </div>
          </div>
          <p className="text-xl font-bold">{formatMoney(item.total)}</p>
        </article>
      ))}
    </>
  );
}

export const OrderItemList = memo(OrderItemListComponent);
