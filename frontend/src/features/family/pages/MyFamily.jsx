import { useState } from "react";
import { toast } from "react-toastify";
import { Users, Pencil, Trash2, Check, X, GraduationCap } from "lucide-react";
import useAuthStore from "../../auth/store/authStore";
import {
  useMyFamily,
  useCreateChild,
  useUpdateChild,
  useDeleteChild,
} from "../hooks/useFamily";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";

const inputClass =
  "w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none";

const ChildRow = ({ child, onSave, onDelete, saving, deleting }) => {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(child.full_name);
  const [grade, setGrade] = useState(child.grade || "");

  const save = () => {
    if (!name.trim()) return toast.error("A name is required");
    onSave(child.id, { full_name: name.trim(), grade: grade.trim() }, () =>
      setEditing(false),
    );
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-2 border-t border-outline-variant p-4 sm:flex-row sm:items-center">
        <input
          className={`${inputClass} sm:flex-1`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Child's name"
        />
        <input
          className={`${inputClass} sm:w-40`}
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          placeholder="Grade (optional)"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-on-primary disabled:opacity-60"
          >
            <Check size={16} /> Save
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setName(child.full_name);
              setGrade(child.grade || "");
            }}
            className="flex items-center gap-1 rounded-xl border border-outline-variant px-3 py-2 text-sm font-semibold text-on-surface-variant"
          >
            <X size={16} /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between border-t border-outline-variant p-4">
      <div>
        <p className="font-semibold text-on-surface">{child.full_name}</p>
        <p className="text-sm text-on-surface-variant">
          {child.grade || "No grade set"}
        </p>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Edit"
          className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-low"
        >
          <Pencil size={18} />
        </button>
        <button
          type="button"
          onClick={() => onDelete(child)}
          disabled={deleting}
          aria-label="Remove"
          className="rounded-lg p-2 text-error hover:bg-error-container/40 disabled:opacity-50"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

const MyFamily = () => {
  useDocumentTitle("My family");
  const role = useAuthStore((state) => state.user?.role);

  const { data, isLoading, isError } = useMyFamily();
  const createMutation = useCreateChild();
  const updateMutation = useUpdateChild();
  const deleteMutation = useDeleteChild();

  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");

  if (role !== "parent") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-10 text-center">
        <Users size={32} className="mx-auto text-on-surface-variant" />
        <h1 className="mt-3 text-xl font-bold text-on-surface">My family</h1>
        <p className="mt-1 text-on-surface-variant">
          This page is available to parent accounts.
        </p>
      </div>
    );
  }

  const children = data?.children || [];
  const students = data?.students || [];

  const handleAdd = (event) => {
    event.preventDefault();
    if (!name.trim()) return toast.error("A name is required");
    createMutation.mutate(
      { full_name: name.trim(), grade: grade.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Child added");
          setName("");
          setGrade("");
        },
        onError: (error) =>
          toast.error(error?.response?.data?.message || "Could not add child"),
      },
    );
  };

  const handleSave = (id, body, done) => {
    updateMutation.mutate(
      { id, body },
      {
        onSuccess: () => {
          toast.success("Updated");
          done();
        },
        onError: (error) =>
          toast.error(error?.response?.data?.message || "Could not update"),
      },
    );
  };

  const handleDelete = (child) => {
    if (!window.confirm(`Remove ${child.full_name}?`)) return;
    deleteMutation.mutate(child.id, {
      onSuccess: () => toast.success("Removed"),
      onError: (error) =>
        toast.error(error?.response?.data?.message || "Could not remove"),
    });
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-extrabold text-on-surface">My family</h1>
      <p className="mt-1 text-on-surface-variant">
        Add your children so you can tag their belongings and be alerted if a
        lost item is found.
      </p>

      <form
        onSubmit={handleAdd}
        className="mt-6 rounded-2xl border border-outline-variant bg-white p-5"
      >
        <p className="mb-3 text-sm font-bold text-on-surface">Add a child</p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className={`${inputClass} sm:flex-1`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Child's name"
          />
          <input
            className={`${inputClass} sm:w-40`}
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            placeholder="Grade (optional)"
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-on-primary disabled:opacity-60"
          >
            {createMutation.isPending ? "Adding..." : "Add"}
          </button>
        </div>
      </form>

      <div className="mt-6 overflow-hidden rounded-2xl border border-outline-variant bg-white">
        <p className="px-4 pt-4 text-sm font-bold text-on-surface">Children</p>
        {isLoading ? (
          <p className="p-4 text-sm text-on-surface-variant">Loading...</p>
        ) : isError ? (
          <p className="p-4 text-sm text-error">Could not load your family.</p>
        ) : children.length === 0 ? (
          <p className="p-4 text-sm text-on-surface-variant">
            No children yet — add one above.
          </p>
        ) : (
          children.map((child) => (
            <ChildRow
              key={child.id}
              child={child}
              onSave={handleSave}
              onDelete={handleDelete}
              saving={updateMutation.isPending}
              deleting={deleteMutation.isPending}
            />
          ))
        )}
      </div>

      {students.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-2xl border border-outline-variant bg-white">
          <div className="px-4 pt-4">
            <p className="text-sm font-bold text-on-surface">
              Linked student accounts
            </p>
            <p className="text-xs text-on-surface-variant">
              Linked by your school. Contact the school to change these.
            </p>
          </div>
          {students.map((student) => (
            <div
              key={student.id}
              className="flex items-center gap-3 border-t border-outline-variant p-4"
            >
              <GraduationCap size={18} className="text-on-surface-variant" />
              <div>
                <p className="font-semibold text-on-surface">
                  {student.full_name}
                </p>
                <p className="text-sm text-on-surface-variant">
                  {student.email}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default MyFamily;
