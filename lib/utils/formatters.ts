export const fmt = (n: number): string =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`;

export const fmtN = (n: number): string => n.toLocaleString();

export const pct = (a: number, b: number): string =>
  b ? ((a / b) * 100).toFixed(1) + "%" : "—";

export const r2 = (n: number): number => Math.round(n * 100) / 100;

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function classifyPageType(url: string): "blog" | "service" | "landing" | "other" {
  const u = url.toLowerCase();
  if (u.includes("/blog") || u.includes("/post") || u.includes("/article")) return "blog";
  if (u.includes("/service") || u.includes("/insurance") || u.includes("/repair")) return "service";
  if (u.includes("/landing") || u.includes("/lp/") || u.includes("inspection") || u.includes("quote") || u.includes("free-")) return "landing";
  return "other";
}
