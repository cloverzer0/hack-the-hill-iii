import { index, integer, jsonb, numeric, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
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
