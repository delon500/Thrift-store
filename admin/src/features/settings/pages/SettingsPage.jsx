import { useState } from "react";
import { toast } from "react-toastify";
import { useSettings, useUpdateSettings } from "../hooks/useSettings";
import { useMe } from "../../auth/hook/useAuth";

const SettingsPage = () => {
  const { data: me } = useMe();
  const canEdit = me?.role === "super_admin";

  const { data, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const catalog = data?.payment_method_catalog || [];

  // Seed the editable form from the fetched settings once they arrive. The
  // `seeded` flag stops a post-save refetch from clobbering the form.
  const [form, setForm] = useState(null);
  const [seeded, setSeeded] = useState(false);
  if (data && !seeded) {
    setSeeded(true);
    setForm({
      service_fee: String(data.settings.service_fee),
      checkout_expiry_minutes: String(data.settings.checkout_expiry_minutes),
      enabled: new Set(data.settings.enabled_payment_methods),
    });
  }

  const toggleMethod = (id) => {
    setForm((current) => {
      const enabled = new Set(current.enabled);
      if (enabled.has(id)) enabled.delete(id);
      else enabled.add(id);
      return { ...current, enabled };
    });
  };

  const validate = () => {
    const fee = Number(form.service_fee);
    if (!Number.isFinite(fee) || fee < 0 || fee > 1000) {
      return "Service fee must be a number between 0 and 1000";
    }
    const minutes = Number(form.checkout_expiry_minutes);
    if (!Number.isInteger(minutes) || minutes < 5 || minutes > 1440) {
      return "Checkout expiry must be a whole number between 5 and 1440 minutes";
    }
    if (form.enabled.size === 0) {
      return "Enable at least one payment method";
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
        enabled_payment_methods: [...form.enabled],
      });
      toast.success("Settings saved");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not save settings");
    }
  };

  const inputClass =
    "w-40 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-600 disabled:bg-gray-50 disabled:text-gray-400";

  if (isLoading || !form) {
    return <p className="p-6 text-gray-500">Loading settings...</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-teal-600">Settings</h1>
        <p className="text-sm font-medium text-gray-500">
          Platform-wide checkout configuration.
        </p>
      </div>

      {!canEdit ? (
        <p className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Only super-admins can change these settings.
        </p>
      ) : null}

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-gray-800">Service fee</p>
            <p className="text-sm text-gray-500">
              Flat fee (ZAR) added to every order with items.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">R</span>
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

        <hr className="my-5 border-gray-100" />

        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-gray-800">Checkout expiry</p>
            <p className="text-sm text-gray-500">
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
            <span className="text-gray-500">min</span>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
        <p className="font-bold text-gray-800">Payment methods</p>
        <p className="text-sm text-gray-500">
          Which PayFast methods customers can choose at checkout.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {catalog.map((method) => (
            <label
              key={method.id}
              className={`flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 ${
                canEdit ? "cursor-pointer hover:bg-gray-50" : ""
              }`}
            >
              <input
                type="checkbox"
                checked={form.enabled.has(method.id)}
                disabled={!canEdit}
                onChange={() => toggleMethod(method.id)}
                className="h-4 w-4 accent-teal-600"
              />
              <span className="text-sm font-semibold text-gray-700">
                {method.label}
              </span>
            </label>
          ))}
        </div>
      </section>

      {canEdit ? (
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            disabled={updateSettings.isPending}
            className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {updateSettings.isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      ) : null}
    </form>
  );
};

export default SettingsPage;
