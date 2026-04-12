/**
 * VTOS Date & Currency formatting utilities.
 *
 * The backend stores all timestamps in UTC. These helpers convert
 * UTC dates to the Vietnam timezone (Asia/Ho_Chi_Minh, UTC+7)
 * before formatting, so the user always sees local time.
 */

const VN_TIMEZONE = "Asia/Ho_Chi_Minh";

/**
 * Formats a number as Vietnamese Dong (VND) currency string.
 * Example: 250000 -> "250.000đ"
 */
export const formatCurrency = (amount: number): string => {
  if (amount === 0) return "Miễn phí";
  return amount.toLocaleString("vi-VN", {
    maximumFractionDigits: 0,
  }) + "đ";
};

/**
 * Formats a date string into a user-friendly Vietnamese format
 * with relative labels for recent dates.
 * Uses Vietnam timezone (UTC+7).
 *
 * Example: "2024-04-12T10:00:00Z" -> "Hôm nay" or "12/04/2024"
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);

  // Get date parts in VN timezone for comparison
  const vnFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: VN_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const dateParts = vnFormatter.format(date); // "YYYY-MM-DD"
  const nowParts = vnFormatter.format(new Date());

  const dDate = new Date(dateParts + "T00:00:00");
  const dNow = new Date(nowParts + "T00:00:00");

  const diffTime = dNow.getTime() - dDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString("vi-VN", {
    timeZone: VN_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Formats a date string as dd/mm/yyyy in Vietnam timezone.
 * No relative labels – always returns the date.
 *
 * Example: "2024-04-12T10:00:00Z" -> "12/04/2024"
 */
export const formatDateShort = (dateString: string): string => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("vi-VN", {
    timeZone: VN_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Formats a date string as "HH:mm, dd/MM/yyyy" in Vietnam timezone.
 *
 * Example: "2024-04-12T10:30:00Z" -> "17:30, 12/04/2024"
 */
export const formatDateTime = (
  dateString: string,
  includeTime: boolean = true
): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);

  const dateStr = date.toLocaleDateString("vi-VN", {
    timeZone: VN_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  if (!includeTime) return dateStr;

  const timeStr = date.toLocaleTimeString("vi-VN", {
    timeZone: VN_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${timeStr}, ${dateStr}`;
};
