import pool from "../config/db.js";
import {
  getSettings,
  invalidateSettingsCache,
  PAYMENT_METHOD_CATALOG,
} from "../services/settingsService.js";
import { validateSettingsPatch } from "../lib/settingsRules.js";
import { logActivity } from "../services/activityLog.js";

// GET /api/admin/settings — current platform settings (merged over defaults) and
// the payment-method catalog so the UI can render the enable/disable toggles.
const getAppSettings = async (_req, res) => {
  try {
    const settings = await getSettings();
    return res.json({ settings, payment_method_catalog: PAYMENT_METHOD_CATALOG });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to load settings", error: error.message });
  }
};

// PUT /api/admin/settings — update one or more settings (super_admin only).
const updateAppSettings = async (req, res) => {
  try {
    const { value, error } = validateSettingsPatch(
      req.body,
      PAYMENT_METHOD_CATALOG.map((method) => method.id),
    );
    if (error) return res.status(400).json({ message: error });

    for (const [key, val] of Object.entries(value)) {
      await pool.query(
        `INSERT INTO app_settings (key, value, updated_at, updated_by)
         VALUES ($1, $2::jsonb, now(), $3)
         ON CONFLICT (key)
         DO UPDATE SET value = EXCLUDED.value,
                       updated_at = now(),
                       updated_by = EXCLUDED.updated_by`,
        [key, JSON.stringify(val), req.user.id],
      );
    }

    invalidateSettingsCache();

    logActivity({
      action: "settings.updated",
      actorId: req.user.id,
      actorRole: req.user.role,
      entityType: "settings",
      description: `Updated settings: ${Object.keys(value).join(", ")}`,
      metadata: value,
    });

    const settings = await getSettings();
    return res.json({ message: "Settings updated", settings });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Failed to update settings", error: error.message });
  }
};

export { getAppSettings, updateAppSettings };
