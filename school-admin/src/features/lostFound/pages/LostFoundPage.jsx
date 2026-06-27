import { useState } from "react";
import { ScanLine, QrCode, CheckCircle2, AlertCircle } from "lucide-react";
import {
  PageHeader,
  Badge,
  cardClass,
  inputClass,
} from "../../../components/shared/ui";
import QrScanner from "../../../components/shared/QrScanner";
import {
  useFoundReports,
  useReportFound,
  useMarkReturned,
} from "../hooks/useLostFound";

// A scanned tag QR encodes <scan-base>/t/<token>; pull the token out. A typed
// code (TAG-...) is used as-is.
const extractValue = (text) => {
  const match = String(text || "").match(/\/t\/([^/?#]+)/);
  return match ? decodeURIComponent(match[1]) : String(text || "").trim();
};

const fmtDate = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "";

const LostFoundPage = () => {
  const { data: reports = [], isLoading } = useFoundReports();
  const report = useReportFound();
  const markReturned = useMarkReturned();

  const [code, setCode] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async (raw) => {
    const value = extractValue(raw);
    if (!value) {
      setResult({ type: "error", text: "Enter or scan a sticker code" });
      return;
    }
    try {
      const res = await report.mutateAsync(value);
      setResult({
        type: "success",
        text: res.message,
        label: res.label,
        reference: res.reference,
      });
      setCode("");
    } catch (error) {
      setResult({
        type: "error",
        text: error?.response?.data?.message || "Could not report this item",
      });
    }
  };

  const handleVerify = (event) => {
    event.preventDefault();
    submit(code);
  };

  const handleScan = (decoded) => {
    setScanOpen(false);
    submit(decoded);
  };

  const handleReturn = async (id) => {
    try {
      await markReturned.mutateAsync(id);
    } catch (error) {
      setResult({
        type: "error",
        text: error?.response?.data?.message || "Could not mark returned",
      });
    }
  };

  return (
    <div>
      <PageHeader
        title="Lost & found"
        subtitle="Scan a tagged item to alert its owner, then hand it back at the desk."
      />

      <section className={`${cardClass} mb-6`}>
        <form onSubmit={handleVerify} className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <ScanLine
              size={20}
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant"
            />
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="TAG-2026-000123"
              aria-label="Sticker code"
              className={`${inputClass} w-full py-3.5 pl-12 text-base`}
            />
          </div>
          <button
            type="submit"
            disabled={report.isPending}
            className="rounded-xl bg-primary px-6 py-3.5 text-base font-semibold text-on-primary transition-colors hover:bg-on-primary-container disabled:opacity-60"
          >
            {report.isPending ? "Reporting..." : "Report found"}
          </button>
          <button
            type="button"
            onClick={() => setScanOpen(true)}
            className="flex items-center justify-center gap-2 rounded-xl border border-outline-variant px-6 py-3.5 text-base font-semibold text-on-surface transition-colors hover:bg-surface-container-low"
          >
            <QrCode size={20} aria-hidden="true" />
            Scan
          </button>
        </form>

        {result ? (
          <div
            className={`mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
              result.type === "success"
                ? "border-primary/30 bg-primary/5 text-on-surface"
                : "border-red-300 bg-red-50 text-red-700"
            }`}
          >
            {result.type === "success" ? (
              <CheckCircle2 size={18} className="mt-0.5 text-primary" />
            ) : (
              <AlertCircle size={18} className="mt-0.5" />
            )}
            <div>
              <p>{result.text}</p>
              {result.reference ? (
                <p className="text-on-surface-variant">
                  {result.label || "Item"} · {result.reference}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <section className={cardClass}>
        <p className="mb-3 text-sm font-bold text-on-surface">Found items</p>
        {isLoading ? (
          <p className="text-sm text-on-surface-variant">Loading...</p>
        ) : reports.length === 0 ? (
          <p className="text-sm text-on-surface-variant">
            No found items reported yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-on-surface-variant">
                <tr>
                  <th className="py-2">Item</th>
                  <th className="py-2">Reference</th>
                  <th className="py-2">Found</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-t border-outline-variant">
                    <td className="py-2">
                      <p className="font-medium text-on-surface">
                        {r.label || "Unlabelled"}
                      </p>
                      <p className="text-xs text-on-surface-variant">{r.code}</p>
                    </td>
                    <td className="py-2">{r.reference}</td>
                    <td className="py-2 text-on-surface-variant">
                      {fmtDate(r.found_at)}
                      {r.found_by ? ` · ${r.found_by}` : ""}
                    </td>
                    <td className="py-2">
                      <Badge tone={r.status === "open" ? "info" : "success"}>
                        {r.status === "open" ? "Open" : "Returned"}
                      </Badge>
                    </td>
                    <td className="py-2 text-right">
                      {r.status === "open" ? (
                        <button
                          type="button"
                          onClick={() => handleReturn(r.id)}
                          disabled={markReturned.isPending}
                          className="rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-surface-container-low disabled:opacity-60"
                        >
                          Mark returned
                        </button>
                      ) : (
                        <span className="text-xs text-on-surface-variant">
                          {fmtDate(r.returned_at)}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {scanOpen ? (
        <QrScanner onResult={handleScan} onClose={() => setScanOpen(false)} />
      ) : null}
    </div>
  );
};

export default LostFoundPage;
