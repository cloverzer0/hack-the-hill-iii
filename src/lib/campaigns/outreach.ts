import type { Mp } from "@/lib/mp/types";
import { PETITION_OPENING, SIGNATURES_NEEDED } from "./rules";

// Emails our team sends by hand from the admin page. No server code, so the admin page's client components can use it.

export type Email = { subject: string; body: string };

type CampaignText = { title: string; issue: string; request: string };

function count(n: number, one: string, many: string): string {
  return `${n.toLocaleString("en-CA")} ${n === 1 ? one : many}`;
}

/** The email asking an MP to sponsor a campaign, with the member numbers they can verify. */
export function buildMpAsk({
  campaign,
  mp,
  members,
}: {
  campaign: CampaignText;
  mp: Pick<Mp, "name" | "riding">;
  members: { riding: string | null }[];
}): Email {
  const ridings = new Set(members.map((member) => member.riding).filter(Boolean)).size;
  const local = members.filter((member) => member.riding === mp.riding).length;
  const localText = local > 0 ? `, including ${local.toLocaleString("en-CA")} in ${mp.riding}` : "";

  return {
    subject: `Request to sponsor an e-petition: ${campaign.title}`,
    body: [
      `Dear ${mp.name},`,
      "",
      "We're writing from wheredoesmytaxgo, where Canadians follow federal spending and organize around it. One of our campaigns is looking for an MP to sponsor it:",
      "",
      campaign.title,
      "",
      campaign.issue,
      "",
      `${PETITION_OPENING} ${campaign.request}`,
      "",
      `This campaign has ${count(members.length, "member", "members")} from ${count(ridings, "riding", "ridings")}${localText}. We can share the member list so you can verify them.`,
      "",
      `Would you sponsor it? Once you agree, we'll create it on ourcommons.ca and name you as the sponsor. Sponsoring doesn't mean you endorse it: it lets Canadians sign it and, with ${SIGNATURES_NEEDED} signatures, have it presented in the House.`,
      "",
      "Thank you,",
      "The wheredoesmytaxgo team",
    ].join("\n"),
  };
}
