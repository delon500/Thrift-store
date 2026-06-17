// Pure decision logic for the admin surface — extracted from the controllers so
// the business rules are explicit and unit-testable without a DB. Each *Error
// helper returns null when the action is allowed, or { status, message }.

export const USER_STATUSES = ["pending", "approved", "rejected", "suspended"];

// Parses limit/offset query params. No (or invalid) limit means "return all".
export const parsePagination = (query = {}) => {
  const limit = Number(query.limit);
  if (!Number.isFinite(limit) || limit < 1) {
    return { limit: null, offset: 0 };
  }

  const rawOffset = Number(query.offset);
  const offset = Number.isFinite(rawOffset) && rawOffset > 0 ? rawOffset : 0;
  return { limit, offset };
};

// Editing a user / changing their status.
export const userUpdateError = ({ status, isSelf }) => {
  if (status && !USER_STATUSES.includes(status)) {
    return { status: 400, message: "Invalid status" };
  }
  if (status && status !== "approved" && isSelf) {
    return { status: 400, message: "You cannot deactivate your own account" };
  }
  return null;
};

// Hard-deleting a user.
export const userDeleteError = ({ isSelf, hasOrders }) => {
  if (isSelf) {
    return { status: 400, message: "You cannot delete your own account" };
  }
  if (hasOrders) {
    return {
      status: 409,
      message: "This user has orders. Suspend them instead of deleting.",
    };
  }
  return null;
};

// Cancelling an order (releases held products).
export const orderCancelError = (status) => {
  if (status === "collected") {
    return { status: 409, message: "A collected order cannot be cancelled" };
  }
  if (["cancelled", "expired"].includes(status)) {
    return { status: 409, message: `Order is already ${status}` };
  }
  return null;
};

// Deleting an institution.
export const institutionDeleteError = ({ hasUsers, hasProducts }) => {
  if (hasUsers) {
    return {
      status: 409,
      message: "This institution has users. Remove or reassign them first.",
    };
  }
  if (hasProducts) {
    return {
      status: 409,
      message: "This institution has products. Remove them first.",
    };
  }
  return null;
};

// Refunding an order.
export const orderRefundError = ({ status, paymentStatus }) => {
  if (paymentStatus !== "paid") {
    return { status: 400, message: "Only paid orders can be refunded" };
  }
  if (status === "collected") {
    return {
      status: 409,
      message: "Order was already collected; handle this as a manual dispute",
    };
  }
  return null;
};
