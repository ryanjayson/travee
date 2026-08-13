export const safeFormatTime = (
  dateValue: Date | string | null | undefined,
  fallback: string = "--:--"
): string => {
  if (!dateValue) return fallback;
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime()) || d.getTime() <= 0) return fallback;
    return d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (e) {
    return fallback;
  }
};

export const safeFormatDate = (
  dateValue: Date | string | null | undefined,
  fallback: string = "N/A"
): string => {
  if (!dateValue) return fallback;
  try {
    const d = new Date(dateValue);
    if (isNaN(d.getTime()) || d.getTime() <= 0) return fallback;
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (e) {
    return fallback;
  }
};
