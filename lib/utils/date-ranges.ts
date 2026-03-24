import type { DateRange, CompareMode } from "@/types";

export interface DateWindow {
  start: Date;
  end: Date;
}

export function resolveDateWindow(range: DateRange): DateWindow {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  switch (range) {
    case "Today":
      return { start: today, end };
    case "WTD": {
      const day = today.getDay(); // 0 = Sun
      const start = new Date(today);
      start.setDate(today.getDate() - day);
      return { start, end };
    }
    case "MTD": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start, end };
    }
    case "QTD": {
      const q = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), q * 3, 1);
      return { start, end };
    }
    case "YTD": {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start, end };
    }
  }
}

export function resolveCompareWindow(range: DateRange, mode: CompareMode): DateWindow | null {
  if (mode === "none") return null;
  const current = resolveDateWindow(range);
  const ms = current.end.getTime() - current.start.getTime();

  if (mode === "prior") {
    const end = new Date(current.start.getTime() - 1);
    const start = new Date(end.getTime() - ms);
    return { start, end };
  }

  // lastyear — same window one year back
  const start = new Date(current.start);
  start.setFullYear(start.getFullYear() - 1);
  const end = new Date(current.end);
  end.setFullYear(end.getFullYear() - 1);
  return { start, end };
}

export function toIso(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function periodKeyForDate(dateRange: DateRange): string {
  const now = new Date();
  switch (dateRange) {
    case "Today":
      return `Today:${toIso(now)}`;
    case "WTD":
      return `WTD:${now.getFullYear()}-W${getWeekNumber(now)}`;
    case "MTD":
      return `MTD:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    case "QTD": {
      const q = Math.floor(now.getMonth() / 3) + 1;
      return `QTD:${now.getFullYear()}-Q${q}`;
    }
    case "YTD":
      return `YTD:${now.getFullYear()}`;
  }
}

function getWeekNumber(d: Date): number {
  const onejan = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
}
