import { index, integer, jsonb, numeric, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid, date } from "drizzle-orm/pg-core";
import type { Mp } from "@/lib/mp/types";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email"),
  name: text("name"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }).notNull().defaultNow(),
});

export const drafts = pgTable(
  "drafts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    storyId: text("story_id").notNull(),
    storyTitle: text("story_title").notNull(),
    title: text("title").notNull(),
    issue: text("issue").notNull(),
    request: text("request").notNull(),
    mp: jsonb("mp").$type<Mp>(),
    sponsorEmail: text("sponsor_email"),
    sponsorRequestedAt: timestamp("sponsor_requested_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("drafts_user_id_idx").on(t.userId)],
);

export type DraftRow = typeof drafts.$inferSelect;

export const campaignStage = pgEnum("campaign_stage", ["gathering", "in_review", "mp_asked", "mp_agreed", "live", "closed"]);

export const campaigns = pgTable(
  "campaigns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storyId: text("story_id").notNull(),
    storyTitle: text("story_title").notNull(),
    startedBy: text("starter_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    issue: text("issue").notNull(),
    request: text("request").notNull(),
    target: integer("target").notNull().default(1000),
    deadline: date("deadline").notNull(),
    status: campaignStage("stage").notNull().default("gathering"),
    note: text("team_note"),
    sponsorMp: jsonb("sponsor_mp").$type<Mp>(),
    sponsorRequestedAt: timestamp("sponsor_requested_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("campaigns_story_started_by_idx").on(t.storyId, t.startedBy), index("campaigns_story_idx").on(t.storyId)],
);

export const campaignSupporters = pgTable(
  "campaign_members",
  {
    campaignId: uuid("campaign_id")
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    riding: text("riding").notNull(),
    consentedAt: timestamp("consented_at", { withTimezone: true }).notNull().defaultNow(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.campaignId, t.userId] }), index("campaign_members_campaign_idx").on(t.campaignId)],
);

export type CampaignRow = typeof campaigns.$inferSelect;
export type CampaignSupporterRow = typeof campaignSupporters.$inferSelect;

export const petitions = pgTable("petitions", {
  number: text("number").primaryKey(),
  campaignId: uuid("campaign_id").notNull().references(() => campaigns.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  sponsorName: text("sponsor_name"),
  sponsorRiding: text("sponsor_riding"),
  signatures: integer("signatures").notNull().default(0),
  openedAt: timestamp("opened_at", { withTimezone: true }),
  closesAt: timestamp("closes_at", { withTimezone: true }),
  presentedAt: timestamp("presented_at", { withTimezone: true }),
  responseTabledAt: timestamp("response_tabled_at", { withTimezone: true }),
  syncedAt: timestamp("synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("petitions_campaign_id_unique").on(t.campaignId)]);

export type PetitionRow = typeof petitions.$inferSelect;

// GC InfoBase federal spending (open.canada.ca), loaded by `npm run db:load` (pipeline/load_db.mts).
// Sources are in VERIFIED_SOURCES.md. year 2024 = fiscal year April 2024 to March 2025.

// programs_spending.csv: actual spending per program per fiscal year.
export const programsSpending = pgTable(
  "programs_spending",
  {
    year: integer("year").notNull(),
    deptCode: text("dept_code").notNull(),
    programCode: text("program_code").notNull(),
    expenditure: numeric("expenditure", { mode: "number" }),
  },
  (t) => [primaryKey({ columns: [t.year, t.deptCode, t.programCode] })],
);

// programs.csv: program names. The same code can be both a program and a core responsibility, so type is in the key.
export const programs = pgTable(
  "programs",
  {
    year: integer("year").notNull(),
    deptCode: text("dept_code").notNull(),
    programCode: text("program_code").notNull(),
    type: text("type").notNull(),
    nameEn: text("name_en"),
  },
  (t) => [primaryKey({ columns: [t.year, t.deptCode, t.programCode, t.type] })],
);

// organizations.csv: one row per department, from its latest record.
export const organizations = pgTable("organizations", {
  deptCode: text("dept_code").primaryKey(),
  legalTitleEn: text("legal_title_en"),
  appliedTitleEn: text("applied_title_en"),
});

// Hand-written plain-English names for the biggest programs, shown on the receipt.
export const programLabels = pgTable(
  "program_labels",
  {
    deptCode: text("dept_code").notNull(),
    programCode: text("program_code").notNull(),
    plainName: text("plain_name").notNull(),
    description: text("description").notNull(),
  },
  (t) => [primaryKey({ columns: [t.deptCode, t.programCode] })],
);
