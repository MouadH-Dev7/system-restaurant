import { CustomersController } from './customers/customers.controller';
import { InventoryController } from './inventory/inventory.controller';
import { MenuController } from './menu/menu.controller';
import { OrdersController } from './orders/orders.controller';
import { PrintersController } from './printers/printers.controller';
import { ReportsController } from './reports/reports.controller';
import { SettingsController } from './settings/settings.controller';
import { TablesController } from './tables/tables.controller';
import { UsersController } from './users/users.controller';

const user = {
  sub: 'user-1',
  sessionId: 'session-1',
  name: 'Admin',
  email: 'admin@demo.local',
  staffCode: 'ADM001',
  role: 'ADMIN' as const,
  restaurantId: 'jwt-restaurant-id',
  isActive: true,
};

describe('Protected endpoints ignore body restaurantId', () => {
  it('users controller injects restaurantId from JWT', () => {
    const usersService = { create: jest.fn() };
    const controller = new UsersController(usersService as any);

    controller.create({ name: 'Test', staffCode: 'USR001', password: 'Password123!', role: 'ADMIN', restaurantId: 'body-restaurant-id' } as any, user);

    expect(usersService.create).toHaveBeenCalledWith(
      expect.objectContaining({ restaurantId: 'jwt-restaurant-id' }),
    );
  });

  it('tables controller injects restaurantId from JWT', async () => {
    const tablesService = { createTable: jest.fn() };
    const controller = new TablesController(tablesService as any, {} as any, {} as any, {} as any);

    await controller.create(
      { number: 1, capacity: 4, restaurantId: 'body-restaurant-id' } as any,
      { headers: { host: 'localhost:4000' }, protocol: 'http' } as any,
      user,
    );

    expect(tablesService.createTable).toHaveBeenCalledWith(
      expect.objectContaining({ restaurantId: 'jwt-restaurant-id' }),
      expect.any(Object),
    );
  });

  it('menu controller injects restaurantId from JWT', async () => {
    const menuService = {
      createMenu: jest.fn(),
      createMenuItem: jest.fn(),
      createModifierGroup: jest.fn(),
      createModifierOption: jest.fn(),
    };
    const controller = new MenuController(menuService as any);

    await controller.createMenu({ name: 'Main', restaurantId: 'body-restaurant-id' } as any, user);
    await controller.createMenuItem(
      { name: 'Dish', menuId: 'menu-1', price: 10, restaurantId: 'body-restaurant-id' } as any,
      user,
    );
    await controller.createModifierGroup(
      { name: 'Extras', menuItemId: 'item-1', restaurantId: 'body-restaurant-id' } as any,
      user,
    );
    await controller.createModifierOption(
      { name: 'Cheese', groupId: 'group-1', restaurantId: 'body-restaurant-id' } as any,
      user,
    );

    expect(menuService.createMenu).toHaveBeenCalledWith(expect.objectContaining({ restaurantId: 'jwt-restaurant-id' }));
    expect(menuService.createMenuItem).toHaveBeenCalledWith(expect.objectContaining({ restaurantId: 'jwt-restaurant-id' }));
    expect(menuService.createModifierGroup).toHaveBeenCalledWith(expect.objectContaining({ restaurantId: 'jwt-restaurant-id' }));
    expect(menuService.createModifierOption).toHaveBeenCalledWith(expect.objectContaining({ restaurantId: 'jwt-restaurant-id' }));
  });

  it('inventory controller injects restaurantId from JWT', () => {
    const inventoryService = { create: jest.fn() };
    const controller = new InventoryController(inventoryService as any);

    controller.create({ name: 'Oil', unit: 'L', stockLevel: 1, minAlertLevel: 1, unitPrice: 1, restaurantId: 'body-restaurant-id' } as any, user);

    expect(inventoryService.create).toHaveBeenCalledWith(
      expect.objectContaining({ restaurantId: 'jwt-restaurant-id' }),
    );
  });

  it('settings controller injects restaurantId from JWT', () => {
    const settingsService = { upsert: jest.fn() };
    const controller = new SettingsController(settingsService as any);

    controller.upsert({ restaurantName: 'R', contactPhone: '1', businessAddress: 'A', openingHours: '08:00', closingHours: '22:00', currency: 'DZD', salesTax: 0, language: 'en', direction: 'ltr', locale: 'en-US', dateFormat: 'dd/MM/yyyy', acceptsCash: true, acceptsCard: true, acceptsQrOrdering: true, stripeEnabled: false, whatsappEnabled: false, smtpEnabled: false, restaurantId: 'body-restaurant-id' } as any, user);

    expect(settingsService.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ restaurantId: 'jwt-restaurant-id' }),
    );
  });

  it('printers controller injects restaurantId from JWT', () => {
    const printersService = { create: jest.fn() };
    const controller = new PrintersController(printersService as any);

    controller.create({ name: 'Printer', ipAddress: '127.0.0.1', port: 9100, type: 'RECEIPT', restaurantId: 'body-restaurant-id' } as any, user);

    expect(printersService.create).toHaveBeenCalledWith(
      expect.objectContaining({ restaurantId: 'jwt-restaurant-id' }),
    );
  });

  it('reports controller injects restaurantId from JWT', () => {
    const reportsService = { create: jest.fn() };
    const controller = new ReportsController(reportsService as any);

    controller.create({ type: 'FINANCIAL', name: 'Daily', format: 'CSV', rangeStart: '2026-06-09', rangeEnd: '2026-06-09', restaurantId: 'body-restaurant-id' } as any, user);

    expect(reportsService.create).toHaveBeenCalledWith(
      expect.objectContaining({ restaurantId: 'jwt-restaurant-id' }),
    );
  });

  it('customers controller injects restaurantId from JWT', () => {
    const customersService = { create: jest.fn() };
    const controller = new CustomersController(customersService as any);

    controller.create({ name: 'Guest', phone: '123', restaurantId: 'body-restaurant-id' } as any, user);

    expect(customersService.create).toHaveBeenCalledWith(
      expect.objectContaining({ restaurantId: 'jwt-restaurant-id' }),
    );
  });

  it('orders staff controller injects restaurantId from JWT', () => {
    const ordersService = { createStaffOrder: jest.fn() };
    const controller = new OrdersController(ordersService as any);

    controller.createStaffOrder({ tableId: 'table-1', items: [{ menuItemId: 'item-1', quantity: 1 }], restaurantId: 'body-restaurant-id' } as any, user);

    expect(ordersService.createStaffOrder).toHaveBeenCalledWith(
      user,
      expect.not.objectContaining({ restaurantId: 'body-restaurant-id' }),
    );
  });
});
