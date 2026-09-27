"use client";

import type { CampaignMemberExport } from "@/lib/campaigns/admin";
import { membersCsv, ridingBreakdown } from "@/lib/campaigns/memberList";
import { formatDate } from "../format";
import { useState } from "react";

type Props = { campaignId: string; members: CampaignMemberExport[] };

const cell = "p-3 whitespace-nowrap";

export function MembersSection({ campaignId, members }: Props) {
  const [showAll, setShowAll] = useState(false);
  const ridings = ridingBreakdown(members);
  const visibleMembers = showAll ? members : members.slice(0, 100);

  function download() {
    const url = URL.createObjectURL(new Blob(["\uFEFF", membersCsv(members)], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `campaign-${campaignId.slice(0, 8)}-members.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{`Members (${members.length.toLocaleString("en-CA")})`}</h2>
        <button type="button" onClick={download} className="rounded-lg border border-ink px-4 py-2 text-sm">
          Download CSV
        </button>
      </div>
      <p className="mt-2 text-sm text-muted">{ridings.map((row) => `${row.riding} ${row.count}`).join(" · ")}</p>
      {members.length > visibleMembers.length && (
        <p className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted">
          Showing the first 100 members for a faster page.
          <button type="button" onClick={() => setShowAll(true)} className="underline underline-offset-4">
            Show all {members.length.toLocaleString("en-CA")} members
          </button>
        </p>
      )}
      <div className="mt-3 max-h-[57.5rem] overflow-auto rounded-xl border border-line bg-paper">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-line bg-paper text-xs text-muted">
            <tr>
              <th className={cell}>Name</th>
              <th className={cell}>Email</th>
              <th className={cell}>Riding</th>
              <th className={cell}>Joined</th>
            </tr>
          </thead>
          <tbody>
            {visibleMembers.map((member) => (
              <tr key={`${member.email}-${member.joinedAt}`} className="border-b border-line last:border-0">
                <td className={cell}>
                  {member.name ?? "—"}
                  {member.isStarter && <span className="ml-2 rounded bg-canvas px-1.5 py-0.5 text-xs">Starter</span>}
                </td>
                <td className={cell}>{member.email ?? "—"}</td>
                <td className={cell}>{member.riding ?? "Unknown riding"}</td>
                <td className={`${cell} text-muted`}>{formatDate(member.joinedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
