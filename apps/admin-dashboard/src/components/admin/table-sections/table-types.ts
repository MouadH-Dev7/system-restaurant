import type { TableStatus } from '@repo/shared-types';

export type TableFormState = {
  number: string;
  capacity: string;
  status: TableStatus;
  floorId: string;
  shape: 'round' | 'square';
};

export type FloorFormState = {
  name: string;
};

export const initialTableForm: TableFormState = {
  number: '',
  capacity: '',
  status: 'AVAILABLE',
  floorId: '',
  shape: 'round',
};

export const initialFloorForm: FloorFormState = {
  name: '',
};
