import {
  type CreateFloorInput,
  type FloorDTO,
  type CreateTableInput,
  type TableDTO,
  type UpdateFloorInput,
  type UpdateTableInput,
} from '@repo/shared-types';
import { http } from '@/lib/http';

const CUSTOMER_APP_HOST_KEY = 'restaurant:customer-app-host';

function normalizeCustomerAppOrigin(value: string) {
  const trimmed = value.trim().replace(/\/$/, '');

  if (!trimmed) {
    return undefined;
  }

  try {
    const parsed = new URL(trimmed.includes('://') ? trimmed : `http://${trimmed}`);

    return `${parsed.protocol}//${parsed.hostname}:3001`;
  } catch {
    return undefined;
  }
}

function customerAppOriginHeader() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const configuredHost = window.localStorage.getItem(CUSTOMER_APP_HOST_KEY);

  if (configuredHost === 'AUTO_HOSTNAME') {
    const localDomain = window.localStorage.getItem('restaurant:local-domain');
    if (localDomain) {
      return `${window.location.protocol}//${localDomain}:3001`;
    }
  }

  if (configuredHost === 'AUTO_IP' || !configuredHost) {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return undefined;
    }
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }

  const configuredOrigin = normalizeCustomerAppOrigin(configuredHost);
  if (configuredOrigin) {
    return configuredOrigin;
  }

  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return undefined;
  }

  return `${window.location.protocol}//${window.location.hostname}:3001`;
}

function tableRequestConfig() {
  const customerAppOrigin = customerAppOriginHeader();
  const headers = {
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    ...(customerAppOrigin ? { 'x-customer-app-origin': customerAppOrigin } : {}),
  };

  return {
    headers,
    customerAppOrigin,
  };
}

export async function listTables(restaurantId: string) {
  const { headers, customerAppOrigin } = tableRequestConfig();
  const { data } = await http.get<TableDTO[]>('/tables', {
    headers,
    params: {
      ...(customerAppOrigin ? { customerAppOrigin } : {}),
    },
  });
  return data;
}

export async function createTable(input: CreateTableInput) {
  const { headers } = tableRequestConfig();
  const { data } = await http.post<TableDTO>('/tables', input, { headers });
  return data;
}

export async function listFloors() {
  const { data } = await http.get<FloorDTO[]>('/tables/floors/list');
  return data;
}

export async function createFloor(input: Omit<CreateFloorInput, 'restaurantId'>) {
  const { data } = await http.post<FloorDTO>('/tables/floors', input);
  return data;
}

export async function updateFloor(floorId: string, input: UpdateFloorInput) {
  const { data } = await http.patch<FloorDTO>(`/tables/floors/${floorId}`, input);
  return data;
}

export async function deleteFloor(floorId: string) {
  const { data } = await http.delete<FloorDTO>(`/tables/floors/${floorId}`);
  return data;
}

export async function updateTable(tableId: string, input: UpdateTableInput) {
  const { headers } = tableRequestConfig();
  const { data } = await http.patch<TableDTO>(`/tables/${tableId}`, input, { headers });
  return data;
}

export async function deleteTable(tableId: string) {
  const { data } = await http.delete<TableDTO>(`/tables/${tableId}`);
  return data;
}

export type NetworkInfoDTO = {
  hostname: string;
  lanAddress: string | null;
  localDomain: string;
};

export async function getNetworkInfo(clientHost?: string): Promise<NetworkInfoDTO> {
  const { data } = await http.get<NetworkInfoDTO>('/tables/network-info', {
    headers: {
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
    params: {
      t: Date.now(),
      ...(clientHost ? { clientHost } : {}),
    },
  });
  return data;
}
