import { formatDistanceToNow, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export const APP_TIMEZONE = "Asia/Kolkata";

export function formatDateTime(
  date: Date | string | null | undefined,
  pattern: string = "dd MMM yyyy, hh:mm a"
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isNaN(d.getTime())) return "—";
  return formatInTimeZone(d, APP_TIMEZONE, pattern);
}

export function formatDateOnly(
  date: Date | string | null | undefined,
  pattern: string = "dd MMM yyyy"
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isNaN(d.getTime())) return "—";
  return formatInTimeZone(d, APP_TIMEZONE, pattern);
}

export function formatMonthYear(
  date: Date | string | null | undefined
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isNaN(d.getTime())) return "—";
  return formatInTimeZone(d, APP_TIMEZONE, "MMMM yyyy");
}

export function formatRelativeTime(
  date: Date | string | null | undefined
): string {
  if (!date) return "—";
  const d = typeof date === "string" ? parseISO(date) : date;
  if (isNaN(d.getTime())) return "—";
  return formatDistanceToNow(d, { addSuffix: true });
}
