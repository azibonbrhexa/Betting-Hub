export function formatCurrency(amount: number | undefined | null, currency = "USD"): string {
  if (amount == null) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export function formatNumber(num: number | undefined | null): string {
  if (num == null) return "0";
  return new Intl.NumberFormat("en-US").format(num);
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
