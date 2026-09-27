import { describe, expect, it } from "vitest";
import { isStage, STAGE_LABELS, STAGE_ORDER } from "./stages";

describe("stages", () => {
  it("lists the stages in order with their labels", () => {
    expect(STAGE_ORDER.map((stage) => STAGE_LABELS[stage])).toEqual([
      "Gathering members",
      "In review",
      "MP asked",
      "MP agreed",
      "Live",
      "Closed",
    ]);
  });

  it("recognises stage names", () => {
    expect(isStage("mp_asked")).toBe(true);
    expect(isStage("official")).toBe(false);
    expect(isStage(undefined)).toBe(false);
  });
});
