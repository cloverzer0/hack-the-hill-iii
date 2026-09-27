import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime } from "./format";

describe("formatDate", () => {
  it("shows a dash when there is no date", () => {
    expect(formatDate(null)).toBe("—");
    expect(formatDateTime(null)).toBe("—");
  });

  it("uses Ottawa time, so a late-evening UTC time lands on the Ottawa day", () => {
    // 03:00 UTC on Sept 26 is 23:00 on Sept 25 in Ottawa.
    expect(formatDate("2026-09-26T03:00:00.000Z")).toContain("25");
    expect(formatDate("2026-09-26T03:00:00.000Z")).toContain("2026");
  });
});
