import { describe, expect, it } from "vitest";
import type { CampaignMemberExport } from "./admin";
import { membersCsv, ridingBreakdown } from "./memberList";

const member = (overrides: Partial<CampaignMemberExport>): CampaignMemberExport => ({
  name: "Alice Martin",
  email: "alice@example.com",
  riding: "Ottawa Centre",
  isStarter: false,
  joinedAt: "2026-09-26T12:00:00.000Z",
  ...overrides,
});

describe("ridingBreakdown", () => {
  it("counts members per riding, biggest first, with unknown ridings last", () => {
    const members = [
      member({ riding: "Ottawa Centre" }),
      member({ riding: "Ottawa South" }),
      member({ riding: "Ottawa Centre" }),
      member({ riding: null }),
    ];
    expect(ridingBreakdown(members)).toEqual([
      { riding: "Ottawa Centre", count: 2 },
      { riding: "Ottawa South", count: 1 },
      { riding: "Unknown riding", count: 1 },
    ]);
  });

  it("orders ties by riding name", () => {
    expect(ridingBreakdown([member({ riding: "Spadina—Harbourfront" }), member({ riding: "Kanata" })])).toEqual([
      { riding: "Kanata", count: 1 },
      { riding: "Spadina—Harbourfront", count: 1 },
    ]);
  });
});

describe("membersCsv", () => {
  it("writes a header and one line per member", () => {
    expect(membersCsv([member({}), member({ name: null, email: "bob@example.com", riding: null })])).toBe(
      "name,email,riding,joined_at\r\n" +
        "Alice Martin,alice@example.com,Ottawa Centre,2026-09-26T12:00:00.000Z\r\n" +
        ",bob@example.com,,2026-09-26T12:00:00.000Z\r\n",
    );
  });

  it("quotes values with commas, quotes or line breaks", () => {
    const csv = membersCsv([member({ name: 'Martin, "Al"\nJr' })]);
    expect(csv.split("\r\n")[1]).toBe('"Martin, ""Al""\nJr",alice@example.com,Ottawa Centre,2026-09-26T12:00:00.000Z');
  });

  it("stops spreadsheet apps from running a name as a formula", () => {
    const csv = membersCsv([
      member({ name: "=HYPERLINK(1)" }),
      member({ name: "@SUM(A1), x" }),
      member({ name: "\t=HYPERLINK(1)" }),
      member({ name: "\r=HYPERLINK(1)" }),
    ]);
    const lines = csv.split("\r\n");
    expect(lines[1].startsWith("'=HYPERLINK(1),")).toBe(true);
    expect(lines[2].startsWith(`"'@SUM(A1), x",`)).toBe(true);
    expect(lines[3].startsWith("'\t=HYPERLINK(1),")).toBe(true);
    expect(csv).toContain("\"'\r=HYPERLINK(1)\",alice@example.com");
  });
});
