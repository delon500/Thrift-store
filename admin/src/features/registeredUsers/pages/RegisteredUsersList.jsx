import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUsersByRole } from "../hooks/useRegisteredUsers";

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
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" }) : "";

const RegisteredUsersList = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  const { data: users = [], isLoading, isError, error } = useUsersByRole(role);
  const [query, setQuery] = useState("");

  const title = ROLE_LABELS[role] || "Registered Users";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;

    return users.filter((user) =>
      [user.full_name, user.email, user.institution_name]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(q)),
    );
  }, [users, query]);

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
          {filtered.length} {filtered.length === 1 ? "person" : "people"}
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
        ) : filtered.length === 0 ? (
          <p className="p-5 text-gray-500">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Institution</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{user.full_name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </td>
                    <td className="px-4 py-3">{user.contact_number || "—"}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default RegisteredUsersList;
