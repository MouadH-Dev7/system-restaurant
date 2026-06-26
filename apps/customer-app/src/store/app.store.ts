import { create } from 'zustand';
import type { OrderContextDTO } from '@/types/order';

type AppState = {
  context: OrderContextDTO | null;
  waiterComingMessage: string | null;
  setOrderContext: (context: OrderContextDTO) => void;
  setWaiterComingMessage: (message: string | null) => void;
};

export const useAppStore = create<AppState>((set) => ({
  context: null,
  waiterComingMessage: null,
  setOrderContext: (context) => set({ context }),
  setWaiterComingMessage: (waiterComingMessage) => set({ waiterComingMessage }),
}));
