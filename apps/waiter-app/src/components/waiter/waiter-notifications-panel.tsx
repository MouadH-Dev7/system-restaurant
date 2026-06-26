'use client';

import { useMemo, useState } from 'react';
import { BellRing, CheckCircle2, Clock3, Loader2, MapPin, PartyPopper } from 'lucide-react';
import { useAuthStore } from '@/auth/store';
import { getApiErrorMessage } from '@/lib/api-error';
import { formatTime } from '@/lib/format';
import { waiterDir } from '@/lib/i18n';
import { acceptWaiterNotification, resolveWaiterNotification } from '@/services/waiter-notifications.service';
import { type WaiterLanguage, useWaiterStore } from '@/store/waiter.store';

function getNotificationMessage(notification: any, language: WaiterLanguage) {
  if (notification.type === 'CALL_WAITER') {
    if (language === 'ar') {
      return `الطاولة ${notification.tableNumber} تطلب نادلاً`;
    }
    if (language === 'fr') {
      return `La table ${notification.tableNumber} appelle un serveur`;
    }
    return `Table ${notification.tableNumber} is calling a waiter`;
  }
  if (notification.type === 'ORDER_READY_FOR_DELIVERY') {
    const dailyOrderNumber =
      notification.metadata?.displayOrderId ?? notification.metadata?.dailyOrderNumber ?? '';
    if (language === 'ar') {
      return `الطلب #${dailyOrderNumber} جاهز للطاولة ${notification.tableNumber}`;
    }
    if (language === 'fr') {
      return `La commande #${dailyOrderNumber} est prête pour la table ${notification.tableNumber}`;
    }
    return `Order #${dailyOrderNumber} is ready for table ${notification.tableNumber}`;
  }
  if (notification.type === 'ORDER_READY_FOR_PICKUP') {
    const dailyOrderNumber =
      notification.metadata?.displayOrderId ?? notification.metadata?.dailyOrderNumber ?? '';
    if (language === 'ar') {
      return `الطلب الخارجي #${dailyOrderNumber} جاهز، خذه إلى الكاشير`;
    }
    if (language === 'fr') {
      return `La commande externe #${dailyOrderNumber} est prete, apportez-la a la caisse`;
    }
    return `External order #${dailyOrderNumber} is ready, bring it to cashier pickup`;
  }
  return notification.message;
}

function localizeNotificationItemName(item: any, language: WaiterLanguage) {
  if (language === 'ar') {
    return item.nameAr ?? item.name;
  }
  if (language === 'fr') {
    return item.nameFr ?? item.nameEn ?? item.name;
  }
  return item.nameEn ?? item.name;
}

function localizeNotificationModifierName(mod: any, language: WaiterLanguage) {
  const groupName =
    language === 'ar'
      ? mod.groupNameAr ?? mod.groupName
      : language === 'fr'
        ? mod.groupNameFr ?? mod.groupNameEn ?? mod.groupName
        : mod.groupNameEn ?? mod.groupName;

  const optionName =
    language === 'ar'
      ? mod.optionNameAr ?? mod.optionName
      : language === 'fr'
        ? mod.optionNameFr ?? mod.optionNameEn ?? mod.optionName
        : mod.optionNameEn ?? mod.optionName;

  return groupName ? `${groupName}: ${optionName}` : optionName;
}

function badgeTone(status: 'PENDING' | 'ACCEPTED' | 'RESOLVED') {
  switch (status) {
    case 'ACCEPTED':
      return 'bg-emerald-100 text-emerald-700';
    case 'RESOLVED':
      return 'bg-slate-200 text-slate-700';
    default:
      return 'bg-amber-100 text-amber-700';
  }
}

function panelCopy(language: WaiterLanguage) {
  if (language === 'ar') {
    return {
      notifications: 'الاشعارات',
      title: 'اشعارات النادل',
      description: 'نداءات الزبائن والطلبات الجاهزة للتقديم تظهر هنا لجميع الندلاء.',
      unread: 'المفتوحة',
      empty: 'لا توجد اشعارات حاليا',
      emptyHint: 'ستظهر هنا تلقائيا نداءات الزبائن والطلبات الجاهزة.',
      customerCall: 'نداء زبون',
      deliveryRequest: 'طلب تقديم',
      pickupRequest: 'طلب استلام',
      pending: 'قيد الانتظار',
      accepted: 'تم القبول',
      resolved: 'تم الانهاء',
      accept: 'قبول',
      resolve: 'انهاء',
      acceptedBy: 'تم القبول من {{name}}',
      failed: 'تعذر تحديث الاشعار',
      table: 'طاولة',
    };
  }

  if (language === 'fr') {
    return {
      notifications: 'Notifications',
      title: 'Notifications Serveur',
      description: 'Les appels client et les commandes pretes a servir apparaissent ici pour tous les serveurs.',
      unread: 'Ouvertes',
      empty: 'Aucune notification pour le moment',
      emptyHint: 'Les nouveaux appels client et commandes pretes apparaitront ici automatiquement.',
      customerCall: 'Appel client',
      deliveryRequest: 'Commande a servir',
      pickupRequest: 'Commande a remettre',
      pending: 'En attente',
      accepted: 'Acceptee',
      resolved: 'Resolue',
      accept: 'Accepter',
      resolve: 'Terminer',
      acceptedBy: 'Acceptee par {{name}}',
      failed: 'Impossible de mettre a jour la notification',
      table: 'Table',
    };
  }

  return {
    notifications: 'Notifications',
    title: 'Waiter Notifications',
    description: 'Customer calls and ready-to-deliver requests appear here for all waiters.',
    unread: 'Open',
    empty: 'No notifications right now',
    emptyHint: 'New customer calls and ready orders will appear here automatically.',
    customerCall: 'Customer Call',
    deliveryRequest: 'Delivery Request',
    pickupRequest: 'Pickup Request',
    pending: 'Pending',
    accepted: 'Accepted',
    resolved: 'Resolved',
    accept: 'Accept',
    resolve: 'Mark Done',
    acceptedBy: 'Accepted by {{name}}',
    failed: 'Could not update the notification',
    table: 'Table',
  };
}

function statusLabel(language: WaiterLanguage, status: 'PENDING' | 'ACCEPTED' | 'RESOLVED') {
  const t = panelCopy(language);
  switch (status) {
    case 'ACCEPTED':
      return t.accepted;
    case 'RESOLVED':
      return t.resolved;
    default:
      return t.pending;
  }
}

export function WaiterNotificationsPanel() {
  const session = useAuthStore((state) => state.session);
  const language = useWaiterStore((state) => state.language);
  const notifications = useWaiterStore((state) => state.waiterNotifications);
  const markNotificationRead = useWaiterStore((state) => state.markNotificationRead);
  const upsertWaiterNotification = useWaiterStore((state) => state.upsertWaiterNotification);
  const t = panelCopy(language);
  const dir = waiterDir(language);
  const currentUserId = session?.user.id ?? null;
  const isAdmin = session?.user.role === 'ADMIN';
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const visibleNotifications = useMemo(
    () =>
      notifications.filter(
        (notification) =>
          notification.status !== 'RESOLVED' &&
          (isAdmin ||
            notification.status !== 'ACCEPTED' ||
            notification.acceptedByUserId === currentUserId),
      ),
    [currentUserId, isAdmin, notifications],
  );

  async function handleAccept(notificationId: string) {
    setBusyId(notificationId);
    setError(null);
    try {
      const updated = await acceptWaiterNotification(notificationId);
      upsertWaiterNotification(updated);
      markNotificationRead(notificationId);
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t.failed));
    } finally {
      setBusyId(null);
    }
  }

  async function handleResolve(notificationId: string) {
    setBusyId(notificationId);
    setError(null);
    try {
      const updated = await resolveWaiterNotification(notificationId);
      upsertWaiterNotification(updated);
      markNotificationRead(notificationId);
    } catch (nextError) {
      setError(getApiErrorMessage(nextError, t.failed));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section
      dir={dir}
      className="flex min-h-0 flex-1 flex-col rounded-[28px] border border-[#ead4c2] bg-white/82 px-5 py-5 shadow-[0_18px_40px_rgba(116,58,28,0.08)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-[#b55229]">
            {t.notifications}
          </p>
          <h2 className="mt-2 text-2xl font-black text-slate-950">{t.title}</h2>
          <p className="mt-2 text-sm text-slate-500">{t.description}</p>
        </div>
        <div className="rounded-[18px] bg-[#fff4ec] px-4 py-3 text-center">
          <p className="text-xs text-slate-500">{t.unread}</p>
          <p className="mt-1 text-2xl font-black text-[#8d2d0e]">{visibleNotifications.length}</p>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mt-5 flex-1 space-y-4 overflow-y-auto pr-1">
        {visibleNotifications.length === 0 ? (
          <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-[28px] border border-dashed border-[#dcc6b5] bg-[#fff9f4] px-5 py-10 text-center">
            <PartyPopper className="h-10 w-10 text-[#c77b52]" />
            <p className="mt-4 text-lg font-bold text-slate-900">{t.empty}</p>
            <p className="mt-2 text-sm text-slate-500">{t.emptyHint}</p>
          </div>
        ) : (
          visibleNotifications.map((notification) => {
            const isBusy = busyId === notification.id;
            const canAccept = notification.status === 'PENDING';
            const canResolve =
              notification.status === 'ACCEPTED' &&
              (isAdmin || notification.acceptedByUserId === currentUserId);

            return (
              <article
                key={notification.id}
                className="rounded-[24px] border border-[#ead7c8] bg-white px-5 py-5 shadow-[0_12px_30px_rgba(116,58,28,0.06)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#fff0e8] px-3 py-1 text-xs font-bold text-[#a84b20]">
                        {notification.type === 'CALL_WAITER'
                          ? t.customerCall
                          : notification.type === 'ORDER_READY_FOR_PICKUP'
                            ? t.pickupRequest
                            : t.deliveryRequest}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${badgeTone(notification.status)}`}
                      >
                        {statusLabel(language, notification.status)}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-slate-950">{getNotificationMessage(notification, language)}</h3>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-500">
                      {notification.tableNumber ? (
                        <span className="inline-flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {t.table} {notification.tableNumber}
                        </span>
                      ) : null}
                      <span className="inline-flex items-center gap-2">
                        <Clock3 className="h-4 w-4" />
                        {formatTime(notification.createdAt, language)}
                      </span>
                    </div>
                    {notification.acceptedByUserName ? (
                      <p className="mt-3 text-sm text-emerald-700">
                        {t.acceptedBy.replace('{{name}}', notification.acceptedByUserName)}
                      </p>
                    ) : null}

                    {/* Render order details if metadata items are present */}
                    {notification.metadata?.items && notification.metadata.items.length > 0 && (
                      <div className="mt-4 rounded-[16px] border border-[#ead7c8] bg-[#fffdfb] p-3 text-sm">
                        <p className="font-bold text-[#b55229] mb-2 flex items-center gap-2">
                          <span>
                            {language === 'ar'
                              ? 'تفاصيل الطلب:'
                              : language === 'fr'
                                ? 'Détails de la commande:'
                                : 'Order Details:'}
                          </span>
                          <span className="text-xs font-normal text-slate-500">
                            ({notification.metadata.totalItems || notification.metadata.items.length}{' '}
                            {language === 'ar'
                              ? 'عناصر'
                              : language === 'fr'
                                ? 'articles'
                                : 'items'})
                          </span>
                        </p>
                        <ul className="space-y-2 divide-y divide-dashed divide-[#ead7c8]/60">
                          {notification.metadata.items.map((item: any, index: number) => {
                            const itemName = localizeNotificationItemName(item, language);
                            return (
                              <li key={index} className={`text-slate-700 ${index > 0 ? 'pt-2' : ''}`}>
                                <div className="flex justify-between items-start gap-2">
                                  <span className="font-semibold text-slate-900">
                                    {item.quantity} x {itemName}
                                  </span>
                                </div>
                                {item.modifiers && item.modifiers.length > 0 && (
                                  <span className="block text-xs text-slate-500 mt-1 ps-4">
                                    {item.modifiers
                                      .map((mod: any) => localizeNotificationModifierName(mod, language))
                                      .join(' | ')}
                                  </span>
                                )}
                                {item.notes && (
                                  <span className="block text-xs text-rose-600 font-medium mt-1 ps-4 italic">
                                    {language === 'ar' ? `ملاحظة: ${item.notes}` : language === 'fr' ? `Note: ${item.notes}` : `Note: ${item.notes}`}
                                  </span>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>

                  <BellRing className="h-5 w-5 shrink-0 text-[#c77b52]" />
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {canAccept ? (
                    <button
                      type="button"
                      onClick={() => void handleAccept(notification.id)}
                      disabled={isBusy}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-[18px] bg-[#8d2d0e] px-5 text-sm font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      {t.accept}
                    </button>
                  ) : null}

                  {canResolve ? (
                    <button
                      type="button"
                      onClick={() => void handleResolve(notification.id)}
                      disabled={isBusy}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-[18px] border border-[#d9c2af] bg-[#fff8f2] px-5 text-sm font-bold text-slate-700 transition hover:bg-[#f7ede2] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      {t.resolve}
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
