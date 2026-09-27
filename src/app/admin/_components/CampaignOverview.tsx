import type { CampaignMemberExport } from "@/lib/campaigns/admin";
import type { CampaignDetail } from "@/lib/campaigns/campaigns";
import { STAGE_LABELS } from "@/lib/campaigns/stages";
import { formatDate } from "../format";

type Props = { campaign: CampaignDetail; starter: CampaignMemberExport | undefined };

export function CampaignOverview({ campaign, starter }: Props) {
  const starterText = starter
    ? [starter.name ?? "No name", starter.email ?? "no email"].join(" · ")
    : campaign.starterFirstName;

  return (
    <section>
      <p className="text-sm text-muted">On {campaign.storyTitle}</p>
      <h1 className="mt-1 text-2xl font-semibold">{campaign.title}</h1>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted">Starter</dt>
          <dd>{starterText}</dd>
        </div>
        <div>
          <dt className="text-muted">Started</dt>
          <dd>{formatDate(campaign.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-muted">Stage</dt>
          <dd>{STAGE_LABELS[campaign.stage]}</dd>
        </div>
        <div>
          <dt className="text-muted">Team note</dt>
          <dd>{campaign.teamNote ?? "None"}</dd>
        </div>
      </dl>
      <article className="mt-6 rounded-xl border border-line bg-paper p-5 text-sm">
        <p className="whitespace-pre-wrap">{campaign.issue}</p>
        <p className="mt-3 whitespace-pre-wrap">{`${campaign.opening} ${campaign.request}`}</p>
      </article>
    </section>
  );
}
