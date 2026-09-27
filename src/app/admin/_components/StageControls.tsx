"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ApiError, apiFetch } from "@/lib/apiFetch";
import type { CampaignDetail, CampaignStage } from "@/lib/campaigns/campaigns";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/campaigns/stages";

type Props = { campaign: Pick<CampaignDetail, "id" | "stage" | "teamNote" | "petition"> };

export function StageControls({ campaign }: Props) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState(campaign.teamNote ?? "");
  const [error, setError] = useState<string | null>(null);

  async function save(change: { stage?: CampaignStage; teamNote?: string | null }) {
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/api/admin/campaigns/${campaign.id}`, { method: "PATCH", body: change });
      startRefresh(() => router.refresh());
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.code === "needs_petition"
          ? "Attach the ourcommons.ca petition first."
          : "Couldn't save that. Try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  const busy = saving || refreshing;

  return (
    <section>
      <h2 className="text-lg font-semibold">Stage</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {STAGE_ORDER.map((stage) => {
          const current = stage === campaign.stage;
          const needsPetition = stage === "live" && !campaign.petition;
          return (
            <button
              key={stage}
              type="button"
              aria-pressed={current}
              disabled={busy || current || needsPetition}
              onClick={() => save({ stage })}
              className={`rounded-full border px-3 py-1 text-sm ${
                current ? "border-ink bg-ink text-paper" : "border-line bg-paper disabled:opacity-50"
              }`}
            >
              {STAGE_LABELS[stage]}
            </button>
          );
        })}
      </div>
      {!campaign.petition && (
        <p className="mt-2 text-xs text-muted">Live needs the ourcommons.ca petition attached first.</p>
      )}

      <label className="mt-6 block text-sm font-semibold">
        Team note
        <span className="block text-xs font-normal text-muted">Shown publicly on the campaign.</span>
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={2000}
          className="mt-2 min-h-20 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm font-normal"
        />
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={() => save({ teamNote: note.trim() || null })}
        className="mt-2 rounded-lg border border-ink px-4 py-2 text-sm disabled:opacity-60"
      >
        Save note
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
