// Load the GC InfoBase CSVs in pipeline/data/ into the database (TASKS.md Raphael Task 1 + Task 2 Phase 1).
//
// Usage (tables must exist first):
//   npm run db:migrate
//   npm run db:load
// DATABASE_URL is read from .env.local the same way `next dev` and drizzle.config.ts do (@next/env).
// Safe to re-run: the tables are emptied and refilled inside one transaction.

import { readFileSync } from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";

const DATA = path.join(process.cwd(), "pipeline", "data");

/**
 * Purpose:
 *	Read the three CSVs and load them into the database, then print the row counts.
 *
 * Args:
 *	(none; reads DATABASE_URL and pipeline/data/*.csv)
 *
 * Returns:
 *	Promise<void>: resolves when the load is committed and the connection is closed
 */
async function main() {
  loadEnvConfig(process.cwd());
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set. Add it to .env.local, then run npm run db:load.");

  // Imported after loadEnvConfig: @/db opens its connection with DATABASE_URL when it is first imported.
  const { db } = await import("@/db");
  const { loadSpendingData } = await import("@/lib/spendingData");

  const read = (name: string) => readFileSync(path.join(DATA, name), "utf8");
  try {
    const counts = await loadSpendingData({ spending: read("programs_spending.csv"), programs: read("programs.csv"), organizations: read("organizations.csv") });
    console.log("Loaded:", counts);
  } finally {
    await db.$client.end();
  }
}

main().catch((error: unknown) => {
  // Print only the message, never the connection string or the full error object.
  console.error("Load failed:", error instanceof Error ? error.message : "unknown error");
  process.exit(1);
});
