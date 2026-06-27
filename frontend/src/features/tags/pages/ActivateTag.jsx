import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { QrCode, CheckCircle2, AlertCircle } from "lucide-react";
import useAuthStore from "../../auth/store/authStore";
import { useMyFamily } from "../../family/hooks/useFamily";
import { useTagLookup, useActivateTag } from "../hooks/useTags";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";

const Shell = ({ children }) => (
  <div className="mx-auto w-full max-w-md px-4 py-10">
    <div className="rounded-2xl border border-outline-variant bg-white p-6">
      {children}
    </div>
  </div>
);

const Notice = ({ tone = "info", title, children }) => {
  const Icon = tone === "error" ? AlertCircle : QrCode;
  const color = tone === "error" ? "text-error" : "text-primary";
  return (
    <div className="text-center">
      <Icon size={36} className={`mx-auto ${color}`} />
      <h1 className="mt-3 text-xl font-bold text-on-surface">{title}</h1>
      <div className="mt-1 text-on-surface-variant">{children}</div>
      <Link
        to="/tags"
        className="mt-5 inline-block rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-on-primary"
      >
        Go to my stickers
      </Link>
    </div>
  );
};

const ActivateTag = () => {
  useDocumentTitle("Activate sticker");
  const { value } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const isParent = user?.role === "parent";

  const { data, isLoading, isError } = useTagLookup(value);
  const { data: family } = useMyFamily();
  const activateMutation = useActivateTag();

  const [owner, setOwner] = useState("self");
  const [label, setLabel] = useState("");

  if (isLoading) {
    return (
      <Shell>
        <p className="text-center text-on-surface-variant">Loading sticker...</p>
      </Shell>
    );
  }

  if (isError || !data) {
    return (
      <Shell>
        <Notice tone="error" title="Sticker not found">
          We couldn&apos;t find a sticker for that code.
        </Notice>
      </Shell>
    );
  }

  if (!data.sameInstitution) {
    return (
      <Shell>
        <Notice tone="error" title="Wrong school">
          This sticker was issued by a different school, so it can&apos;t be
          activated on your account.
        </Notice>
      </Shell>
    );
  }

  if (!data.claimable) {
    return (
      <Shell>
        <Notice title="Already activated">
          {data.ownedByMe
            ? "This sticker is already on your account."
            : "This sticker has already been activated."}
        </Notice>
      </Shell>
    );
  }

  const children = family?.children || [];

  const handleActivate = (event) => {
    event.preventDefault();
    activateMutation.mutate(
      { value, owner, label: label.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Sticker activated");
          navigate("/tags");
        },
        onError: (error) =>
          toast.error(
            error?.response?.data?.message || "Could not activate the sticker",
          ),
      },
    );
  };

  return (
    <Shell>
      <div className="text-center">
        <QrCode size={36} className="mx-auto text-primary" />
        <h1 className="mt-3 text-xl font-bold text-on-surface">
          Activate your sticker
        </h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          {data.tag.code} · {data.tag.institution_name}
        </p>
      </div>

      <form onSubmit={handleActivate} className="mt-6 space-y-4">
        {isParent ? (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-on-surface">
              Who is this for?
            </span>
            <select
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
            >
              <option value="self">Me ({user?.full_name})</option>
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.full_name}
                  {child.grade ? ` · ${child.grade}` : ""}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-on-surface">
            What is it on?
          </span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Blue school bag"
            className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none"
          />
        </label>

        <button
          type="submit"
          disabled={activateMutation.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-on-primary disabled:opacity-60"
        >
          <CheckCircle2 size={18} />
          {activateMutation.isPending ? "Activating..." : "Activate sticker"}
        </button>
      </form>
    </Shell>
  );
};

export default ActivateTag;
