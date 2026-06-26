import { OrderType } from '@repo/shared-types';
import { ReceiptBuilder } from './receipt.builder';

const builder = new ReceiptBuilder();

describe('ReceiptBuilder', () => {
  it('does not include kitchen notes in the customer receipt', () => {
    const receipt = builder.build(
      {
        id: 'order-1',
        status: 'PAID',
        orderType: OrderType.TAKEAWAY,
        source: 'CUSTOMER',
        total: 25,
        subtotal: 20,
        discountTotal: 0,
        taxTotal: 5,
        grandTotal: 25,
        paidAmount: 25,
        remainingAmount: 0,
        financialStatus: 'PAID',
        financialSummary: {
          subtotal: 20,
          discountTotal: 0,
          taxTotal: 5,
          grandTotal: 25,
          paidAmount: 25,
          remainingAmount: 0,
          financialStatus: 'PAID',
        },
        businessDate: '2026-06-13',
        dailyOrderNumber: 12,
        tableId: 'walk-in',
        restaurantId: 'restaurant-1',
        guestSessionId: 'guest-1',
        version: 1,
        lockedAt: null,
        parentOrderId: null,
        serviceTimes: {
          createdAt: '2026-06-13T10:00:00.000Z',
          acceptedAt: null,
          preparationStartedAt: null,
          readyAt: null,
          deliveredAt: null,
        },
        table: { id: 'walk-in', number: 99 },
        items: [
          {
            id: 'item-1',
            quantity: 1,
            price: 25,
            notes: 'no onion',
            orderId: 'order-1',
            menuItemId: 'menu-1',
            modifiers: [],
            menuItem: {
              id: 'menu-1',
              name: 'Burger',
              description: null,
              price: 25,
              image: null,
              available: true,
              menuId: 'menu-a',
              restaurantId: 'restaurant-1',
            },
          },
        ],
        createdAt: '2026-06-13T10:00:00.000Z',
        lastModifiedAt: '2026-06-13T10:00:00.000Z',
      },
      {
        restaurantName: 'Test Restaurant',
        paymentHistory: [{ amount: 25, paymentMethod: 'CASH' }],
        restaurantAddress: 'Center street',
        restaurantPhone: '0550000000',
        restaurantEmail: 'test@example.com',
        footerMessage: 'Thanks',
        currency: 'DZD',
        language: 'en',
        subtotal: 20,
        taxAmount: 5,
        discountTotal: 0,
        finalTotal: 25,
        remainingAmount: 0,
        printedAt: new Date('2026-06-13T10:05:00.000Z'),
        invoiceNumber: 'INV-1',
      },
    );

    expect(receipt.lines.join('\n')).not.toContain('no onion');
  });
});
