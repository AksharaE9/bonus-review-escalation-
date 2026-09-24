/**
 * Secure CSV string sanitizer and cell formatter.
 * Defends against CSV formula injection attacks by neutralizing leading formula prefixes (=, +, -, @, \t, \r).
 */
export function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) {
    return '""';
  }

  let str = String(val).replace(/"/g, '""');

  // Prevent formula injection in spreadsheet software (Excel, Google Sheets, LibreOffice)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  return `"${str}"`;
}

export function formatCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const headerLine = headers.map((h) => escapeCsvCell(h)).join(",");
  const dataLines = rows.map((row) => row.map((cell) => escapeCsvCell(cell)).join(","));
  return [headerLine, ...dataLines].join("\r\n");
}
