import { useState } from "react";
import { toast } from "react-toastify";
import {
  useParentStudents,
  useLinkStudent,
  useUnlinkStudent,
} from "../hooks/useGuardianship";

// Super-admin links/unlinks student accounts to a parent (guardianship).
const LinkStudentsModal = ({ parent, onClose }) => {
  const { data, isLoading } = useParentStudents(parent.id);
  const linkMutation = useLinkStudent();
  const unlinkMutation = useUnlinkStudent();
  const [selected, setSelected] = useState("");

  const linked = data?.linked || [];
  const available = data?.available || [];

  const handleLink = async () => {
    if (!selected) return toast.error("Select a student to link");
    try {
      await linkMutation.mutateAsync({
        parentId: parent.id,
        studentId: selected,
      });
      toast.success("Student linked");
      setSelected("");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not link student");
    }
  };

  const handleUnlink = async (studentId) => {
    try {
      await unlinkMutation.mutateAsync({ parentId: parent.id, studentId });
      toast.success("Student unlinked");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Could not unlink");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-black text-primary">Linked students</h2>
            <p className="text-sm text-on-surface-variant">
              Students linked to {parent.full_name} get this parent as a
              guardian for alerts.
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

        <div className="mt-5">
          <p className="text-sm font-bold text-on-surface">Currently linked</p>
          {isLoading ? (
            <p className="mt-2 text-sm text-on-surface-variant">Loading...</p>
          ) : linked.length === 0 ? (
            <p className="mt-2 text-sm text-on-surface-variant">
              No students linked yet.
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-outline-variant rounded-xl border border-outline-variant">
              {linked.map((student) => (
                <li
                  key={student.id}
                  className="flex items-center justify-between px-4 py-2"
                >
                  <div>
                    <p className="text-sm font-medium text-on-surface">
                      {student.full_name}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {student.email}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnlink(student.id)}
                    disabled={unlinkMutation.isPending}
                    className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                  >
                    Unlink
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-5">
          <p className="text-sm font-bold text-on-surface">Link a student</p>
          {available.length === 0 ? (
            <p className="mt-2 text-sm text-on-surface-variant">
              No more students in this institution to link.
            </p>
          ) : (
            <div className="mt-2 flex gap-2">
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="flex-1 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
              >
                <option value="">Select a student</option>
                {available.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} ({student.email})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleLink}
                disabled={linkMutation.isPending}
                className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-white transition hover:bg-on-primary-container disabled:opacity-60"
              >
                {linkMutation.isPending ? "Linking..." : "Link"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LinkStudentsModal;
