import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/db";
import { programsSpending } from "@/db/schema";
import { GET } from "@/app/api/breakdown/route";
import { getBreakdown } from "./breakdown";
import { csvRecords, loadSpendingData, parseCsv, PROGRAM_LABELS } from "./spendingData";

vi.mock("@/db", async () => {
  const { createTestDb } = await import("@/test/db");
  return { db: await createTestDb() };
});

// Small CSVs in the real GC InfoBase column layout. 9 programs with spending in 2024, one blank, one in 2023.
const SPENDING_CSV = [
  "year,program_type,program_id,organization_id,dept_code,program_code,expenditure_planned_1,expenditure_planned_2,expenditure_planned_3,expenditure",
  "2024,program,1,1,HRSD,BGN01,,,,80000000000",
  "2024,program,2,2,FIN,BUV07,,,,50000000000",
  "2024,program,3,2,FIN,BUV11,,,,40000000000",
  "2024,program,4,2,FIN,BUV08,,,,30000000000",
  "2024,program,5,3,CCRA,BRB01,,,,20000000000",
  "2024,program,6,4,TBC,BXC04,,,,10000000000",
  "2024,program,7,5,INAC,BWM03,,,,8000000000",
  "2024,program,8,6,ND,BUR03,,,,3000000000",
  "2024,program,9,6,ND,BUR04,,,,1000000000.50",
  "2024,program,10,6,ND,BUR05,,,,",
  "2023,program,1,1,HRSD,BGN01,,,,76000000000",
].join("\r\n");

const PROGRAMS_CSV = [
  "year,dept_code,organization_id,type,id,program_code,parent_type,parent_id,name_en,name_fr,tag_ids,footnote_ids",
  "2024,HRSD,1,program,1,BGN01,,,Old Age Security,Sécurité de la vieillesse,,",
  "2024,HRSD,1,core_responsibility,90,BGN01,,,\"Pensions, benefits\",x,,",
  "2024,FIN,2,program,2,BUV07,,,Canada Health Transfer,x,,",
  "2024,ND,6,program,8,BUR03,,,Aircraft Procurement,x,,",
].join("\n");

const ORGANIZATIONS_CSV = [
  "year,id,dept_code,legal_title_en,applied_title_en,description_en",
  '1990,1,HRSD,Old Legal Name,,"A long description, with a comma"',
  '2005,1,HRSD,Department of Employment and Social Development,Employment and Social Development Canada,"Line one',
  'line two with ""quotes"""',
  "1867,2,FIN,Department of Finance Canada,,",
  "1867,3,,No Department Code,,",
].join("\n");

beforeEach(async () => {
  await db.delete(programsSpending);
  await loadSpendingData({ spending: SPENDING_CSV, programs: PROGRAMS_CSV, organizations: ORGANIZATIONS_CSV });
});

describe("parseCsv", () => {
  it("handles quoted commas, doubled quotes, line breaks and a byte-order mark", () => {
    expect(parseCsv('﻿a,b\r\n"x, y","say ""hi""\nthere"\n')).toEqual([
      ["a", "b"],
      ["x, y", 'say "hi"\nthere'],
    ]);
    expect(csvRecords("a,b\n1,\n")).toEqual([{ a: "1", b: "" }]);
  });
});

describe("loadSpendingData", () => {
  it("replaces the tables instead of adding duplicates when run twice", async () => {
    const counts = await loadSpendingData({ spending: SPENDING_CSV, programs: PROGRAMS_CSV, organizations: ORGANIZATIONS_CSV });
    expect(counts).toEqual({ programs_spending: 11, programs: 4, organizations: 2, program_labels: PROGRAM_LABELS.length });
    expect(await db.select().from(programsSpending)).toHaveLength(11);
  });
});

describe("getBreakdown", () => {
  it("totals the year and lists the 7 biggest programs plus all other programs", async () => {
    const breakdown = await getBreakdown(2024);
    expect(breakdown?.fiscal_year).toBe("2024-25");
    expect(breakdown?.total_federal_spending).toBe(242_000_000_001);
    expect(breakdown?.program_count).toBe(9);
    expect(breakdown?.items).toHaveLength(8);
    expect(breakdown?.items.at(-1)).toMatchObject({ name: "All other programs", amount: 4_000_000_001 });
  });

  it("uses the plain name, the official program name and the department's latest everyday name", async () => {
    const [first] = (await getBreakdown(2024))!.items;
    expect(first).toMatchObject({
      name: "Old Age Security pensions",
      official_name: "Old Age Security",
      department: "Employment and Social Development Canada",
      amount: 80_000_000_000,
      percent: 33.1,
    });
  });

  it("returns null for a year with no data", async () => {
    expect(await getBreakdown(1999)).toBeNull();
  });
});

describe("GET /api/breakdown", () => {
  const get = (query = "") => GET(new NextRequest(`http://localhost/api/breakdown${query}`));

  it("returns 2024-25 by default", async () => {
    const res = await get();
    expect(res.status).toBe(200);
    expect((await res.json()).fiscal_year).toBe("2024-25");
  });

  it("accepts another year and 404s when it has no data", async () => {
    expect((await (await get("?year=2023")).json()).total_federal_spending).toBe(76_000_000_000);
    expect((await get("?year=2010")).status).toBe(404);
  });

  it("rejects a year that isn't a whole number", async () => {
    const res = await get("?year=abc");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_year" });
  });
});
