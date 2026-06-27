import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const PRIMARY = [15, 122, 82]; // #0f7a52

// Build a branded, metadata-headed PDF table report.
// columns: [{ label, get }]  (same shape as the CSV columns)
// meta/summary: [[label, value], ...]
export const exportPdf = ({ title, meta = [], summary = [], columns, rows, filename }) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const marginX = 40;
  let y = 44;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...PRIMARY);
  doc.text(`${title} report`, marginX, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(70);
  y += 16;
  doc.text(meta.map(([k, v]) => `${k}: ${v}`).join("    "), marginX, y);

  if (summary.length > 0) {
    y += 14;
    doc.setTextColor(...PRIMARY);
    doc.setFont("helvetica", "bold");
    doc.text(summary.map(([k, v]) => `${k}: ${v}`).join("     "), marginX, y);
    doc.setFont("helvetica", "normal");
  }

  autoTable(doc, {
    startY: y + 12,
    head: [columns.map((c) => c.label)],
    body: rows.map((r) =>
      columns.map((c) => {
        const value = c.get(r);
        return value === null || value === undefined ? "" : String(value);
      }),
    ),
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: PRIMARY, textColor: 255 },
    alternateRowStyles: { fillColor: [246, 242, 236] },
    margin: { left: marginX, right: marginX },
  });

  doc.save(`${filename}.pdf`);
};
