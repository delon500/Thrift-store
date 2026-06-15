const escapeCell = (value) => {
  const str = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

// columns: [{ label, get: (row) => value }]
export const toCsv = (rows, columns) => {
  const header = columns.map((column) => escapeCell(column.label)).join(",");
  const body = rows
    .map((row) => columns.map((column) => escapeCell(column.get(row))).join(","))
    .join("\n");

  return `${header}\n${body}`;
};

export const downloadCsv = (filename, csv) => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};
