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
 * Formats a date string into a user-friendly Vietnamese format.
 * Example: "2024-04-12T..." -> "Hôm nay" or "12/04/2024"
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  const now = new Date();
  
  // Reset time for date-only comparison
  const dDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  const diffTime = dNow.getTime() - dDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  if (diffDays < 7) return `${diffDays} ngày trước`;
  
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};
