import { useState } from "react";
import { toast } from "react-toastify";
import {
  useDeleteInstitution,
  useInstitutions,
  useInstitutionSettings,
  useUpdateInstitution,
  useUpdateInstitutionSettings,
} from "../hooks/useInstitutions";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import Pagination from "../../../components/shared/Pagination";
import { Badge, PageHeader } from "../../../components/shared/ui";
import { useMe } from "../../auth/hook/useAuth";

const STATUS_TONE = {
  approved: "success",
  pending: "warning",
  rejected: "danger",
  suspended: "warning",
};

const PAGE_SIZE = 10;
const STATUS_OPTIONS = ["approved", "suspended", "pending", "rejected"];
const TYPE_OPTIONS = ["public", "private", "independent"];
const CATEGORY_OPTIONS = ["school", "university"];

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" }) : "";

const inputClass =
  "rounded-md border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary";

const EditInstitutionModal = ({ institution, onClose }) => {
  const [form, setForm] = useState({
    institution_name: institution.institution_name || "",
    registration_number: institution.registration_number || "",
    contact_person_name: institution.contact_person_name || "",
    contact_email: institution.contact_email || "",
    contact_number: institution.contact_number || "",
    institution_phone: institution.institution_phone || "",
    institution_type: institution.institution_type,
    institution_category: institution.institution_category,
    status: institution.status,
  });
  const updateMutation = useUpdateInstitution();

  const setField = (field) => (e) =>
    setForm((current) => ({ ...current, [field]: e.target.value }));

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({ id: institution.id, updates: form });
      toast.success("Institution updated");
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not update institution");
    }
  };

  const field = (label, key) => (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold text-on-surface-variant">{label}</span>
      <input value={form[key]} onChange={setField(key)} className={inputClass} />
    </label>
  );

  const select = (label, key, options) => (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold text-on-surface-variant">{label}</span>
      <select value={form[key]} onChange={setField(key)} className={inputClass}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-black text-primary">Edit institution</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-on-surface-variant hover:text-on-surface"
          >
            ×
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {field("Name", "institution_name")}
          {field("Registration number", "registration_number")}
          {field("Contact person", "contact_person_name")}
          {field("Contact email", "contact_email")}
          {field("Contact number", "contact_number")}
          {field("Institution phone", "institution_phone")}
          {select("Type", "institution_type", TYPE_OPTIONS)}
          {select("Category", "institution_category", CATEGORY_OPTIONS)}
          {select("Status", "status", STATUS_OPTIONS)}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface-variant"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {updateMutation.isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

const OverrideToggle = ({ checked, onChange }) => (
  <label className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 accent-primary"
    />
    Override
  </label>
);

// Per-institution overrides for service fee, checkout expiry, and payment
// methods. Each setting can either use the global default or be overridden.
const InstitutionSettingsModal = ({ institution, onClose }) => {
  const { data, isLoading } = useInstitutionSettings(institution.id);
  const updateMutation = useUpdateInstitutionSettings();
  const catalog = data?.payment_method_catalog || [];

  const [form, setForm] = useState(null);
  const [override, setOverride] = useState(null);
  const [initialOverrides, setInitialOverrides] = useState(null);
  const [seeded, setSeeded] = useState(false);

  if (data && !seeded) {
    setSeeded(true);
    const ov = data.overrides || {};
    setInitialOverrides(ov);
    setOverride({
      service_fee: "service_fee" in ov,
      checkout_expiry_minutes: "checkout_expiry_minutes" in ov,
      enabled_payment_methods: "enabled_payment_methods" in ov,
    });
    setForm({
      service_fee: String(data.settings.service_fee),
      checkout_expiry_minutes: String(data.settings.checkout_expiry_minutes),
      enabled: new Set(data.settings.enabled_payment_methods),
    });
  }

  const toggleOverride = (key) =>
    setOverride((current) => ({ ...current, [key]: !current[key] }));

  const toggleMethod = (id) =>
    setForm((current) => {
      const enabled = new Set(current.enabled);
      if (enabled.has(id)) enabled.delete(id);
      else enabled.add(id);
      return { ...current, enabled };
    });

  const handleSave = async () => {
    const patch = {};
    const clear = [];

    if (override.service_fee) {
      const fee = Number(form.service_fee);
      if (!Number.isFinite(fee) || fee < 0 || fee > 1000) {
        return toast.error("Service fee must be between 0 and 1000");
      }
      patch.service_fee = fee;
    } else if ("service_fee" in initialOverrides) clear.push("service_fee");

    if (override.checkout_expiry_minutes) {
      const minutes = Number(form.checkout_expiry_minutes);
      if (!Number.isInteger(minutes) || minutes < 5 || minutes > 1440) {
        return toast.error("Checkout expiry must be 5–1440 minutes");
      }
      patch.checkout_expiry_minutes = minutes;
    } else if ("checkout_expiry_minutes" in initialOverrides) {
      clear.push("checkout_expiry_minutes");
    }

    if (override.enabled_payment_methods) {
      if (form.enabled.size === 0) {
        return toast.error("Enable at least one payment method");
      }
      patch.enabled_payment_methods = [...form.enabled];
    } else if ("enabled_payment_methods" in initialOverrides) {
      clear.push("enabled_payment_methods");
    }

    if (Object.keys(patch).length === 0 && clear.length === 0) {
      return toast.info("No changes to save");
    }

    try {
      await updateMutation.mutateAsync({
        id: institution.id,
        body: { ...patch, ...(clear.length ? { clear } : {}) },
      });
      toast.success("Institution settings saved");
      onClose();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not save settings");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black text-primary">Institution settings</h2>
            <p className="text-sm text-on-surface-variant">
              {institution.institution_name} — overrides the platform defaults.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-on-surface-variant hover:text-on-surface"
          >
            ×
          </button>
        </div>

        {isLoading || !form ? (
          <p className="mt-6 text-on-surface-variant">Loading settings...</p>
        ) : (
          <>
            <section className="mt-5 rounded-2xl border border-outline-variant p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-on-surface">Service fee</p>
                  <p className="text-sm text-on-surface-variant">
                    Global default: R{data.global.service_fee}
                  </p>
                </div>
                <OverrideToggle
                  checked={!!override.service_fee}
                  onChange={() => toggleOverride("service_fee")}
                />
              </div>
              {override.service_fee ? (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-on-surface-variant">R</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.service_fee}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, service_fee: e.target.value }))
                    }
                    className="w-40 rounded-lg border border-outline-variant px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
              ) : (
                <p className="mt-3 text-sm text-on-surface-variant">
                  Using global default (R{data.global.service_fee}).
                </p>
              )}
            </section>

            <section className="mt-4 rounded-2xl border border-outline-variant p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-on-surface">Checkout expiry</p>
                  <p className="text-sm text-on-surface-variant">
                    Global default: {data.global.checkout_expiry_minutes} min
                  </p>
                </div>
                <OverrideToggle
                  checked={!!override.checkout_expiry_minutes}
                  onChange={() => toggleOverride("checkout_expiry_minutes")}
                />
              </div>
              {override.checkout_expiry_minutes ? (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="number"
                    step="1"
                    min="5"
                    max="1440"
                    value={form.checkout_expiry_minutes}
                    onChange={(e) =>
                      setForm((c) => ({
                        ...c,
                        checkout_expiry_minutes: e.target.value,
                      }))
                    }
                    className="w-40 rounded-lg border border-outline-variant px-4 py-2.5 text-sm outline-none focus:border-primary"
                  />
                  <span className="text-on-surface-variant">min</span>
                </div>
              ) : (
                <p className="mt-3 text-sm text-on-surface-variant">
                  Using global default ({data.global.checkout_expiry_minutes} min).
                </p>
              )}
            </section>

            <section className="mt-4 rounded-2xl border border-outline-variant p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-on-surface">Payment methods</p>
                  <p className="text-sm text-on-surface-variant">
                    Which PayFast methods this institution offers.
                  </p>
                </div>
                <OverrideToggle
                  checked={!!override.enabled_payment_methods}
                  onChange={() => toggleOverride("enabled_payment_methods")}
                />
              </div>
              {override.enabled_payment_methods ? (
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {catalog.map((method) => (
                    <label
                      key={method.id}
                      className="flex cursor-pointer items-center gap-3 rounded-lg border border-outline-variant px-4 py-2.5 hover:bg-surface-container-low"
                    >
                      <input
                        type="checkbox"
                        checked={form.enabled.has(method.id)}
                        onChange={() => toggleMethod(method.id)}
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="text-sm font-semibold text-on-surface">
                        {method.label}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-on-surface-variant">
                  Using global default ({data.global.enabled_payment_methods.length} methods).
                </p>
              )}
            </section>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface-variant"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              >
                {updateMutation.isPending ? "Saving..." : "Save settings"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const InstitutionsPage = () => {
  const { data: me } = useMe();
  const canManage = me?.role === "super_admin";
  const updateMutation = useUpdateInstitution();
  const deleteMutation = useDeleteInstitution();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);
  const [settingsFor, setSettingsFor] = useState(null);

  const debouncedQuery = useDebouncedValue(query);

  const filterKey = `${debouncedQuery}|${statusFilter}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const { data, isLoading, isError, error } = useInstitutions({
    q: debouncedQuery || undefined,
    status: statusFilter || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const institutions = data?.institutions || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const toggleSuspend = async (institution) => {
    const nextStatus =
      institution.status === "approved" ? "suspended" : "approved";
    try {
      await updateMutation.mutateAsync({
        id: institution.id,
        updates: { status: nextStatus },
      });
      toast.success(
        `${institution.institution_name} ${nextStatus === "suspended" ? "suspended" : "activated"}`,
      );
    } catch (actionError) {
      toast.error(
        actionError?.response?.data?.message || "Could not update institution",
      );
    }
  };

  const handleDelete = async (institution) => {
    if (
      !window.confirm(
        `Delete ${institution.institution_name}? This cannot be undone.`,
      )
    ) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(institution.id);
      toast.success(`${institution.institution_name} deleted`);
    } catch (actionError) {
      toast.error(
        actionError?.response?.data?.message || "Could not delete institution",
      );
    }
  };

  return (
    <div>
      <PageHeader
        title="Institutions"
        subtitle={`Schools and universities on the platform. ${total} total.`}
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or contact email..."
          className="w-full rounded-lg border border-outline-variant bg-white px-4 py-3 text-sm outline-none focus:border-primary"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-outline-variant bg-white px-4 py-3 text-sm outline-none focus:border-primary"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {isError ? (
        <p className="mt-4 text-sm font-semibold text-red-600">
          {error?.response?.data?.message || "Could not load institutions"}
        </p>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-xl border border-outline-variant bg-white">
        {isLoading ? (
          <p className="p-5 text-on-surface-variant">Loading...</p>
        ) : institutions.length === 0 ? (
          <p className="p-5 text-on-surface-variant">No institutions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-surface-container-low text-xs uppercase text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Users / Products</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  {canManage ? (
                    <th className="px-4 py-3 text-right">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {institutions.map((institution) => (
                  <tr key={institution.id} className="border-t border-outline-variant">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-on-surface">
                        {institution.institution_name}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {institution.contact_email}
                      </p>
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {institution.institution_category} ·{" "}
                      {institution.institution_type}
                    </td>
                    <td className="px-4 py-3">
                      {institution.user_count} / {institution.product_count}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={STATUS_TONE[institution.status] || "neutral"}
                        className="capitalize"
                      >
                        {institution.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {formatDate(institution.created_at)}
                    </td>
                    {canManage ? (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => toggleSuspend(institution)}
                            disabled={updateMutation.isPending}
                            className="rounded-lg border border-orange-300 px-3 py-1.5 text-xs font-bold text-orange-700 hover:bg-orange-50 disabled:opacity-60"
                          >
                            {institution.status === "approved"
                              ? "Suspend"
                              : "Activate"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditing(institution)}
                            className="rounded-lg border border-primary px-3 py-1.5 text-xs font-bold text-primary hover:bg-surface-container-low"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setSettingsFor(institution)}
                            className="rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-bold text-on-surface-variant hover:bg-surface-container-low"
                          >
                            Settings
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(institution)}
                            disabled={deleteMutation.isPending}
                            className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      {editing ? (
        <EditInstitutionModal
          institution={editing}
          onClose={() => setEditing(null)}
        />
      ) : null}

      {settingsFor ? (
        <InstitutionSettingsModal
          institution={settingsFor}
          onClose={() => setSettingsFor(null)}
        />
      ) : null}
    </div>
  );
};

export default InstitutionsPage;
