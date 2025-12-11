import { format, parseISO } from "date-fns";

import { isValid } from "date-fns";

export function getMemberSinceFormatted(
  createdAt?: string | null
): string | null {
  if (!createdAt) return null; // defensive check

  // Parse ISO safely (date-fns prefers parseISO)
  const date = parseISO(createdAt);

  // Validate the date before formatting
  if (!isValid(date)) return null;

  return format(date, "MMMM dd yyyy");
}

export function emailConfirmedAt(isoString: string) {
  // Remove microseconds so JS can parse
  if (!isoString) return null;
  const cleaned = isoString.replace(/(\.\d{3})\d+Z$/, "$1Z");

  const date = parseISO(cleaned);

  return format(date, "MMM d h:mm yyyy");
}
