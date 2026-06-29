"use strict";

const OrderType = {
  DINE_IN: "DINE_IN",
  TAKEAWAY: "TAKEAWAY",
  DELIVERY: "DELIVERY",
};

const REALTIME_EVENTS = {
  ORDER_CREATED: "ORDER_CREATED",
  ORDER_PREPARING: "ORDER_PREPARING",
  ORDER_READY: "ORDER_READY",
  ORDER_DELIVERED: "ORDER_DELIVERED",
  ORDER_PAID: "ORDER_PAID",
  ORDER_CANCELLED: "ORDER_CANCELLED",
  CALL_WAITER: "CALL_WAITER",
};

const REDIS_ORDER_CHANNELS = {
  CREATED: "orders.created",
  PREPARING: "orders.preparing",
  READY: "orders.ready",
  DELIVERED: "orders.delivered",
  PAID: "orders.paid",
  CANCELLED: "orders.cancelled",
};

function restaurantRoom(restaurantId) {
  return `restaurant:${restaurantId}`;
}

function tableRoom(restaurantId, tableId) {
  return `restaurant:${restaurantId}:table:${tableId}`;
}

function isWalkInOrder(order) {
  if (order.orderType) {
    return order.orderType === OrderType.TAKEAWAY;
  }

  return false;
}

function getOrderTypeLabel(order) {
  if (order.orderType === OrderType.DELIVERY) {
    return {
      type: "external",
      label: "Delivery",
      shortLabel: "Delivery",
    };
  }

  if (isWalkInOrder(order)) {
    return {
      type: "external",
      label: "Takeaway",
      shortLabel: "Takeaway",
    };
  }

  const number = order.table?.number ?? 0;
  return {
    type: "table",
    label: `Table ${number}`,
    shortLabel: `T${number}`,
  };
}

const CSRF_CONFIG = Object.freeze({
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

module.exports = {
  CSRF_CONFIG,
  OrderType,
  REALTIME_EVENTS,
  REDIS_ORDER_CHANNELS,
  restaurantRoom,
  tableRoom,
  isWalkInOrder,
  getOrderTypeLabel,
};
