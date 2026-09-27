import { db } from "@/db";
import { organizations, programLabels, programs, programsSpending } from "@/db/schema";

// Loads the GC InfoBase CSVs into the spending tables. Run through `npm run db:load` (pipeline/load_db.ts).

export type SpendingCsvFiles = { spending: string; programs: string; organizations: string };

// Hand-written plain-English names for the biggest 2024-25 programs, keyed by dept_code + program_code.
export const PROGRAM_LABELS = [
  { deptCode: "HRSD", programCode: "BGN01", plainName: "Old Age Security pensions", description: "Monthly payments to Canadians aged 65 and over." },
  { deptCode: "FIN", programCode: "BUV07", plainName: "Health care transfer to provinces", description: "The Canada Health Transfer, which helps provinces and territories pay for health care." },
  { deptCode: "FIN", programCode: "BUV11", plainName: "Interest on the national debt", description: "Interest paid on money the federal government has borrowed." },
  { deptCode: "FIN", programCode: "BUV08", plainName: "Equalization and social transfers to provinces", description: "Equalization, the Canada Social Transfer and territorial funding, which help provinces and territories pay for services." },
  { deptCode: "CCRA", programCode: "BRB01", plainName: "Benefits paid by the Canada Revenue Agency", description: "Benefit payments the Canada Revenue Agency sends directly to people." },
  { deptCode: "TBC", programCode: "BXC04", plainName: "Pensions and benefits for public servants", description: "The government's share, as employer, of federal workers' pensions, health and dental plans." },
  { deptCode: "INAC", programCode: "BWM03", plainName: "Settling Indigenous land claims", description: "Payments to First Nations to settle specific claims about historic treaty and land obligations." },
];

const BATCH = 2000;

/**
 * Purpose:
 *	Parse CSV text into rows, handling quoted fields that contain commas, quotes ("") and line breaks.
 *
 * Args:
 *	- text: the whole CSV file as a string
 *
 * Returns:
 *	string[][]: one array of cell values per row, header row included
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = text.charCodeAt(0) === 0xfeff ? 1 : 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/**
 * Purpose:
 *	Turn CSV text into objects keyed by column name.
 *
 * Args:
 *	- text: the whole CSV file as a string, header row first
 *
 * Returns:
 *	Record<string, string>[]: one object per data row; empty cells are ''
 */
export function csvRecords(text: string): Record<string, string>[] {
  const [header = [], ...rows] = parseCsv(text);
  return rows.filter((row) => row.length > 1).map((row) => Object.fromEntries(header.map((column, i) => [column, row[i] ?? ""])));
}

/**
 * Purpose:
 *	Turn an empty CSV cell into null so the database stores a real NULL.
 *
 * Args:
 *	- value: the raw cell text
 *
 * Returns:
 *	string | null: the text, or null when it was empty
 */
function orNull(value: string): string | null {
  return value === "" ? null : value;
}

/**
 * Purpose:
 *	Keep only the latest record of each department from organizations.csv (a department appears once per change).
 *
 * Args:
 *	- records: organizations.csv rows from csvRecords()
 *
 * Returns:
 *	Record<string, string>[]: one row per dept_code
 */
function latestPerDepartment(records: Record<string, string>[]): Record<string, string>[] {
  const latest = new Map<string, Record<string, string>>();
  for (const row of [...records].sort((a, b) => Number(a.year || 0) - Number(b.year || 0))) {
    if (row.dept_code) latest.set(row.dept_code, row);
  }
  return [...latest.values()];
}

/**
 * Purpose:
 *	Split a list into chunks, so each insert stays under Postgres's limit on query parameters.
 *
 * Args:
 *	- items: the rows to insert
 *	- size: rows per chunk
 *
 * Returns:
 *	T[][]: the chunks, in order
 */
function chunks<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Purpose:
 *	Replace everything in the spending tables with the CSV contents, in one transaction (a failed load changes nothing).
 *
 * Args:
 *	- files: the text of programs_spending.csv, programs.csv and organizations.csv
 *
 * Returns:
 *	Promise<object>: how many rows went into each table
 */
export async function loadSpendingData(files: SpendingCsvFiles) {
  const spendingRows = csvRecords(files.spending).map((r) => ({
    year: Number(r.year),
    deptCode: r.dept_code,
    programCode: r.program_code,
    expenditure: r.expenditure === "" ? null : Number(r.expenditure),
  }));
  const programRows = csvRecords(files.programs)
    .filter((r) => r.program_code)
    .map((r) => ({ year: Number(r.year), deptCode: r.dept_code, programCode: r.program_code, type: r.type, nameEn: orNull(r.name_en) }));
  const organizationRows = latestPerDepartment(csvRecords(files.organizations)).map((r) => ({
    deptCode: r.dept_code,
    legalTitleEn: orNull(r.legal_title_en),
    appliedTitleEn: orNull(r.applied_title_en),
  }));

  await db.transaction(async (tx) => {
    await tx.delete(programsSpending);
    await tx.delete(programs);
    await tx.delete(organizations);
    await tx.delete(programLabels);
    for (const batch of chunks(spendingRows, BATCH)) await tx.insert(programsSpending).values(batch);
    for (const batch of chunks(programRows, BATCH)) await tx.insert(programs).values(batch);
    for (const batch of chunks(organizationRows, BATCH)) await tx.insert(organizations).values(batch);
    await tx.insert(programLabels).values(PROGRAM_LABELS);
  });

  return {
    programs_spending: spendingRows.length,
    programs: programRows.length,
    organizations: organizationRows.length,
    program_labels: PROGRAM_LABELS.length,
  };
}
