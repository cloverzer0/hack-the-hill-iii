import { redirect } from "next/navigation";
import { loadCampaign } from "../../loadCampaign";
import { EditCampaign } from "../../_components/EditCampaign";
import { ProcessExplainer } from "../../_components/ProcessExplainer";
import { StepHeader } from "../../_components/StepHeader";

type Props = { params: Promise<{ id: string }> };

export default async function EditCampaignPage({ params }: Props) {
  const campaign = await loadCampaign(params);
  if (!campaign.canEdit) redirect(`/campaigns/${campaign.id}`);
  return (
    <main>
      <StepHeader step={1} backHref={`/campaigns/${campaign.id}`} />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <EditCampaign
          id={campaign.id}
          storyTitle={campaign.storyTitle}
          initial={{ title: campaign.title, issue: campaign.issue, request: campaign.request }}
        />
        <ProcessExplainer />
      </div>
    </main>
  );
}
