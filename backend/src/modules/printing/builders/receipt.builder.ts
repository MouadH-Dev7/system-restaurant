import {
  getOrderTypeLabel,
  type DiscountDTO,
  type OrderResponse,
  type PaymentMethod,
  type ReceiptLanguage,
} from '@repo/shared-types';

type ReceiptContext = {
  restaurantName: string;
  paymentHistory: Array<{
    amount: number;
    paymentMethod: PaymentMethod | 'UNKNOWN';
  }>;
  discounts?: DiscountDTO[];
  restaurantAddress?: string | null;
  restaurantPhone?: string | null;
  restaurantEmail?: string | null;
  footerMessage?: string | null;
  currency: string;
  language: ReceiptLanguage;
  taxAmount: number;
  subtotal: number;
  discountTotal: number;
  finalTotal: number;
  remainingAmount: number;
  printedAt: Date;
  invoiceNumber: string;
};

export type ReceiptContent = {
  title: string;
  lines: string[];
};

export class ReceiptBuilder {
  build(order: OrderResponse, context: ReceiptContext): ReceiptContent {
    const locale = context.language === 'ar' ? 'ar-DZ' : context.language === 'fr' ? 'fr-FR' : 'en-US';
    const formatMoney = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: context.currency,
      maximumFractionDigits: 0,
    });
    const formatDateTime = new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const labels = getReceiptLabels(context.language);
    const orderLabel = getOrderTypeLabel(order);

    const lines: string[] = [
      context.restaurantName,
      ...(context.restaurantAddress ? [context.restaurantAddress] : []),
      ...(context.restaurantPhone ? [`${labels.phone}: ${context.restaurantPhone}`] : []),
      ...(context.restaurantEmail ? [`${labels.email}: ${context.restaurantEmail}`] : []),
      '',
      `${labels.invoiceNumber}: ${context.invoiceNumber}`,
      `${labels.orderNumber}: ${order.displayOrderId ?? order.dailyOrderNumber}`,
      `${labels.dateTime}: ${formatDateTime.format(context.printedAt)}`,
      `${labels.orderType}: ${orderLabel.label}`,
      '',
      labels.items,
      ...order.items.flatMap((item) => {
        const itemName =
          context.language === 'ar'
            ? item.menuItem?.nameAr ?? item.menuItem?.name ?? item.menuItemId
            : context.language === 'fr'
              ? item.menuItem?.nameFr ?? item.menuItem?.nameEn ?? item.menuItem?.name ?? item.menuItemId
              : item.menuItem?.nameEn ?? item.menuItem?.name ?? item.menuItemId;
        const lineTotal = formatMoney.format(item.price * item.quantity);
        const qtyAndPrice = `${item.quantity} x ${formatMoney.format(item.price)} = ${lineTotal}`;
        const modifierLines =
          item.modifiers?.map((modifier) => {
            const optionName =
              context.language === 'ar'
                ? modifier.optionNameAr ?? modifier.optionName
                : context.language === 'fr'
                  ? modifier.optionNameFr ?? modifier.optionNameEn ?? modifier.optionName
                  : modifier.optionNameEn ?? modifier.optionName;
            return `  + ${optionName}`;
          }) ?? [];

        return [`${itemName}`, qtyAndPrice, ...modifierLines];
      }),
      '',
      `${labels.subtotal}: ${formatMoney.format(context.subtotal)}`,
      `${labels.discount}: ${formatMoney.format(context.discountTotal)}`,
      ...((context.discounts ?? []).length > 0
        ? (context.discounts ?? []).map((discount, index) => {
            const discountLabel =
              discount.type === 'PERCENTAGE' ? `${discount.value}%` : formatMoney.format(discount.value);
            return `${labels.discount} ${index + 1}: ${discountLabel}`;
          })
        : []),
      `${labels.tax}: ${formatMoney.format(context.taxAmount)}`,
      `${labels.total}: ${formatMoney.format(context.finalTotal)}`,
      ...context.paymentHistory.map(
        (entry, index) =>
          `${labels.paymentMethod} ${index + 1}: ${localizePaymentMethod(entry.paymentMethod, context.language)} - ${formatMoney.format(entry.amount)}`,
      ),
      `${labels.remaining}: ${formatMoney.format(context.remainingAmount)}`,
      '',
      context.footerMessage?.trim() || labels.thankYou,
    ];

    return {
      title: labels.receiptTitle,
      lines,
    };
  }
}

function getReceiptLabels(language: ReceiptLanguage) {
  if (language === 'ar') {
    return {
      receiptTitle: 'فاتورة الزبون',
      invoiceNumber: 'رقم الفاتورة',
      orderNumber: 'رقم الطلب',
      dateTime: 'التاريخ والوقت',
      orderType: 'نوع الطلب',
      items: 'الاصناف',
      subtotal: 'المجموع الفرعي',
      discount: 'الخصومات',
      tax: 'الضريبة',
      total: 'الاجمالي النهائي',
      paymentMethod: 'طريقة الدفع',
      remaining: 'المتبقي',
      thankYou: 'شكرا لزيارتكم',
      phone: 'الهاتف',
      email: 'البريد',
    };
  }

  if (language === 'fr') {
    return {
      receiptTitle: 'TICKET CLIENT',
      invoiceNumber: 'Facture',
      orderNumber: 'Commande',
      dateTime: 'Date et heure',
      orderType: 'Type de commande',
      items: 'Articles',
      subtotal: 'Sous-total',
      discount: 'Remises',
      tax: 'Taxe',
      total: 'Total final',
      paymentMethod: 'Paiement',
      remaining: 'Reste',
      thankYou: 'Merci pour votre visite',
      phone: 'Telephone',
      email: 'Email',
    };
  }

  return {
    receiptTitle: 'CUSTOMER RECEIPT',
    invoiceNumber: 'Invoice',
    orderNumber: 'Order',
    dateTime: 'Date & time',
    orderType: 'Order type',
    items: 'Items',
    subtotal: 'Subtotal',
    discount: 'Discounts',
    tax: 'Tax',
    total: 'Total',
    paymentMethod: 'Payment method',
    remaining: 'Remaining',
    thankYou: 'Thank you for your visit',
    phone: 'Phone',
    email: 'Email',
  };
}

function localizePaymentMethod(method: PaymentMethod | 'UNKNOWN', language: ReceiptLanguage) {
  const labels: Record<PaymentMethod | 'UNKNOWN', Record<ReceiptLanguage, string>> = {
    CASH: { ar: 'نقدا', fr: 'Especes', en: 'Cash' },
    CARD: { ar: 'بطاقة', fr: 'Carte', en: 'Card' },
    BANK_TRANSFER: { ar: 'تحويل بنكي', fr: 'Virement bancaire', en: 'Bank transfer' },
    MOBILE_PAYMENT: { ar: 'دفع عبر الهاتف', fr: 'Paiement mobile', en: 'Mobile payment' },
    UNKNOWN: { ar: 'غير محدد', fr: 'Non defini', en: 'Unknown' },
  };

  return labels[method][language];
}
