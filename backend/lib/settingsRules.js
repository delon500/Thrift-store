// Pure validation for an admin settings patch — extracted so the rules are
// explicit and unit-testable without a DB. Returns { error } when invalid, or
// { value } with the normalized subset of settings to persist.

export const validateSettingsPatch = (patch = {}, catalogIds = []) => {
  const value = {};

  if ("service_fee" in patch) {
    const fee = Number(patch.service_fee);
    if (!Number.isFinite(fee) || fee < 0 || fee > 1000) {
      return { error: "Service fee must be a number between 0 and 1000" };
    }
    value.service_fee = Math.round(fee * 100) / 100;
  }

  if ("checkout_expiry_minutes" in patch) {
    const minutes = Number(patch.checkout_expiry_minutes);
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 1440) {
      return {
        error: "Checkout expiry must be a whole number between 5 and 1440 minutes",
      };
    }
    value.checkout_expiry_minutes = minutes;
  }

  if ("enabled_payment_methods" in patch) {
    const list = patch.enabled_payment_methods;
    if (!Array.isArray(list) || list.length === 0) {
      return { error: "Enable at least one payment method" };
    }
    const unknown = list.filter((id) => !catalogIds.includes(id));
    if (unknown.length > 0) {
      return { error: `Unknown payment method(s): ${unknown.join(", ")}` };
    }
    value.enabled_payment_methods = [...new Set(list)];
  }

  if (Object.keys(value).length === 0) {
    return { error: "No valid settings to update" };
  }

  return { value };
};
