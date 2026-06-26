'use client';

import { create } from 'zustand';
import type { OrderResponse } from '@repo/shared-types';
import { paymentMethods } from '@/config/pos-static';
import type { CheckoutTarget, PosScreen, ReceiptBundle } from '@/types/pos';

export type PosComposeMode = 'walk-in' | 'table';
export type PosLanguage = 'en' | 'fr' | 'ar';
export type PosOrderEditSource = 'history' | 'checkout' | 'board' | 'tables';

const POS_LANGUAGE_STORAGE_KEY = 'khalou-fodil:pos-language';

function readStoredLanguage(): PosLanguage {
  if (typeof window === 'undefined') {
    return 'ar';
  }

  const value = window.localStorage.getItem(POS_LANGUAGE_STORAGE_KEY);
  return value === 'en' || value === 'fr' || value === 'ar' ? value : 'ar';
}

type PosUiState = {
  activeScreen: PosScreen;
  language: PosLanguage;
  tableBillingMode: 'unified' | 'orders';
  selectedOrderId: string;
  selectedTableId: string;
  selectedPaymentMethod: string;
  lastReceiptOrder: OrderResponse | null;
  lastReceiptBundle: ReceiptBundle | null;
  lastPaymentMethod: string;
  receiptLanguage: 'ar' | 'fr' | 'en';
  checkoutTarget: CheckoutTarget | null;
  orderEditReason: string;
  orderEditSource: PosOrderEditSource;
  composeMode: PosComposeMode | null;
  composeReturnScreen: 'orders' | 'external-orders' | 'orders-history' | 'tables';
  composeTableId: string | null;
  composeTableNumber: number | null;
  setActiveScreen: (screen: PosScreen) => void;
  setLanguage: (language: PosLanguage) => void;
  setTableBillingMode: (mode: 'unified' | 'orders') => void;
  selectOrder: (orderId: string) => void;
  selectTable: (tableId: string) => void;
  selectPaymentMethod: (methodId: string) => void;
  setReceiptLanguage: (language: 'ar' | 'fr' | 'en') => void;
  setLastReceiptOrder: (order: OrderResponse | null, paymentMethod?: string) => void;
  setLastReceiptBundle: (bundle: ReceiptBundle | null) => void;
  setCheckoutTarget: (target: CheckoutTarget | null) => void;
  setOrderEditReason: (reason: string) => void;
  setOrderEditSource: (source: PosOrderEditSource) => void;
  startWalkInCompose: (returnScreen?: 'orders' | 'external-orders' | 'orders-history') => void;
  startTableCompose: (tableId: string, tableNumber: number) => void;
  clearCompose: () => void;
  reset: () => void;
};

export const usePosUiStore = create<PosUiState>((set) => ({
  activeScreen: 'orders',
  language: readStoredLanguage(),
  tableBillingMode: 'unified',
  selectedOrderId: '',
  selectedTableId: '',
  selectedPaymentMethod: paymentMethods[0]?.id ?? 'card',
  lastReceiptOrder: null,
  lastReceiptBundle: null,
  lastPaymentMethod: paymentMethods[0]?.id ?? 'card',
  receiptLanguage: 'ar',
  checkoutTarget: null,
  orderEditReason: '',
  orderEditSource: 'board',
  composeMode: null,
  composeReturnScreen: 'orders',
  composeTableId: null,
  composeTableNumber: null,
  setActiveScreen: (screen) => set({ activeScreen: screen }),
  setLanguage: (language) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(POS_LANGUAGE_STORAGE_KEY, language);
    }
    set({ language });
  },
  setTableBillingMode: (tableBillingMode) => set({ tableBillingMode }),
  selectOrder: (orderId) => set({ selectedOrderId: orderId }),
  selectTable: (tableId) => set({ selectedTableId: tableId }),
  selectPaymentMethod: (methodId) => set({ selectedPaymentMethod: methodId }),
  setReceiptLanguage: (receiptLanguage) => set({ receiptLanguage }),
  setLastReceiptOrder: (lastReceiptOrder, paymentMethod) =>
    set((state) => ({
      lastReceiptOrder,
      lastPaymentMethod: paymentMethod ?? state.selectedPaymentMethod,
    })),
  setLastReceiptBundle: (lastReceiptBundle) => set({ lastReceiptBundle }),
  setCheckoutTarget: (checkoutTarget) => set({ checkoutTarget }),
  setOrderEditReason: (orderEditReason) => set({ orderEditReason }),
  setOrderEditSource: (orderEditSource) => set({ orderEditSource }),
  startWalkInCompose: (returnScreen = 'orders') =>
    set({
      composeMode: 'walk-in',
      composeReturnScreen: returnScreen,
      composeTableId: null,
      composeTableNumber: null,
      activeScreen: 'order-compose',
    }),
  startTableCompose: (tableId, tableNumber) =>
    set({
      composeMode: 'table',
      composeReturnScreen: 'tables',
      composeTableId: tableId,
      composeTableNumber: tableNumber,
      selectedTableId: tableId,
      activeScreen: 'order-compose',
    }),
  clearCompose: () =>
    set({
      composeMode: null,
      composeReturnScreen: 'orders',
      composeTableId: null,
      composeTableNumber: null,
      checkoutTarget: null,
    }),
  reset: () =>
    set((state) => ({
      activeScreen: 'orders',
      tableBillingMode: 'unified',
      selectedOrderId: '',
      selectedTableId: '',
      selectedPaymentMethod: paymentMethods[0]?.id ?? 'card',
      lastReceiptOrder: null,
      lastReceiptBundle: null,
      lastPaymentMethod: paymentMethods[0]?.id ?? 'card',
      receiptLanguage: state.receiptLanguage,
      checkoutTarget: null,
      orderEditReason: '',
      orderEditSource: 'board',
      composeMode: null,
      composeReturnScreen: 'orders',
      composeTableId: null,
      composeTableNumber: null,
      language: state.language,
    })),
}));

export function getSelectedPaymentMethod(selectedPaymentMethod: string) {
  const fallback = paymentMethods[0];
  if (!fallback) {
    throw new Error('POS payment methods are not configured');
  }

  return paymentMethods.find((method) => method.id === selectedPaymentMethod) ?? fallback;
}
