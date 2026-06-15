import {
  useApproveRegistration,
  useRegistrations,
  useRejectRegistration,
} from "../hooks/useRegistrations";

const roleStyles = {
  student: "bg-teal-100 text-teal-800",
  parent: "bg-blue-100 text-blue-800",
  school: "bg-purple-100 text-purple-800",
  university: "bg-indigo-100 text-indigo-800",
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" }) : "";

const RegistrationRequests = () => {
  const { data: registrations = [], isLoading, isError, error } = useRegistrations();
  const approveMutation = useApproveRegistration();
  const rejectMutation = useRejectRegistration();
  const pendingId =
    approveMutation.variables ?? rejectMutation.variables ?? null;
  const isBusy = approveMutation.isPending || rejectMutation.isPending;

  const handleApprove = async (registration) => {
    try {
      await approveMutation.mutateAsync(registration.id);
    } catch (actionError) {
      alert(actionError?.response?.data?.message || "Could not approve");
    }
  };

  const handleReject = async (registration) => {
    if (!window.confirm(`Reject ${registration.full_name}'s registration?`)) return;

    try {
      await rejectMutation.mutateAsync(registration.id);
    } catch (actionError) {
      alert(actionError?.response?.data?.message || "Could not reject");
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-black text-teal-600">Registration Requests</h1>
        <p className="text-sm font-medium text-gray-500">
          Approve or reject people who signed up and are waiting to access the app.
        </p>
      </div>

      {isError ? (
        <p className="mt-4 text-sm font-semibold text-red-600">
          {error?.response?.data?.message || "Could not load registrations"}
        </p>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <p className="p-5 text-gray-500">Loading requests...</p>
        ) : registrations.length === 0 ? (
          <p className="p-5 text-gray-500">No pending registration requests.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">School</th>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((registration) => (
                  <tr key={registration.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">
                        {registration.full_name}
                      </p>
                      <p className="text-xs text-gray-500">{registration.email}</p>
                      <p className="text-xs text-gray-500">
                        {registration.contact_number}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                          roleStyles[registration.role] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {registration.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {registration.institution_name || "—"}
                    </td>
                    <td className="px-4 py-3">{formatDate(registration.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleApprove(registration)}
                          disabled={isBusy}
                          className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-60"
                        >
                          {pendingId === registration.id && approveMutation.isPending
                            ? "Approving..."
                            : "Approve"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(registration)}
                          disabled={isBusy}
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          Reject
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
    </div>
  );
};

export default RegistrationRequests;
