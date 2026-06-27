import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { QrCode } from "lucide-react";
import { getInstitutions } from "../../institutions/api/institutionsApi";
import { useMe } from "../../auth/hook/useAuth";
import useAuthStore from "../../auth/store/authStore";
import { useTagBatches, useCreateTagBatch } from "../hooks/useTags";
import { getTagBatch } from "../api/tagsApi";
import { downloadQrSheet } from "../lib/qrSheetPdf";
import { PageHeader } from "../../../components/shared/ui";

const EMPTY = { institution_id: "", quantity: 50, note: "" };

const TagBatchesPage = () => {
  const { data: me } = useMe();
  const isSuper = me?.role === "super_admin";

  const { data, isLoading } = useTagBatches();
  const batches = data?.batches || [];
  const createMutation = useCreateTagBatch();

  const { data: institutions = [] } = useQuery({
    queryKey: ["institutions"],
    queryFn: getInstitutions,
  });

  const token = useAuthStore((state) => state.token);
  const [downloadingId, setDownloadingId] = useState(null);

  const [form, setForm] = useState(EMPTY);
  const setField = (key) => (e) =>
    setForm((current) => ({ ...current, [key]: e.target.value }));

  const handleDownload = async (batch) => {
    setDownloadingId(batch.id);
    try {
      const { tags } = await getTagBatch({ id: batch.id, token });
      const safeName = (batch.institution_name || "institution").replace(
        /[^a-z0-9]+/gi,
        "-",
      );
      await downloadQrSheet({
        institutionName: batch.institution_name,
        subtitle: `${batch.quantity} tags · ${new Date(
          batch.created_at,
        ).toLocaleDateString()}`,
        tags,
        filename: `qr-tags-${safeName}-${batch.id.slice(0, 8)}`,
      });
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Could not build the QR sheet",
      );
    } finally {
      setDownloadingId(null);
    }
  };

  const handleGenerate = async (event) => {
    event.preventDefault();
    const qty = Number(form.quantity);
    if (!form.institution_id) return toast.error("Select an institution");
    if (!Number.isInteger(qty) || qty < 1 || qty > 1000) {
      return toast.error("Quantity must be between 1 and 1000");
    }
    try {
      const res = await createMutation.mutateAsync({
        institution_id: form.institution_id,
        quantity: qty,
        note: form.note || undefined,
      });
      toast.success(`Generated ${res.batch.quantity} QR tags`);
      setForm(EMPTY);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Could not generate tags",
      );
    }
  };

  const inputClass =
    "w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary focus:outline-none";

  return (
    <div className="w-full">
      <PageHeader
        title="QR tags"
        subtitle="Generate printable QR sticker batches, then hand the sheet to the school to sell."
      />

      {isSuper ? (
        <form
          onSubmit={handleGenerate}
          className="mb-6 rounded-xl border border-outline-variant bg-white p-5"
        >
          <p className="mb-4 text-sm font-bold text-on-surface">
            Generate a batch
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-on-surface-variant">
                Institution
              </span>
              <select
                value={form.institution_id}
                onChange={setField("institution_id")}
                className={inputClass}
              >
                <option value="">Select institution</option>
                {institutions.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.institution_name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-on-surface-variant">
                Quantity (1–1000)
              </span>
              <input
                type="number"
                min="1"
                max="1000"
                value={form.quantity}
                onChange={setField("quantity")}
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-on-surface-variant">
                Note (optional)
              </span>
              <input
                type="text"
                value={form.note}
                onChange={setField("note")}
                placeholder="e.g. Term 3 print run"
                className={inputClass}
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-on-primary-container disabled:opacity-60"
            >
              {createMutation.isPending ? "Generating..." : "Generate batch"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="rounded-xl border border-outline-variant bg-white p-5">
        <p className="mb-3 text-sm font-bold text-on-surface">Batches</p>
        {isLoading ? (
          <p className="text-sm text-on-surface-variant">Loading...</p>
        ) : batches.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <QrCode size={32} className="text-on-surface-variant" />
            <p className="text-sm text-on-surface-variant">
              No batches yet{isSuper ? " — generate one above." : "."}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-outline-variant">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low text-xs uppercase text-on-surface-variant">
                <tr>
                  <th className="px-4 py-2">Institution</th>
                  <th className="px-4 py-2">Quantity</th>
                  <th className="px-4 py-2">Activated</th>
                  <th className="px-4 py-2">Note</th>
                  <th className="px-4 py-2">Created</th>
                  <th className="px-4 py-2 text-right">Sheet</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => (
                  <tr
                    key={batch.id}
                    className="border-t border-outline-variant"
                  >
                    <td className="px-4 py-2 font-medium text-on-surface">
                      {batch.institution_name}
                    </td>
                    <td className="px-4 py-2">{batch.quantity}</td>
                    <td className="px-4 py-2">
                      {batch.activated_count} / {batch.quantity}
                    </td>
                    <td className="px-4 py-2 text-on-surface-variant">
                      {batch.note || "—"}
                    </td>
                    <td className="px-4 py-2 text-on-surface-variant">
                      {new Date(batch.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownload(batch)}
                        disabled={downloadingId === batch.id}
                        className="rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white disabled:opacity-50"
                      >
                        {downloadingId === batch.id
                          ? "Preparing..."
                          : "Download QR sheet"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TagBatchesPage;
