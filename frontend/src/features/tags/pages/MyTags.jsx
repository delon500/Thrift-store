import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { QrCode, Trash2 } from "lucide-react";
import { useMyTags, useDeactivateTag } from "../hooks/useTags";
import { useDocumentTitle } from "../../../lib/useDocumentTitle";

const MyTags = () => {
  useDocumentTitle("My stickers");
  const navigate = useNavigate();
  const { data: tags = [], isLoading, isError } = useMyTags();
  const deactivateMutation = useDeactivateTag();
  const [code, setCode] = useState("");

  const handleEnter = (event) => {
    event.preventDefault();
    const value = code.trim();
    if (!value) return toast.error("Enter the code on your sticker");
    navigate(`/t/${encodeURIComponent(value)}`);
  };

  const handleDeactivate = (tag) => {
    if (
      !window.confirm(
        `Deactivate ${tag.label || tag.code}? The sticker can be re-used afterwards.`,
      )
    )
      return;
    deactivateMutation.mutate(tag.token, {
      onSuccess: () => toast.success("Sticker deactivated"),
      onError: (error) =>
        toast.error(error?.response?.data?.message || "Could not deactivate"),
    });
  };

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-extrabold text-on-surface">My stickers</h1>
      <p className="mt-1 text-on-surface-variant">
        Activate a QR sticker and tag your belongings. If a tagged item is found
        at school, you&apos;ll be alerted.
      </p>

      <form
        onSubmit={handleEnter}
        className="mt-6 rounded-2xl border border-outline-variant bg-white p-5"
      >
        <p className="mb-3 text-sm font-bold text-on-surface">
          Activate a sticker
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Enter the code on your sticker (e.g. TAG-2026-000123)"
            className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none sm:flex-1"
          />
          <button
            type="submit"
            className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-on-primary"
          >
            Activate
          </button>
        </div>
        <p className="mt-2 text-xs text-on-surface-variant">
          Or just scan the QR code on the sticker with your phone camera.
        </p>
      </form>

      <div className="mt-6 overflow-hidden rounded-2xl border border-outline-variant bg-white">
        <p className="px-4 pt-4 text-sm font-bold text-on-surface">
          Your stickers
        </p>
        {isLoading ? (
          <p className="p-4 text-sm text-on-surface-variant">Loading...</p>
        ) : isError ? (
          <p className="p-4 text-sm text-error">Could not load your stickers.</p>
        ) : tags.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <QrCode size={32} className="text-on-surface-variant" />
            <p className="text-sm text-on-surface-variant">
              No stickers yet — activate one above.
            </p>
          </div>
        ) : (
          tags.map((tag) => (
            <div
              key={tag.token}
              className="flex items-center justify-between border-t border-outline-variant p-4"
            >
              <div>
                <p className="font-semibold text-on-surface">
                  {tag.label || "Unlabelled sticker"}
                </p>
                <p className="text-sm text-on-surface-variant">
                  {tag.code} · {tag.assignee}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleDeactivate(tag)}
                disabled={deactivateMutation.isPending}
                className="flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50"
              >
                <Trash2 size={14} />
                Deactivate
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyTags;
