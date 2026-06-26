'use client';

import { PosMenuFlow } from '@/components/pos/pos-menu-flow';
import { usePosOrderActions } from '@/hooks/use-pos-order-actions';
import { formatTableLabel, posT } from '@/lib/i18n';
import { usePosDataStore } from '@/store/pos-data.store';
import { usePosUiStore } from '@/store/pos-ui.store';

export function OrderComposeScreen() {
  const composeMode = usePosUiStore((state) => state.composeMode);
  const composeTableId = usePosUiStore((state) => state.composeTableId);
  const composeReturnScreen = usePosUiStore((state) => state.composeReturnScreen);
  const language = usePosUiStore((state) => state.language);
  const setActiveScreen = usePosUiStore((state) => state.setActiveScreen);
  const clearCompose = usePosUiStore((state) => state.clearCompose);
  const settings = usePosDataStore((state) => state.settings);
  const { createWalkInOrder, createTableOrder } = usePosOrderActions();
  const t = posT(language);

  if (!composeMode) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/80 p-10 text-center text-slate-500">
        {t.noOrderInProgress}
      </div>
    );
  }

  const isWalkIn = composeMode === 'walk-in';
  const tableNumber = usePosUiStore.getState().composeTableNumber;
  const restaurantName = settings?.restaurantName?.trim() || t.restaurant;

  return (
    <PosMenuFlow
      title={
        isWalkIn
          ? `${restaurantName} - ${t.walkIn}`
          : `${t.composeTitle} - ${formatTableLabel(tableNumber, language)}`
      }
      subtitle={isWalkIn ? t.walkInComposeSubtitle : t.tableComposeSubtitle}
      submitLabel={t.sendToKitchen}
      variant={isWalkIn ? 'waiter' : 'default'}
      onCancel={() => {
        clearCompose();
        setActiveScreen(isWalkIn ? composeReturnScreen : 'tables');
      }}
      onSubmit={async (items) => {
        if (isWalkIn) {
          await createWalkInOrder(items);
        } else if (composeTableId) {
          await createTableOrder(composeTableId, items);
        }
        clearCompose();
      }}
    />
  );
}
