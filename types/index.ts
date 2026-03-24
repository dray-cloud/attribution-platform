export type UserRole = "admin" | "user";
export type DateRange = "Today" | "WTD" | "MTD" | "QTD" | "YTD";
export type AttrModel = "linear" | "first" | "last" | "decay";
export type PageFilter = "all" | "blog" | "service" | "landing" | "other";
export type NavView =
  | "dashboard"
  | "attribution"
  | "roi"
  | "heatmap"
  | "journeymap"
  | "paths"
  | "cta"
  | "adanalysis"
  | "spam";
export type CompareMode = "prior" | "lastyear" | "none";
export type AlertMetric = "spamRate" | "leadDrop" | "roas" | "closeRate" | "cpl";
export type AlertCondition = "gt" | "lt";
export type AlertDelivery = "inapp" | "email";
export type ServiceAreaMode = "radius" | "zips" | "county";
export type AnnotationType = "campaign" | "content" | "pause" | "budget" | "other";

export interface ClientRecord {
  id: string;
  name: string;
  industry: string | null;
  logoInitials: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  hubspotPortalId: string | null;
  active: boolean;
}

export interface ClientSpend {
  services: number;
  hubspot: number;
  ads: number;
}

export interface ServiceArea {
  mode: ServiceAreaMode;
  address: string;
  radiusMiles: number;
  zips: string[];
  counties: string[];
}

export interface ClientStatus {
  id: string;
  label: string;
  color: string;
}

export interface MonthlyData {
  month: string;
  leads: number;
  revenue: number;
  spend: number;
}

export interface PageData {
  name: string;
  url: string;
  type: "blog" | "service" | "landing" | "other";
  visits: number;
  leads: number;
  value: number;
}

export interface ZipData {
  zip: string;
  city: string;
  leads: number;
  quality: number;
  cpl: number;
  convRate: number;
  lat?: number;
  lng?: number;
  inServiceArea: boolean;
}

export interface CtaData {
  id: string;
  name: string;
  page: string;
  clicks: number;
  conversions: number;
  rate: number;
}

export interface KeywordData {
  keyword: string;
  spend: number;
  clicks: number;
  leads: number;
  sqls: number;
  deals: number;
  closed: number;
  revenue: number;
}

export interface DisqualifiedKeyword {
  keyword: string;
  totalLeads: number;
  totalBad: number;
  badPct: number;
  spend: number;
  breakdown: Record<string, number>;
}

export interface JourneyPath {
  id: string;
  contact: string;
  path: string[];
  converted: boolean;
  value: number;
}

export interface Annotation {
  id: string;
  month: string;
  text: string;
  type: AnnotationType;
  created: string;
}

export interface SavedView {
  id: string;
  name: string;
  clientId: string;
  dateRange: DateRange;
  attrModel: AttrModel;
  pageFilter: PageFilter;
  nav: NavView;
  comparePeriod: CompareMode;
  created: string;
}

export interface AlertRule {
  id: string;
  metric: AlertMetric;
  condition: AlertCondition;
  threshold: number;
  label: string;
  active: boolean;
  delivery: AlertDelivery[];
}

export interface NotificationItem {
  id: string;
  type: "alert" | "info";
  severity: "high" | "medium" | "low";
  message: string;
  time: string;
  read: boolean;
  clientName: string;
}

export interface KpiSummary {
  leads: number;
  sqls: number;
  deals: number;
  closed: number;
  revenue: number;
  spend: ClientSpend;
}

export const BENCHMARKS = {
  convRate: 2.3,
  cpl: 78,
  roas: 3.2,
  roi: 180,
  closeRate: 28,
  sqlRate: 35,
  cpc: 8.5,
  spamRate: 22,
} as const;

export const REPORT_SECTIONS = [
  { id: "summary", label: "AI Performance Summary", icon: "✦" },
  { id: "kpis", label: "KPI Summary Bar", icon: "◈" },
  { id: "funnel", label: "Lead → Deal Funnel", icon: "⬇" },
  { id: "revenue", label: "Revenue & Spend Chart", icon: "▲" },
  { id: "attribution", label: "Page Attribution", icon: "◎" },
  { id: "roi", label: "ROI & ROAS", icon: "$" },
  { id: "heatmap", label: "Lead Location Map", icon: "◉" },
  { id: "journeymap", label: "Conversion Flow Map", icon: "→" },
  { id: "cta", label: "CTA Performance", icon: "⊕" },
  { id: "adanalysis", label: "Ad Keyword Analysis", icon: "◆" },
  { id: "spam", label: "Disqualified Lead Analysis", icon: "⚑" },
] as const;

export const ALL_KPI_DEFS = [
  { id: "leads", label: "Total Leads" },
  { id: "sql", label: "SQLs" },
  { id: "deals", label: "Total Deals" },
  { id: "closed", label: "Closed Won" },
  { id: "revenue", label: "Attributed Revenue" },
  { id: "roi", label: "Marketing ROI" },
  { id: "roas", label: "ROAS" },
  { id: "cpl", label: "Cost per Lead" },
] as const;

export const DEFAULT_KPI_IDS = ["leads", "sql", "deals", "closed", "revenue", "roi", "roas"];
