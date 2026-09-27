import { requireUser } from "@/lib/auth";
import { getSavedRiding } from "@/lib/campaigns/riding";
import { loadDraft } from "../../loadDraft";
import { PublishStep } from "../../_components/PublishStep";
import { StepHeader } from "../../_components/StepHeader";

type Props = { params: Promise<{ id: string }> };

export default async function PublishPage({ params }: Props) {
  const draft = await loadDraft(params);
  const user = await requireUser();
  return (
    <main className="mx-auto max-w-2xl">
      <StepHeader step={2} backHref={`/petition/${draft.id}`} />
      <PublishStep draft={draft} savedRiding={await getSavedRiding(user.id)} />
    </main>
  );
}
