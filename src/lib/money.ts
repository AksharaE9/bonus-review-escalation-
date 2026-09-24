/**
 * Format currency amount using Indian numbering format (e.g. ₹1,25,000.00 or ₹25,000)
 */
export function formatINR(
  amount: number | string,
  options?: {
    showDecimals?: boolean;
    currency?: string;
  }
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "₹0";

  const { showDecimals = false, currency = "INR" } = options || {};

  const formatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });

  return formatter.format(num);
}

/**
 * Parses a numeric or currency formatted string into standard string representation with 2 decimal places
 */
export function toNumericString(val: number | string): string {
  if (typeof val === "number") {
    return val.toFixed(2);
  }
  const clean = val.replace(/[^0-9.-]+/g, "");
  const num = parseFloat(clean);
  return isNaN(num) ? "0.00" : num.toFixed(2);
}
