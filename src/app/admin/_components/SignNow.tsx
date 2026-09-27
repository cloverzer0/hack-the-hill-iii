"use client";

import { useState } from "react";
import type { CampaignMemberExport } from "@/lib/campaigns/admin";
import type { CampaignDetail } from "@/lib/campaigns/campaigns";
import { buildSignNow } from "@/lib/campaigns/outreach";
import { copyText } from "@/lib/clipboard";
import { composeLinks } from "@/lib/mp/sponsorEmail";

type Props = { campaign: CampaignDetail; members: CampaignMemberExport[]; teamGmail: string | null };

const buttonClass = "rounded-lg border border-line bg-paper px-4 py-2 text-center text-sm font-medium hover:border-ink";

export function SignNow({ campaign, members, teamGmail }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  if (!campaign.petition) return null;

  const email = buildSignNow({ campaign, petition: campaign.petition });
  const addresses = members.map((member) => member.email).filter((address): address is string => !!address);
  // No recipients in the link: a long member list doesn't fit in a URL, so they're pasted into BCC.
  const gmail = composeLinks({ to: "", ...email, authuser: teamGmail }).gmail;

  async function copy(text: string, done: string) {
    setStatus((await copyText(text)) ? done : "Couldn't copy. Select the text and copy it by hand.");
  }

  return (
    <section>
      <h2 className="text-lg font-semibold">Tell members to sign</h2>
      <div className="mt-3 rounded-xl border border-line bg-paper p-4 text-sm">
        <p className="font-semibold">{email.subject}</p>
        <p className="mt-3 whitespace-pre-wrap">{email.body}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => copy(`Subject: ${email.subject}\n\n${email.body}`, "Message copied.")}
          className={buttonClass}
        >
          Copy message
        </button>
        <a href={gmail} target="_blank" rel="noopener noreferrer" className={buttonClass}>
          Open in Gmail
        </a>
        <button
          type="button"
          onClick={() => copy(addresses.join(", "), `${addresses.length} member emails copied. Paste them into BCC.`)}
          className={buttonClass}
        >
          {`Copy member emails (${addresses.length})`}
        </button>
      </div>
      <p className="mt-2 text-xs text-muted">
        Paste the member emails into BCC so members don&rsquo;t see each other&rsquo;s addresses.
      </p>
      {status && <p className="mt-2 text-sm">{status}</p>}
    </section>
  );
}
