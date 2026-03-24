import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";

// ─── USERS ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  role: text("role").notNull().default("user"), // "admin" | "user"
  hubspotUserId: text("hubspot_user_id"),
  hubspotPortalId: text("hubspot_portal_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── ALLOWED USERS (INVITE GATE) ──────────────────────────────────────────────
export const allowedUsers = pgTable("allowed_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  invitedBy: uuid("invited_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── CLIENTS ─────────────────────────────────────────────────────────────────
export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  industry: text("industry").notNull().default(""),
  logoInitials: text("logo_initials").notNull().default(""),
  primaryColor: text("primary_color").notNull().default("#1A5276"),
  secondaryColor: text("secondary_color").notNull().default("#154360"),
  accentColor: text("accent_color").notNull().default("#7FB3D3"),
  hubspotPortalId: text("hubspot_portal_id"),
  // Tokens stored encrypted (AES-256-GCM). iv stored alongside.
  hubspotAccessToken: text("hubspot_access_token"),
  hubspotRefreshToken: text("hubspot_refresh_token"),
  tokenIv: text("token_iv"), // hex-encoded IV for decryption
  tokenExpiresAt: timestamp("token_expires_at"),
  connectedBy: uuid("connected_by").references(() => users.id),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── CLIENT STATUSES (DISQUALIFY REASONS) ────────────────────────────────────
export const clientStatuses = pgTable("client_statuses", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  statusId: text("status_id").notNull(), // e.g. "spam", "unq_budget"
  label: text("label").notNull(),
  color: text("color").notNull().default("#888"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// ─── CLIENT SPEND ─────────────────────────────────────────────────────────────
// Shared per client per period (not per-user)
export const clientSpend = pgTable("client_spend", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  periodKey: text("period_key").notNull(), // "YYYY-MM" or "default"
  servicesCost: real("services_cost").notNull().default(0),
  hubspotCost: real("hubspot_cost").notNull().default(0),
  adSpend: real("ad_spend").notNull().default(0),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── SERVICE AREAS ───────────────────────────────────────────────────────────
export const serviceAreas = pgTable("service_areas", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" })
    .unique(),
  mode: text("mode").notNull().default("radius"), // "radius" | "zips" | "county"
  address: text("address").notNull().default(""),
  radiusMiles: real("radius_miles").notNull().default(25),
  zips: text("zips").array().notNull().default([]),
  counties: text("counties").array().notNull().default([]),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── SAVED VIEWS ─────────────────────────────────────────────────────────────
export const savedViews = pgTable("saved_views", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  dateRange: text("date_range").notNull().default("MTD"),
  attrModel: text("attr_model").notNull().default("linear"),
  pageFilter: text("page_filter").notNull().default("all"),
  nav: text("nav").notNull().default("dashboard"),
  comparePeriod: text("compare_period").notNull().default("prior"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── ANNOTATIONS ─────────────────────────────────────────────────────────────
export const annotations = pgTable("annotations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  periodKey: text("period_key").notNull(), // "MTD", "QTD", etc.
  month: text("month").notNull(), // "Jan", "Feb", ...
  text: text("text").notNull(),
  type: text("type").notNull().default("campaign"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── PERIOD NOTES ─────────────────────────────────────────────────────────────
export const periodNotes = pgTable("period_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  periodKey: text("period_key").notNull(),
  text: text("text").notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── REPORT LAYOUTS ───────────────────────────────────────────────────────────
export const reportLayouts = pgTable("report_layouts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  sections: text("sections").array().notNull().default([]),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── ALERT RULES ─────────────────────────────────────────────────────────────
export const alertRules = pgTable("alert_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }), // null = all clients
  metric: text("metric").notNull(),
  condition: text("condition").notNull().default("gt"),
  threshold: real("threshold").notNull(),
  label: text("label").notNull(),
  active: boolean("active").notNull().default(true),
  delivery: text("delivery").array().notNull().default(["inapp"]),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
  alertRuleId: uuid("alert_rule_id").references(() => alertRules.id, { onDelete: "set null" }),
  type: text("type").notNull().default("alert"),
  severity: text("severity").notNull().default("medium"),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── HUBSPOT CACHE ────────────────────────────────────────────────────────────
export const hubspotCache = pgTable("hubspot_cache", {
  id: uuid("id").defaultRandom().primaryKey(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  cacheKey: text("cache_key").notNull().unique(),
  data: jsonb("data").notNull(),
  fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
});
