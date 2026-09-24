import { describe, it, expect } from "vitest";
import { escapeCsvCell, formatCsv } from "./csv";

describe("CSV Formula Injection Neutralization", () => {
  it("escapes cells starting with risky formula characters (=, +, -, @, tab, CR)", () => {
    expect(escapeCsvCell("=SUM(A1:A10)")).toBe('"\'=SUM(A1:A10)"');
    expect(escapeCsvCell("+cmd|' /C calc'!A0")).toBe('"\'+cmd|\' /C calc\'!A0"');
    expect(escapeCsvCell("-2+3*4")).toBe('"\'-2+3*4"');
    expect(escapeCsvCell("@SUM(1,2)")).toBe('"\'@SUM(1,2)"');
    expect(escapeCsvCell("\tmalicious")).toBe('"\'\tmalicious"');
    expect(escapeCsvCell("\rmalicious")).toBe('"\'\rmalicious"');
  });

  it("leaves safe strings and numbers unescaped while properly quoting", () => {
    expect(escapeCsvCell("Bonus for Q3")).toBe('"Bonus for Q3"');
    expect(escapeCsvCell("John Doe")).toBe('"John Doe"');
    expect(escapeCsvCell(12500)).toBe('"12500"');
    expect(escapeCsvCell(null)).toBe('""');
    expect(escapeCsvCell(undefined)).toBe('""');
  });

  it("correctly quotes strings containing quotes, commas, or newlines", () => {
    const csv = formatCsv(
      ["Name", "Reason"],
      [["Alice", 'Outstanding "rockstar" performance, bonus granted']]
    );
    expect(csv).toContain('"Outstanding ""rockstar"" performance, bonus granted"');
  });

  it("neutralizes formula cells embedded in multi-row CSV output", () => {
    const csv = formatCsv(
      ["Employee", "Formula"],
      [
        ["Bob", "=1+1"],
        ["Charlie", "+calc.exe"],
      ]
    );
    expect(csv).toContain("'=1+1");
    expect(csv).toContain("'+calc.exe");
  });
});
