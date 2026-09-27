import { describe, expect, it } from "vitest";
import { adminListHref, adminListOptions } from "./listOptions";

describe("adminListOptions", () => {
  it("defaults to every stage, most members first", () => {
    expect(adminListOptions({})).toEqual({ stage: undefined, sort: "members" });
  });

  it("reads a stage and the updated sort", () => {
    expect(adminListOptions({ stage: "mp_asked", sort: "updated" })).toEqual({ stage: "mp_asked", sort: "updated" });
  });

  it("ignores unknown or repeated values", () => {
    expect(adminListOptions({ stage: "official", sort: "oldest" })).toEqual({ stage: undefined, sort: "members" });
    expect(adminListOptions({ stage: ["live", "closed"], sort: ["updated"] })).toEqual({ stage: undefined, sort: "members" });
  });
});

describe("adminListHref", () => {
  it("leaves defaults out of the link", () => {
    expect(adminListHref({})).toBe("/admin");
    expect(adminListHref({ sort: "members" })).toBe("/admin");
  });

  it("adds the stage and the updated sort", () => {
    expect(adminListHref({ stage: "live" })).toBe("/admin?stage=live");
    expect(adminListHref({ stage: "live", sort: "updated" })).toBe("/admin?stage=live&sort=updated");
  });
});
