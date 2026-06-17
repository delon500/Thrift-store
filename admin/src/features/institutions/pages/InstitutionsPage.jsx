import { useState } from "react";
import { toast } from "react-toastify";
import {
  useDeleteInstitution,
  useInstitutions,
  useUpdateInstitution,
} from "../hooks/useInstitutions";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import Pagination from "../../../components/shared/Pagination";
import { useMe } from "../../auth/hook/useAuth";

const PAGE_SIZE = 10;
const STATUS_OPTIONS = ["approved", "suspended", "pending", "rejected"];
const TYPE_OPTIONS = ["public", "private", "independent"];
const CATEGORY_OPTIONS = ["school", "university"];

const STATUS_STYLES = {
  approved: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  rejected: "bg-red-100 text-red-700",
  suspended: "bg-orange-100 text-orange-700",
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" }) : "";

const inputClass =
  "rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-600";

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
      <span className="font-semibold text-gray-600">{label}</span>
      <input value={form[key]} onChange={setField(key)} className={inputClass} />
    </label>
  );

  const select = (label, key, options) => (
    <label className="grid gap-1 text-sm">
      <span className="font-semibold text-gray-600">{label}</span>
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
          <h2 className="text-xl font-black text-teal-600">Edit institution</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-gray-400 hover:text-gray-700"
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
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {updateMutation.isPending ? "Saving..." : "Save changes"}
          </button>
        </div>
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
    <div className="p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-teal-600">Institutions</h1>
        <p className="text-sm font-medium text-gray-500">
          Schools and universities on the platform. {total} total.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or contact email..."
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-600"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-600"
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

      <section className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-5 text-gray-500">Loading...</p>
        ) : institutions.length === 0 ? (
          <p className="p-5 text-gray-500">No institutions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
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
                  <tr key={institution.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">
                        {institution.institution_name}
                      </p>
                      <p className="text-xs text-gray-500">
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
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          STATUS_STYLES[institution.status] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {institution.status}
                      </span>
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
                            className="rounded-lg border border-teal-600 px-3 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-50"
                          >
                            Edit
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
    </div>
  );
};

export default InstitutionsPage;
