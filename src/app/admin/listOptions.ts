import type { CampaignStage } from "@/lib/campaigns/campaigns";
import { isStage } from "@/lib/campaigns/stages";

export type AdminListOptions = { stage?: CampaignStage; sort: "members" | "updated" };

type SearchParams = { stage?: string | string[]; sort?: string | string[] };

/** Reads /admin?stage=&sort=, ignoring anything it doesn't recognise. */
export function adminListOptions(params: SearchParams): AdminListOptions {
  const stage = typeof params.stage === "string" && isStage(params.stage) ? params.stage : undefined;
  return { stage, sort: params.sort === "updated" ? "updated" : "members" };
}

/** The /admin link for a filter, leaving the defaults out so links stay short. */
export function adminListHref({ stage, sort }: Partial<AdminListOptions>): string {
  const query = new URLSearchParams();
  if (stage) query.set("stage", stage);
  if (sort === "updated") query.set("sort", "updated");
  const text = query.toString();
  return text ? `/admin?${text}` : "/admin";
}
