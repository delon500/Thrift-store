import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  useDeleteUser,
  useResetUserPassword,
  useUpdateUser,
  useUsersByRole,
} from "../hooks/useRegisteredUsers";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import Pagination from "../../../components/shared/Pagination";

const PAGE_SIZE = 10;

const ROLE_LABELS = {
  school: "Registered Schools",
  university: "Registered Universities",
  admin: "Staff Members",
  student: "Registered Students",
  parent: "Registered Parents",
};

const STATUS_STYLES = {
  approved: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  rejected: "bg-red-100 text-red-700",
  suspended: "bg-orange-100 text-orange-700",
};

const STATUS_OPTIONS = ["approved", "suspended", "pending", "rejected"];

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" }) : "";

const EditUserModal = ({ user, onClose }) => {
  const [form, setForm] = useState({
    full_name: user.full_name || "",
    contact_number: user.contact_number || "",
    status: user.status,
  });
  const [newPassword, setNewPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const updateMutation = useUpdateUser();
  const resetMutation = useResetUserPassword();

  const inputClass =
    "rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-600";

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({ id: user.id, updates: form });
      onClose();
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Could not update user",
      });
    }
  };

  const handleReset = async () => {
    if (newPassword.length < 8) {
      setMsg({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    try {
      await resetMutation.mutateAsync({ id: user.id, newPassword });
      setNewPassword("");
      setMsg({ type: "success", text: "Password reset." });
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Could not reset password",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-black text-teal-600">Edit user</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-2xl leading-none text-gray-400 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">{user.email}</p>

        {msg ? (
          <div
            className={`mt-4 rounded-lg px-3 py-2 text-sm font-medium ${
              msg.type === "success"
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {msg.text}
          </div>
        ) : null}

        <div className="mt-4 grid gap-4">
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-gray-600">Full name</span>
            <input
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              className={inputClass}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-gray-600">Contact number</span>
            <input
              value={form.contact_number}
              onChange={(e) =>
                setForm((f) => ({ ...f, contact_number: e.target.value }))
              }
              className={inputClass}
            />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="font-semibold text-gray-600">Status</span>
            <select
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              className={inputClass}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
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

        <div className="mt-6 border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-gray-600">Reset password</p>
          <div className="mt-2 flex gap-2">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 8 chars)"
              className={`${inputClass} flex-grow`}
            />
            <button
              type="button"
              onClick={handleReset}
              disabled={resetMutation.isPending}
              className="rounded-lg border border-teal-600 px-3 py-2 text-sm font-bold text-teal-700 disabled:opacity-60"
            >
              {resetMutation.isPending ? "..." : "Reset"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RegisteredUsersList = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const updateMutation = useUpdateUser();
  const deleteMutation = useDeleteUser();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);

  const title = ROLE_LABELS[role] || "Registered Users";

  const debouncedQuery = useDebouncedValue(query);

  // reset to the first page when the search (or role) changes
  const filterKey = `${role}|${debouncedQuery}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const { data, isLoading, isError, error } = useUsersByRole(role, {
    q: debouncedQuery || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const users = data?.users || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const toggleSuspend = async (user) => {
    const nextStatus = user.status === "approved" ? "suspended" : "approved";
    try {
      await updateMutation.mutateAsync({ id: user.id, updates: { status: nextStatus } });
      toast.success(`${user.full_name} ${nextStatus === "suspended" ? "suspended" : "reactivated"}`);
    } catch (actionError) {
      toast.error(actionError?.response?.data?.message || "Could not update user");
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.full_name}? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(user.id);
      toast.success(`${user.full_name} deleted`);
    } catch (actionError) {
      toast.error(actionError?.response?.data?.message || "Could not delete user");
    }
  };

  return (
    <div className="p-6">
      <button
        type="button"
        onClick={() => navigate("/admin/registered-users")}
        className="mb-3 text-sm font-semibold text-teal-600 hover:underline"
      >
        ← All registered users
      </button>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-teal-600">{title}</h1>
        <p className="text-sm font-medium text-gray-500">
          {total} {total === 1 ? "person" : "people"}
        </p>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name, email, or institution..."
        className="mt-6 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-600"
      />

      {isError ? (
        <p className="mt-4 text-sm font-semibold text-red-600">
          {error?.response?.data?.message || "Could not load users"}
        </p>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-5 text-gray-500">Loading...</p>
        ) : users.length === 0 ? (
          <p className="p-5 text-gray-500">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{user.full_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">{user.institution_name || "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          STATUS_STYLES[user.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{formatDate(user.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSuspend(user)}
                          disabled={updateMutation.isPending}
                          className="rounded-lg border border-orange-300 px-3 py-1.5 text-xs font-bold text-orange-700 hover:bg-orange-50 disabled:opacity-60"
                        >
                          {user.status === "approved" ? "Suspend" : "Reactivate"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(user)}
                          className="rounded-lg border border-teal-600 px-3 py-1.5 text-xs font-bold text-teal-700 hover:bg-teal-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(user)}
                          disabled={deleteMutation.isPending}
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      {editing ? (
        <EditUserModal user={editing} onClose={() => setEditing(null)} />
      ) : null}
    </div>
  );
};

export default RegisteredUsersList;
