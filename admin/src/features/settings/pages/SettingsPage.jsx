import { useState } from "react";
import { toast } from "react-toastify";
import { useSettings, useUpdateSettings } from "../hooks/useSettings";
import { PageHeader } from "../../../components/shared/ui";
import { useMe } from "../../auth/hook/useAuth";

const SettingsPage = () => {
  const { data: me } = useMe();
  const canEdit = me?.role === "super_admin";

  const { data, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  // Seed the editable form from the fetched settings once they arrive. The
  // `seeded` flag stops a post-save refetch from clobbering the form.
  const [form, setForm] = useState(null);
  const [seeded, setSeeded] = useState(false);
  if (data && !seeded) {
    setSeeded(true);
    setForm({
      service_fee: String(data.settings.service_fee),
      checkout_expiry_minutes: String(data.settings.checkout_expiry_minutes),
    });
  }

  const validate = () => {
    const fee = Number(form.service_fee);
    if (!Number.isFinite(fee) || fee < 0 || fee > 1000) {
      return "Service fee must be a number between 0 and 1000";
    }
    const minutes = Number(form.checkout_expiry_minutes);
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 1440) {
      return "Checkout expiry must be a whole number between 5 and 1440 minutes";
    }
    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const error = validate();
    if (error) {
      toast.error(error);
      return;
    }
    try {
      await updateSettings.mutateAsync({
        service_fee: Number(form.service_fee),
        checkout_expiry_minutes: Number(form.checkout_expiry_minutes),
      });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not save settings");
    }
  };

  const inputClass =
    "w-40 rounded-lg border border-outline-variant bg-white px-4 py-3 text-sm outline-none focus:border-primary disabled:bg-surface-container-low disabled:text-on-surface-variant";

  if (isLoading || !form) {
    return <p className="p-6 text-on-surface-variant">Loading settings...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl">
      <PageHeader
        title="Settings"
        subtitle="Platform-wide checkout configuration."
      />

      {!canEdit ? (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Only super-admins can change these settings.
        </p>
      ) : null}

      <section className="mt-6 rounded-2xl border border-outline-variant bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-on-surface">Service fee</p>
            <p className="text-sm text-on-surface-variant">
              Flat fee (ZAR) added to every order with items.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-on-surface-variant">R</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.service_fee}
              disabled={!canEdit}
              onChange={(e) =>
                setForm((c) => ({ ...c, service_fee: e.target.value }))
              }
              className={inputClass}
            />
          </div>
        </div>

        <hr className="my-5 border-outline-variant" />

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-on-surface">Checkout expiry</p>
            <p className="text-sm text-on-surface-variant">
              Minutes a checkout holds its items before the hold lapses.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="1"
              min="5"
              max="1440"
              value={form.checkout_expiry_minutes}
              disabled={!canEdit}
              onChange={(e) =>
                setForm((c) => ({
                  ...c,
                  checkout_expiry_minutes: e.target.value,
                }))
              }
              className={inputClass}
            />
            <span className="text-on-surface-variant">min</span>
          </div>
        </div>
      </section>

      {canEdit ? (
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={updateSettings.isPending}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {updateSettings.isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      ) : null}
    </form>
  );
};

export default SettingsPage;
