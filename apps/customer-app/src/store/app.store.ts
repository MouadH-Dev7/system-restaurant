import { create } from 'zustand';
import type { OrderContextDTO } from '@/types/order';

type AppState = {
  context: OrderContextDTO | null;
  waiterComingMessage: string | null;
  displayTableNumber: string | number | null;
  setOrderContext: (context: OrderContextDTO) => void;
  setWaiterComingMessage: (message: string | null) => void;
  setDisplayTableNumber: (num: string | number) => void;
};

export const useAppStore = create<AppState>((set) => ({
  context: null,
  waiterComingMessage: null,
  displayTableNumber: null,
  setOrderContext: (context) => set({ context }),
  setWaiterComingMessage: (waiterComingMessage) => set({ waiterComingMessage }),
  setDisplayTableNumber: (displayTableNumber) => set({ displayTableNumber }),
}));
