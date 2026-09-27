import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCampaign } from "@/lib/campaigns/campaigns";
import { STAGE_LABELS } from "@/lib/campaigns/stages";
import { fullRequest } from "@/lib/petition";
import { JoinCampaign } from "./JoinCampaign";

type Props = { params: Promise<{ id: string }> };
const count = new Intl.NumberFormat("en-CA");

export default async function CampaignPage({ params }: Props) {
  const [{ id }, user] = await Promise.all([params, getCurrentUser()]);
  const campaign = await getCampaign(id, user?.id ?? null);
  if (!campaign) notFound();

  return (
    <main className="mx-auto max-w-2xl">
      <Link href="/campaigns" className="text-sm text-muted underline">← All campaigns</Link>
      <p className="mt-5 text-sm text-muted">On: {campaign.storyTitle}</p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold">{campaign.title}</h1>
        <span className="rounded-full bg-paper px-3 py-1 text-xs text-muted">{STAGE_LABELS[campaign.stage]}</span>
      </div>

      <section className="mt-6 rounded-xl border border-line bg-paper p-5">
        <p className="text-sm font-medium">{campaign.issue}</p>
        <p className="mt-4 text-sm">{fullRequest(campaign.request)}</p>
        <div className="mt-5 border-t border-line pt-4 text-sm text-muted">
          {count.format(campaign.memberCount)} of {count.format(campaign.target)} members · {campaign.ridingCount} ridings · gathering until {campaign.deadline}
        </div>
      </section>

      {campaign.teamNote && (
        <p className="mt-4 rounded-lg border border-line bg-paper p-4 text-sm">Update from the campaign team: {campaign.teamNote}</p>
      )}

      {campaign.isStarter && campaign.canEdit && (
        <Link href={`/campaigns/${campaign.id}/edit`} className="mt-5 inline-block text-sm text-accent underline">
          Edit campaign text
        </Link>
      )}
      {campaign.isStarter && <p className="mt-4 text-sm text-muted">You started this campaign.</p>}
      {campaign.joined && !campaign.isStarter && <p className="mt-5 text-sm font-medium">You&rsquo;re a member of this campaign.</p>}
      {campaign.canJoin && <JoinCampaign id={campaign.id} />}
      {!user && campaign.stage !== "live" && campaign.stage !== "closed" && (
        <p className="mt-5 text-sm text-muted">
          <Link className="text-accent underline" href={`/auth/login?returnTo=${encodeURIComponent(`/campaigns/${campaign.id}`)}`}>
            Sign in
          </Link>{" "}to join this campaign.
        </p>
      )}

      {campaign.petition && (
        <section className="mt-6 rounded-xl border border-line bg-paper p-5">
          <h2 className="font-semibold">Official Parliament petition</h2>
          <p className="mt-1 text-sm text-muted">{campaign.petition.number} · {campaign.petition.signatures} of {campaign.petition.signaturesNeeded} signatures · {campaign.petition.status}</p>
          {campaign.petition.status === "open" && (
            <a href={campaign.petition.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm text-accent underline">
              Sign on the Parliament website
            </a>
          )}
        </section>
      )}
    </main>
  );
}
