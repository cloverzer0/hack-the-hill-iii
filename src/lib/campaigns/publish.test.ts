import { describe, expect, it } from "vitest";
import { CONSENT_TEXT, publishErrorFor } from "./publish";

describe("publishErrorFor", () => {
  it.each([
    ["invalid_postal", "Enter a postal code like K1P 1A4."],
    ["riding_not_found", "We couldn't find a riding for that postal code."],
    ["riding_required", "Enter your postal code so we can find your riding."],
  ])("asks for the postal code on %s", (code, message) => {
    expect(publishErrorFor(code)).toEqual({ message, askPostal: true, editText: false });
  });

  it.each([
    ["lookup_failed", "Couldn't reach the riding lookup. Try again."],
    ["story_not_found", "That story is no longer available."],
  ])("explains %s", (code, message) => {
    expect(publishErrorFor(code)).toEqual({ message, askPostal: false, editText: false });
  });

  it("sends text problems back to step 1", () => {
    expect(publishErrorFor("invalid_text")).toEqual({
      message: "Your text doesn't follow the House of Commons rules yet:",
      askPostal: false,
      editText: true,
    });
  });

  it("falls back to a general message", () => {
    expect(publishErrorFor("server_error")).toEqual({
      message: "We couldn't publish your campaign. Try again.",
      askPostal: false,
      editText: false,
    });
  });
});

describe("CONSENT_TEXT", () => {
  it("matches the campaigns API wording", () => {
    expect(CONSENT_TEXT).toBe(
      "Email me about this campaign, and share my name, email and riding with the MP we ask to sponsor it.",
    );
  });
});
