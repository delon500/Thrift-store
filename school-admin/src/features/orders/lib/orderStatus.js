// collection_order_status values (must match the DB enum exactly).
export const ORDER_STATUSES = [
  "ready_for_collection",
  "paid",
  "collected",
  "payment_pending",
  "payment_failed",
  "cancelled",
  "expired",
];

export const STATUS_TONE = {
  ready_for_collection: "info",
  paid: "success",
  collected: "success",
  payment_pending: "warning",
  payment_failed: "danger",
  cancelled: "neutral",
  expired: "neutral",
};

export const formatStatus = (status) =>
  status
    ? status
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "Unknown";
