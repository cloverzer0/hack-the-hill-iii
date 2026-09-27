import type { PetitionCard } from "@/lib/petitions/petitions";

export type AttachSync = "synced" | "not_found" | "failed";

export const PETITION_STATUS_LABELS: Record<PetitionCard["status"], string> = {
  pending: "Waiting for ourcommons.ca",
  open: "Open for signature",
  closed: "Closed",
  presented: "Presented to the House",
  response: "Government response tabled",
};

/** What attaching a petition number did, from the API's sync result. */
export function attachMessage(sync: AttachSync, number: string): string {
  switch (sync) {
    case "synced":
      return "Attached and updated from ourcommons.ca.";
    case "not_found":
      return `Saved. ourcommons.ca doesn't show ${number} yet. That's normal until the Clerk of Petitions publishes it, usually 3–5 working days after the MP accepts. It updates automatically.`;
    case "failed":
      return "Saved, but we couldn't reach ourcommons.ca. Use Refresh later.";
  }
}

export function attachErrorFor(code: string): string {
  switch (code) {
    case "invalid_petition_number":
      return "That doesn't look like a petition number (e.g. e-7203).";
    case "petition_taken":
      return "That petition is already attached to another campaign.";
    case "invalid_body":
      return "Enter the petition number and its title.";
    default:
      return "Couldn't attach the petition. Try again.";
  }
}

export function syncSummary(result: { synced: number; notFound: number; failed: number }): string {
  return `${result.synced} updated · ${result.notFound} not published yet · ${result.failed} failed`;
}
