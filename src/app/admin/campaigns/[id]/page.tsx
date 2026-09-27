import Link from "next/link";
import { notFound } from "next/navigation";
import { listCampaignMembers } from "@/lib/campaigns/admin";
import { getCampaign } from "@/lib/campaigns/campaigns";
import { CampaignOverview } from "../../_components/CampaignOverview";
import { MembersSection } from "../../_components/MembersSection";
import { MpAsk } from "../../_components/MpAsk";
import { PetitionSection } from "../../_components/PetitionSection";
import { SignNow } from "../../_components/SignNow";
import { StageControls } from "../../_components/StageControls";
import { requireAdminPage } from "../../requireAdminPage";

type Props = { params: Promise<{ id: string }> };

export default async function AdminCampaignPage({ params }: Props) {
  const admin = await requireAdminPage();
  const { id } = await params;
  const campaign = await getCampaign(id, admin.id);
  if (!campaign) notFound();
  const members = await listCampaignMembers(id);
  // Sections that copy saved values into form state remount whenever the saved campaign changes.
  const version = [
    campaign.updatedAt,
    campaign.stage,
    campaign.teamNote,
    campaign.petition?.number,
    campaign.petition?.syncedAt,
  ].join("|");
  const teamGmail = process.env.TEAM_GMAIL?.trim() || null;

  return (
    <main className="space-y-10">
      <Link href="/admin" className="text-sm text-muted hover:text-ink">
        ← All campaigns
      </Link>
      <CampaignOverview campaign={campaign} starter={members.find((member) => member.isStarter)} />
      <StageControls key={`stage-${version}`} campaign={campaign} />
      <MembersSection campaignId={campaign.id} members={members} />
      <MpAsk campaign={campaign} members={members} teamGmail={teamGmail} />
      <PetitionSection campaign={campaign} />
      <SignNow campaign={campaign} members={members} teamGmail={teamGmail} />
    </main>
  );
}
