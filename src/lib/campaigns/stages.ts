import type { CampaignStage } from "./campaigns";

// How each stage reads in the app. Kept apart from the database code so client components can import it.
export const STAGE_ORDER: CampaignStage[] = ["gathering", "in_review", "mp_asked", "mp_agreed", "live", "closed"];

export const STAGE_LABELS: Record<CampaignStage, string> = {
  gathering: "Gathering members",
  in_review: "In review",
  mp_asked: "MP asked",
  mp_agreed: "MP agreed",
  live: "Live",
  closed: "Closed",
};

export function isStage(value: unknown): value is CampaignStage {
  return typeof value === "string" && (STAGE_ORDER as string[]).includes(value);
}
