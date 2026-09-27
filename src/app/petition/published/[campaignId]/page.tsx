import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCampaign } from "@/lib/campaigns/campaigns";
import { PublishedSummary } from "../../_components/PublishedSummary";
import { StepHeader } from "../../_components/StepHeader";

type Props = {
  params: Promise<{ campaignId: string }>;
  searchParams: Promise<{ existing?: string | string[] }>;
};

export default async function PublishedPage({ params, searchParams }: Props) {
  const [{ campaignId }, { existing }] = await Promise.all([params, searchParams]);
  const user = await requireUser();
  const campaign = await getCampaign(campaignId, user.id);
  if (!campaign) notFound();
  return (
    <main className="mx-auto max-w-2xl">
      <StepHeader step={3} backHref="/dev/petition" />
      <PublishedSummary campaign={campaign} existing={existing === "1"} />
    </main>
  );
}
