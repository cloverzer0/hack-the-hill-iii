"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { MpCard } from "@/components/mp/MpCard";
import { MpSearch } from "@/components/mp/MpSearch";
import { apiFetch } from "@/lib/apiFetch";
import type { CampaignMemberExport } from "@/lib/campaigns/admin";
import type { CampaignDetail } from "@/lib/campaigns/campaigns";
import { buildMpAsk } from "@/lib/campaigns/outreach";
import { copyText } from "@/lib/clipboard";
import { composeLinks } from "@/lib/mp/sponsorEmail";
import type { Mp } from "@/lib/mp/types";

type Props = { campaign: CampaignDetail; members: CampaignMemberExport[]; teamGmail: string | null };

const buttonClass = "rounded-lg border border-line bg-paper px-4 py-2 text-center text-sm font-medium hover:border-ink";

export function MpAsk({ campaign, members, teamGmail }: Props) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [searching, setSearching] = useState(false);
  const [mp, setMp] = useState<Mp | null>(campaign.sponsorMp);
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState<"idle" | "copied" | "failed">("idle");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function pick(picked: Mp) {
    setMp(picked);
    setSearching(false);
    setCopied("idle");
    setNote(`We've asked ${picked.name} (${picked.riding}) to sponsor this campaign.`);
  }

  const email = mp ? buildMpAsk({ campaign, mp, members }) : null;
  const links = mp?.email && email ? composeLinks({ to: mp.email, ...email, authuser: teamGmail }) : null;

  async function copy() {
    if (!mp || !email) return;
    const text = `To: ${mp.email ?? ""}\nSubject: ${email.subject}\n\n${email.body}`;
    setCopied((await copyText(text)) ? "copied" : "failed");
  }

  async function markAsked() {
    setSaving(true);
    setError(null);
    const teamNote = note.trim();
    try {
      await apiFetch(`/api/admin/campaigns/${campaign.id}`, {
        method: "PATCH",
        body: { stage: "mp_asked", sponsorMp: mp, sponsorRequestedAt: new Date().toISOString(), ...(teamNote ? { teamNote } : {}) },
      });
      startRefresh(() => router.refresh());
    } catch {
      setError("Couldn't save that. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h2 className="text-lg font-semibold">Ask an MP</h2>
      {searching ? (
        <div className="mt-3">
          <MpSearch onPick={pick} />
        </div>
      ) : !mp ? (
        <button type="button" onClick={() => setSearching(true)} className={`mt-3 ${buttonClass}`}>
          Choose an MP
        </button>
      ) : (
        <div className="mt-3 space-y-4">
          <MpCard mp={mp} />
          <button type="button" onClick={() => setSearching(true)} className="text-sm underline">
            Choose a different MP
          </button>

          {email && (
            <div className="rounded-xl border border-line bg-paper p-4 text-sm">
              <p className="font-semibold">{email.subject}</p>
              <p className="mt-3 whitespace-pre-wrap wrap-anywhere">{email.body}</p>
            </div>
          )}
          {!mp.email && (
            <p className="text-sm text-danger">This MP has no public email address. Copy the email and send it another way.</p>
          )}
          <div className="flex flex-wrap gap-2">
            {links && (
              <>
                <a href={links.gmail} target="_blank" rel="noopener noreferrer" className={buttonClass}>
                  Open in Gmail
                </a>
                <a href={links.outlook} target="_blank" rel="noopener noreferrer" className={buttonClass}>
                  Open in Outlook
                </a>
                <a href={links.mailto} className={buttonClass}>
                  Use my email app
                </a>
              </>
            )}
            <button type="button" onClick={copy} className={buttonClass}>
              {copied === "copied" ? "Copied" : "Copy"}
            </button>
          </div>
          {copied === "failed" && (
            <p className="text-xs text-danger">Couldn&rsquo;t copy. Select the email above and copy it by hand.</p>
          )}

          <label className="block text-sm font-semibold">
            Team note when marking as asked
            <span className="block text-xs font-normal text-muted">Shown publicly on the campaign. Leave it empty to skip.</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={2000}
              className="mt-2 min-h-16 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm font-normal"
            />
          </label>
          <button
            type="button"
            disabled={saving || refreshing}
            onClick={markAsked}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper disabled:opacity-60"
          >
            Mark as MP asked
          </button>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
