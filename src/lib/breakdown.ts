import { and, count, desc, eq, isNotNull, sum } from "drizzle-orm";
import { db } from "@/db";
import { organizations, programLabels, programs, programsSpending } from "@/db/schema";
import { toBreakdown, type Breakdown } from "@/shared/breakdown";

export const DEFAULT_YEAR = 2024;
const TOP_N = 7;

/**
 * Purpose:
 *	Read one fiscal year's breakdown from the database: the total, the program count and the biggest programs with their names.
 *
 * Args:
 *	- year: the data's year, e.g. 2024 for 2024-25
 *
 * Returns:
 *	Promise<Breakdown | null>: the breakdown, or null when the year has no spending rows
 */
export async function getBreakdown(year: number = DEFAULT_YEAR): Promise<Breakdown | null> {
  const hasSpending = and(eq(programsSpending.year, year), isNotNull(programsSpending.expenditure));

  const [totals] = await db
    .select({ total: sum(programsSpending.expenditure).mapWith(Number), programCount: count() })
    .from(programsSpending)
    .where(hasSpending);
  if (!totals || totals.programCount === 0) return null;

  const top = await db
    .select({
      deptCode: programsSpending.deptCode,
      programCode: programsSpending.programCode,
      amount: programsSpending.expenditure,
      officialName: programs.nameEn,
      appliedTitle: organizations.appliedTitleEn,
      legalTitle: organizations.legalTitleEn,
      plainName: programLabels.plainName,
      description: programLabels.description,
    })
    .from(programsSpending)
    .leftJoin(
      programs,
      and(
        eq(programs.year, programsSpending.year),
        eq(programs.deptCode, programsSpending.deptCode),
        eq(programs.programCode, programsSpending.programCode),
        eq(programs.type, "program"),
      ),
    )
    .leftJoin(organizations, eq(organizations.deptCode, programsSpending.deptCode))
    .leftJoin(
      programLabels,
      and(eq(programLabels.deptCode, programsSpending.deptCode), eq(programLabels.programCode, programsSpending.programCode)),
    )
    .where(hasSpending)
    .orderBy(desc(programsSpending.expenditure))
    .limit(TOP_N);

  return toBreakdown(
    year,
    totals.total,
    totals.programCount,
    top.map((row) => ({
      dept_code: row.deptCode,
      program_code: row.programCode,
      amount: row.amount ?? 0,
      official_name: row.officialName,
      department: row.appliedTitle ?? row.legalTitle,
      plain_name: row.plainName,
      description: row.description,
    })),
  );
}
