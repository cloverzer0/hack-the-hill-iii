import { describe, expect, it } from "vitest";
import { attachErrorFor, attachMessage, PETITION_STATUS_LABELS, syncSummary } from "./petitionMessages";

describe("attachMessage", () => {
  it("confirms a petition found on ourcommons.ca", () => {
    expect(attachMessage("synced", "e-7203")).toBe("Attached and updated from ourcommons.ca.");
  });

  it("explains that a new petition takes a few days to appear", () => {
    expect(attachMessage("not_found", "e-7203")).toBe(
      "Saved. ourcommons.ca doesn't show e-7203 yet. That's normal until the Clerk of Petitions publishes it, usually 3–5 working days after the MP accepts. It updates automatically.",
    );
  });

  it("says when ourcommons.ca couldn't be reached", () => {
    expect(attachMessage("failed", "e-7203")).toBe("Saved, but we couldn't reach ourcommons.ca. Use Refresh later.");
  });
});

describe("attachErrorFor", () => {
  it.each([
    ["invalid_petition_number", "That doesn't look like a petition number (e.g. e-7203)."],
    ["petition_taken", "That petition is already attached to another campaign."],
    ["invalid_body", "Enter the petition number and its title."],
    ["server_error", "Couldn't attach the petition. Try again."],
  ])("%s", (code, message) => {
    expect(attachErrorFor(code)).toBe(message);
  });
});

describe("syncSummary", () => {
  it("sums up a refresh", () => {
    expect(syncSummary({ synced: 3, notFound: 1, failed: 0 })).toBe("3 updated · 1 not published yet · 0 failed");
  });
});

describe("PETITION_STATUS_LABELS", () => {
  it("has a label for every status", () => {
    expect(PETITION_STATUS_LABELS).toEqual({
      pending: "Waiting for ourcommons.ca",
      open: "Open for signature",
      closed: "Closed",
      presented: "Presented to the House",
      response: "Government response tabled",
    });
  });
});
