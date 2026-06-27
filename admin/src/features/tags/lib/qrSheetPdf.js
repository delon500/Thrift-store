import { jsPDF } from "jspdf";
import QRCode from "qrcode";

// Where a scanned sticker resolves to. This is PRINTED PERMANENTLY into every QR,
// so it must be a stable domain you own — set VITE_SCAN_BASE_URL before any real
// print run. Dev fallback points at the customer app where the scan/activation
// landing will live (Phase 2).
const SCAN_BASE = import.meta.env.VITE_SCAN_BASE_URL || "http://localhost:5173";

export const scanUrlFor = (token) => `${SCAN_BASE}/t/${token}`;

// A4 grid of QR stickers for one batch: each cell = QR (encoding the token URL)
// + the human code beneath. Async because QR rendering is promise-based.
export const downloadQrSheet = async ({
  institutionName,
  subtitle,
  tags,
  filename,
}) => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = 210;
  const margin = 12;
  const cols = 4;
  const rows = 6;
  const perPage = cols * rows;
  const colW = (pageW - margin * 2) / cols;
  const top = 18;
  const rowH = (297 - top - margin) / rows;
  const qrSize = 32;

  for (let i = 0; i < tags.length; i += 1) {
    const indexOnPage = i % perPage;

    if (indexOnPage === 0) {
      if (i > 0) doc.addPage();
      const page = Math.floor(i / perPage) + 1;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text(`${institutionName} — QR tags`, margin, 9);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(120);
      doc.text(`${subtitle || ""}   ·   page ${page}`, margin, 13);
      doc.setTextColor(0);
    }

    const r = Math.floor(indexOnPage / cols);
    const c = indexOnPage % cols;
    const cellX = margin + c * colW;
    const cellY = top + r * rowH;
    const qrX = cellX + (colW - qrSize) / 2;

    const dataUrl = await QRCode.toDataURL(scanUrlFor(tags[i].token), {
      margin: 1,
      width: 256,
    });
    doc.addImage(dataUrl, "PNG", qrX, cellY + 2, qrSize, qrSize);
    doc.setFontSize(7);
    doc.text(tags[i].code, cellX + colW / 2, cellY + qrSize + 6, {
      align: "center",
    });
  }

  doc.save(`${filename}.pdf`);
};
