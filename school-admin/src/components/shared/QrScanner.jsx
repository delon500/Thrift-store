import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, CameraOff } from "lucide-react";

const SCANNER_ID = "qr-scanner-region";

// Camera-based QR reader. The customer app's collection pass encodes the plain
// order_reference, so onResult(decodedText) can be fed straight to a lookup.
const QrScanner = ({ onResult, onClose }) => {
  // Keep the latest callback without re-running the start/stop effect.
  const onResultRef = useRef(onResult);
  const scannerRef = useRef(null);
  const [error, setError] = useState("");

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    const scanner = new Html5Qrcode(SCANNER_ID, { verbose: false });
    scannerRef.current = scanner;
    let handled = false;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 240, height: 240 } },
        (decodedText) => {
          if (handled) return;
          handled = true;
          scanner
            .stop()
            .catch(() => {})
            .finally(() => onResultRef.current(decodedText));
        },
        () => {}, // ignore per-frame decode misses
      )
      .catch((err) => {
        const message = String(err?.message || err || "");
        setError(
          /permission|denied|notallowed/i.test(message)
            ? "Camera permission denied. Allow access, or type the reference instead."
            : "Could not start the camera. Type the reference instead.",
        );
      });

    return () => {
      handled = true;
      const active = scannerRef.current;
      if (active) {
        active
          .stop()
          .then(() => active.clear())
          .catch(() => {});
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-outline-variant bg-surface">
        <div className="flex items-center justify-between border-b border-outline-variant px-5 py-3">
          <h2 className="font-bold text-on-surface">Scan collection pass</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close scanner"
            className="rounded-lg p-1.5 text-on-surface-variant hover:bg-surface-container-low"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <div className="p-5">
          {error ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <CameraOff size={32} aria-hidden="true" className="text-on-surface-variant" />
              <p className="text-sm font-medium text-on-error-container">{error}</p>
            </div>
          ) : (
            <>
              <div
                id={SCANNER_ID}
                className="mx-auto aspect-square w-full max-w-[280px] overflow-hidden rounded-xl bg-surface-container-high"
              />
              <p className="mt-3 text-center text-sm text-on-surface-variant">
                Point the camera at the buyer&apos;s QR pass.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QrScanner;
