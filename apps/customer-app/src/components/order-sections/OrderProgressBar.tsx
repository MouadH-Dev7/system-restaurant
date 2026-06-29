'use client';

import type { OrderResponse } from '@repo/shared-types';
import { isStepActive } from '@/lib/order-status';

type Step = {
  key: 'pending' | 'preparing' | 'ready' | 'delivered';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function OrderProgressBar({
  steps,
  status,
  progress,
}: {
  steps: Step[];
  status: OrderResponse['status'] | undefined;
  progress: number;
}) {
  return (
    <section className="mt-8 rounded-[28px] border border-[#e1cdb5] bg-white p-6 shadow-[0_20px_60px_rgba(70,47,26,0.08)]">
      <div className="relative mb-8 px-2">
        <div className="absolute left-6 right-6 top-5 h-1 rounded-full bg-[#efe4d7]" />
        <div
          className="absolute left-6 top-5 h-1 rounded-full bg-[#b26f2f] transition-all duration-500"
          style={{ width: `calc((100% - 3rem) * ${progress / 100})` }}
        />
        <div className="relative z-10 grid grid-cols-4 gap-2">
          {steps.map((step) => {
            const active = isStepActive(status, step.key);
            return (
              <div key={step.key} className="flex flex-col items-center gap-2 text-center">
                <span
                  className={`grid h-10 w-10 place-items-center rounded-full ${
                    active ? 'bg-[#b26f2f] text-white' : 'bg-[#efe4d7] text-[#9e8c7a]'
                  }`}
                >
                  <step.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-xs font-bold text-[#6b5c4f]">{step.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
