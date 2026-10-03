/**
 * Utilities for the Root Travel View Expenses & Splitting Tab.
 */

export const formatMoney = (amount: number, currency: string = "$"): string => {
  const formatted = amount.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency}${formatted}`;
};

export const formatDateTimeDisplay = (dateVal?: Date | string | null): string => {
  if (!dateVal) return "-";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "-";
  const dateStr = d.toLocaleDateString(undefined, {
    month: "numeric",
    day: "numeric",
  });
  const timeStr = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${dateStr} ${timeStr}`;
};
