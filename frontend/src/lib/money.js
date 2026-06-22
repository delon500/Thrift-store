// Single source for customer-facing currency formatting (always "R 0.00").
export const formatPrice = (value) =>
  "R " +
  Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
