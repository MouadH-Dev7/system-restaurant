import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OrderStatus, type Table, TableStatus } from '@prisma/client';
import type {
  CreateFloorInput,
  CreateTableInput,
  FloorDTO,
  TableDTO,
  UpdateFloorInput,
  UpdateTableInput,
} from '@repo/shared-types';
import QRCode from 'qrcode';
import { ConfigService } from '@nestjs/config';
import { networkInterfaces, hostname } from 'os';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { RestaurantsService } from '../restaurants/restaurants.service';

type RequestUrlContext = {
  host?: string;
  forwardedHost?: string;
  protocol?: string;
  forwardedProto?: string;
  customerAppOrigin?: string;
};

const CUSTOMER_APP_PORT = '3001';
const NETWORK_INFO_FILE = 'network-info.json';

@Injectable()
export class TablesService {
  private readonly logger = new Logger(TablesService.name);
  private cachedLanAddress: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly restaurantsService: RestaurantsService,
    private readonly configService: ConfigService,
  ) {}

  async validateTable(
    tableId: string,
    restaurantId: string,
    requestUrl?: RequestUrlContext,
  ): Promise<TableDTO> {
    const table = await this.prisma.table.findFirst({
      where: {
        id: tableId,
        restaurantId,
      },
      include: { floor: true },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    return this.toTableDto(table, requestUrl);
  }

  private resolveSharedNetworkInfoPath() {
    const cwdSharedPath = join(process.cwd(), 'shared', NETWORK_INFO_FILE);
    const parentSharedPath = join(process.cwd(), '..', 'shared', NETWORK_INFO_FILE);

    if (existsSync(cwdSharedPath) || !existsSync(parentSharedPath)) {
      return cwdSharedPath;
    }

    return parentSharedPath;
  }

  private readSharedNetworkInfo(): { hostIp?: string; hostName?: string } | null {
    try {
      const filePath = this.resolveSharedNetworkInfoPath();
      if (existsSync(filePath)) {
        const content = readFileSync(filePath, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      this.logger.warn(`Failed to read shared network info: ${(error as Error).message}`);
    }
    return null;
  }

  private writeSharedNetworkInfo(info: { hostIp: string | null; hostName: string }) {
    try {
      const filePath = this.resolveSharedNetworkInfoPath();
      mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(filePath, JSON.stringify(info, null, 2), 'utf8');
    } catch (error) {
      this.logger.warn(`Failed to write shared network info: ${(error as Error).message}`);
    }
  }

  getNetworkInfo(clientHost?: string) {
    const sharedInfo = this.readSharedNetworkInfo();
    const host = sharedInfo?.hostName || this.configService.get<string>('HOST_HOSTNAME') || hostname();
    const currentLanAddress = this.detectLanAddress();
    const fallbackClientHost = this.normalizeClientHost(clientHost);
    const lanAddress = currentLanAddress ?? fallbackClientHost ?? sharedInfo?.hostIp?.trim() ?? null;

    this.cachedLanAddress = lanAddress;
    this.writeSharedNetworkInfo({ hostIp: lanAddress, hostName: host });

    return {
      hostname: host,
      lanAddress,
      localDomain: `${host.toLowerCase()}.local`,
    };
  }

  async listFloors(restaurantId: string): Promise<FloorDTO[]> {
    await this.restaurantsService.validateRestaurant(restaurantId);

    const floors = await this.prisma.floor.findMany({
      where: { restaurantId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return floors.map((floor) => ({
      id: floor.id,
      name: floor.name,
      sortOrder: floor.sortOrder,
      restaurantId: floor.restaurantId,
      createdAt: floor.createdAt.toISOString(),
      updatedAt: floor.updatedAt.toISOString(),
    }));
  }

  async createFloor(input: CreateFloorInput): Promise<FloorDTO> {
    await this.restaurantsService.validateRestaurant(input.restaurantId);

    const created = await this.prisma.floor.create({
      data: {
        restaurantId: input.restaurantId,
        name: input.name.trim(),
        sortOrder:
          input.sortOrder ??
          (await this.prisma.floor.count({
            where: { restaurantId: input.restaurantId },
          })),
      },
    });

    return {
      id: created.id,
      name: created.name,
      sortOrder: created.sortOrder,
      restaurantId: created.restaurantId,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async updateFloor(floorId: string, restaurantId: string, input: UpdateFloorInput): Promise<FloorDTO> {
    const existing = await this.prisma.floor.findFirst({
      where: { id: floorId, restaurantId },
    });

    if (!existing) {
      throw new NotFoundException('Floor not found');
    }

    const updated = await this.prisma.floor.update({
      where: { id: floorId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      sortOrder: updated.sortOrder,
      restaurantId: updated.restaurantId,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteFloor(floorId: string, restaurantId: string): Promise<FloorDTO> {
    const existing = await this.prisma.floor.findFirst({
      where: { id: floorId, restaurantId },
      include: {
        tables: {
          select: { id: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Floor not found');
    }

    if (existing.tables.length > 0) {
      throw new ConflictException('Cannot delete a floor that still has tables');
    }

    const deleted = await this.prisma.floor.delete({
      where: { id: floorId },
    });

    return {
      id: deleted.id,
      name: deleted.name,
      sortOrder: deleted.sortOrder,
      restaurantId: deleted.restaurantId,
      createdAt: deleted.createdAt.toISOString(),
      updatedAt: deleted.updatedAt.toISOString(),
    };
  }

  async createTable(input: CreateTableInput, requestUrl?: RequestUrlContext): Promise<TableDTO> {
    await this.restaurantsService.validateRestaurant(input.restaurantId);
    const resolvedFloorId = await this.resolveFloorId(
      input.restaurantId,
      input.floorId ?? null,
      input.floorName ?? null,
    );

    const existing = await this.prisma.table.findFirst({
      where: {
        restaurantId: input.restaurantId,
        number: input.number,
      },
    });

    if (existing) {
      throw new ConflictException('Table number already exists for this restaurant');
    }

    const created = await this.prisma.table.create({
      data: {
        restaurantId: input.restaurantId,
        number: input.number,
        capacity: input.capacity,
        status: input.status ?? TableStatus.AVAILABLE,
        floorId: resolvedFloorId,
        posX: input.posX ?? null,
        posY: input.posY ?? null,
        shape: input.shape ?? 'round',
        qrPayload: '',
        qrCodeUrl: '',
      },
      include: { floor: true },
    });

    return this.toTableDto(created, requestUrl);
  }

  async listTables(restaurantId: string, requestUrl?: RequestUrlContext): Promise<TableDTO[]> {
    await this.restaurantsService.validateRestaurant(restaurantId);

    const tables = await this.prisma.table.findMany({
      where: { restaurantId },
      include: { floor: true },
      orderBy: { number: 'asc' },
    });

    return Promise.all(tables.map((table) => this.toTableDto(table, requestUrl)));
  }

  async findById(
    tableId: string,
    restaurantId: string,
    requestUrl?: RequestUrlContext,
  ): Promise<TableDTO> {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, restaurantId },
      include: { floor: true },
    });

    if (!table) {
      throw new NotFoundException('Table not found');
    }

    return this.toTableDto(table, requestUrl);
  }

  async updateTable(
    tableId: string,
    restaurantId: string,
    input: UpdateTableInput,
    requestUrl?: RequestUrlContext,
  ): Promise<TableDTO> {
    const existing = await this.prisma.table.findFirst({
      where: { id: tableId, restaurantId },
    });

    if (!existing) {
      throw new NotFoundException('Table not found');
    }

    if (input.number && input.number !== existing.number) {
      const duplicate = await this.prisma.table.findFirst({
        where: {
          restaurantId: existing.restaurantId,
          number: input.number,
          id: { not: existing.id },
        },
      });

      if (duplicate) {
        throw new ConflictException('Table number already exists for this restaurant');
      }
    }

    const resolvedFloorId =
      input.floorId !== undefined || input.floorName !== undefined
        ? await this.resolveFloorId(
            existing.restaurantId,
            input.floorId ?? null,
            input.floorName ?? null,
          )
        : undefined;

    const table = await this.prisma.table.update({
      where: { id: tableId },
      data: {
        number: input.number,
        capacity: input.capacity,
        status: input.status,
        ...(resolvedFloorId !== undefined ? { floorId: resolvedFloorId } : {}),
        posX: input.posX,
        posY: input.posY,
        shape: input.shape,
      },
      include: { floor: true },
    });

    return this.toTableDto(table, requestUrl);
  }

  async deleteTable(tableId: string, restaurantId: string): Promise<TableDTO> {
    const existing = await this.prisma.table.findFirst({
      where: { id: tableId, restaurantId },
      include: {
        orders: {
          where: {
            status: {
              in: [
                OrderStatus.PENDING,
                OrderStatus.PREPARING,
                OrderStatus.READY,
                OrderStatus.DELIVERED,
              ],
            },
          },
          select: { id: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Table not found');
    }

    if (existing.orders.length > 0) {
      throw new ConflictException('Cannot delete a table with active orders');
    }

    const deleted = await this.prisma.table.delete({
      where: { id: tableId },
      include: { floor: true },
    });

    return this.toTableDto(deleted);
  }

  private buildQrPayload(restaurantId: string, tableId: string, requestUrl?: RequestUrlContext) {
    const normalizedBaseUrl = this.resolveCustomerAppUrl(requestUrl);

    return `${normalizedBaseUrl}/?restaurantId=${restaurantId}&tableId=${tableId}`;
  }

  private resolveCustomerAppUrl(requestUrl?: RequestUrlContext) {
    const configured =
      this.configService.get<string>('CUSTOMER_APP_URL') ?? 'http://localhost:3001';
    const configuredUrl = new URL(configured);
    const browserOrigin = this.firstHeaderValue(requestUrl?.customerAppOrigin);
    const host = this.firstHeaderValue(requestUrl?.forwardedHost) ?? this.firstHeaderValue(requestUrl?.host);

    if (browserOrigin) {
      return this.normalizeCustomerOrigin(browserOrigin, configuredUrl);
    }

    if (this.shouldUseConfiguredCustomerUrl(configuredUrl)) {
      return this.normalizeConfiguredCustomerUrl(configuredUrl);
    }

    if (!host) {
      return `${configuredUrl.protocol}//${this.withCustomerPort(this.getLanAddress() ?? configuredUrl.hostname, configuredUrl)}`;
    }

    const protocol =
      this.firstHeaderValue(requestUrl?.forwardedProto) ??
      this.firstHeaderValue(requestUrl?.protocol) ??
      configuredUrl.protocol.replace(':', '');

    return `${protocol}://${this.normalizeCustomerHost(host, configuredUrl)}`.replace(/\/$/, '');
  }

  private normalizeCustomerHost(host: string, configuredUrl: URL) {
    const value = host.split(',')[0]?.trim() ?? host.trim();

    if (
      value === 'admin.localhost' ||
      value === 'pos.localhost' ||
      value === 'kitchen.localhost' ||
      value === 'waiter.localhost'
    ) {
      return this.withCustomerPort(this.getLanAddress() ?? 'localhost', configuredUrl);
    }

    try {
      const parsed = new URL(`http://${value}`);
      const hostname = this.isLocalHost(parsed.hostname) || this.isVirtualInterfaceAddress(parsed.hostname)
        ? this.getLanAddress() ?? parsed.hostname
        : parsed.hostname;

      return this.withCustomerPort(hostname, configuredUrl);
    } catch (error) {
      this.logger.warn(`Failed to normalize configured customer URL: ${(error as Error).message}`);
      return value;
    }
  }

  private firstHeaderValue(value?: string) {
    return value?.split(',')[0]?.trim();
  }

  private normalizeCustomerOrigin(origin: string, configuredUrl: URL) {
    try {
      const parsed = new URL(origin);
      const hostname =
        this.isLocalHost(parsed.hostname) || this.isVirtualInterfaceAddress(parsed.hostname)
          ? this.getLanAddress() ?? parsed.hostname
          : parsed.hostname;

      return `${parsed.protocol}//${this.withCustomerPort(hostname, configuredUrl)}`.replace(/\/$/, '');
    } catch (error) {
      this.logger.warn(`Failed to normalize customer origin: ${(error as Error).message}`);
      return this.normalizeConfiguredCustomerUrl(configuredUrl);
    }
  }

  private shouldUseConfiguredCustomerUrl(configuredUrl: URL) {
    const hostname = configuredUrl.hostname;

    return !this.isLocalHost(hostname) && !this.isPrivateIpv4(hostname);
  }

  private withCustomerPort(hostname: string, configuredUrl: URL) {
    const port = configuredUrl.port || CUSTOMER_APP_PORT;

    if (!port) {
      return hostname;
    }

    return `${hostname}:${port}`;
  }

  private normalizeConfiguredCustomerUrl(configuredUrl: URL) {
    const port = configuredUrl.port || CUSTOMER_APP_PORT;
    const host = port ? `${configuredUrl.hostname}:${port}` : configuredUrl.hostname;

    return `${configuredUrl.protocol}//${host}`.replace(/\/$/, '');
  }

  private isLocalHost(hostname: string) {
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname === '::1';
  }

  private getLanAddress() {
    const envHostIp = this.configService.get<string>('HOST_IP');
    const detectedLanAddress = this.detectLanAddress();

    if (detectedLanAddress) {
      this.cachedLanAddress = detectedLanAddress;
      return detectedLanAddress;
    }

    if (this.cachedLanAddress) {
      return this.cachedLanAddress;
    }

    const sharedInfo = this.readSharedNetworkInfo();
    return sharedInfo?.hostIp?.trim() || envHostIp?.trim() || null;
  }

  private detectLanAddress() {
    const interfaces = networkInterfaces();
    const candidates = Object.entries(interfaces)
      .flatMap(([name, addresses]) =>
        (addresses ?? []).map((address) => ({
          ...address,
          name,
          score: this.scoreNetworkAddress(name, address.address),
        })),
      )
      .filter((entry) => entry.family === 'IPv4' && !entry.internal && this.isUsableLanAddress(entry.name, entry.address))
      .sort((a, b) => b.score - a.score);

    const preferred = candidates.find((entry) => entry.score > 0);

    if (preferred) {
      return preferred.address;
    }

    return null;
  }

  private scoreNetworkAddress(interfaceName: string, address: string) {
    const name = interfaceName.toLowerCase();
    const isVirtualInterface = this.isVirtualInterfaceName(name);

    if (isVirtualInterface) {
      return -10;
    }

    if (address.startsWith('192.168.')) {
      return 30;
    }

    if (address.startsWith('10.')) {
      return 20;
    }

    if (this.isPrivateIpv4(address) && !this.isDockerRangeIpv4(address)) {
      return 10;
    }

    return 0;
  }

  private normalizeClientHost(clientHost?: string) {
    const value = clientHost?.trim();

    if (
      value &&
      this.isPrivateIpv4(value) &&
      !this.isLocalHost(value) &&
      !this.isDockerRangeIpv4(value) &&
      !this.isVirtualInterfaceAddress(value)
    ) {
      return value;
    }

    return null;
  }

  private isUsableLanAddress(interfaceName: string, address: string) {
    return (
      this.isPrivateIpv4(address) &&
      !this.isLocalHost(address) &&
      !this.isDockerRangeIpv4(address) &&
      !this.isVirtualInterfaceName(interfaceName)
    );
  }

  private isVirtualInterfaceAddress(address: string) {
    const interfaces = networkInterfaces();

    return Object.entries(interfaces).some(([name, addresses]) => {
      if (!this.isVirtualInterfaceName(name)) {
        return false;
      }

      return addresses?.some((entry) => entry.family === 'IPv4' && entry.address === address) ?? false;
    });
  }

  private isVirtualInterfaceName(interfaceName: string) {
    const name = interfaceName.toLowerCase();

    return (
      name.includes('docker') ||
      name.includes('wsl') ||
      name.includes('vethernet') ||
      name.includes('hyper-v') ||
      name.includes('virtualbox') ||
      name.includes('vmware') ||
      name.includes('loopback') ||
      name.includes('virtual') ||
      name.includes('vpn') ||
      name.includes('tap') ||
      name.includes('tun') ||
      name.includes('npcap') ||
      name.includes('tailscale') ||
      name.includes('zerotier') ||
      name.includes('hamachi') ||
      name.includes('wireguard') ||
      name.includes('openvpn') ||
      name.includes('forticlient') ||
      name.includes('anyconnect')
    );
  }

  private isDockerRangeIpv4(value: string) {
    const parts = value.split('.').map((part) => Number(part));

    if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part))) {
      return false;
    }

    const first = parts[0]!;
    const second = parts[1]!;

    return first === 172 && second >= 16 && second <= 31;
  }

  private isPrivateIpv4(value: string) {
    const parts = value.split('.').map((part) => Number(part));

    if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
      return false;
    }

    const first = parts[0]!;
    const second = parts[1]!;

    return (
      first === 10 ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 169 && second === 254)
    );
  }

  private async buildQrCodeUrl(table: Table, requestUrl?: RequestUrlContext) {
    const qrPayload = this.buildQrPayload(table.restaurantId, table.id, requestUrl);
    return QRCode.toDataURL(qrPayload, {
      type: 'image/png',
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 320,
    });
  }

  private async resolveFloorId(
    restaurantId: string,
    floorId: string | null,
    floorName: string | null,
  ) {
    if (floorId) {
      return floorId;
    }

    const normalizedName = floorName?.trim();
    if (!normalizedName) {
      return null;
    }

    const existing = await this.prisma.floor.findFirst({
      where: {
        restaurantId,
        name: normalizedName,
      },
    });

    if (existing) {
      return existing.id;
    }

    const count = await this.prisma.floor.count({
      where: { restaurantId },
    });

    const created = await this.prisma.floor.create({
      data: {
        restaurantId,
        name: normalizedName,
        sortOrder: count,
      },
    });

    return created.id;
  }

  private async toTableDto(table: Table & { floor?: { id: string; name: string } | null }, requestUrl?: RequestUrlContext): Promise<TableDTO> {
    const qrPayload = this.buildQrPayload(table.restaurantId, table.id, requestUrl);
    const qrCodeUrl = await this.buildQrCodeUrl(table, requestUrl);

    return {
      id: table.id,
      number: table.number,
      capacity: table.capacity,
      status: table.status,
      floorId: table.floorId ?? null,
      floorName: table.floor?.name ?? null,
      posX: table.posX ?? null,
      posY: table.posY ?? null,
      shape: table.shape === 'square' ? 'square' : 'round',
      restaurantId: table.restaurantId,
      qrPayload,
      qrCodeUrl,
      createdAt: table.createdAt.toISOString(),
    };
  }
}
