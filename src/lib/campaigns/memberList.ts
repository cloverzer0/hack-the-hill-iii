import type { CampaignMemberExport } from "./admin";

// Member list helpers for the admin page. Types only from ./admin, so the browser can use these to build the CSV.

export type RidingCount = { riding: string; count: number };

/** Members per riding, biggest first, ties by name; members without a riding are counted last. */
export function ridingBreakdown(members: Pick<CampaignMemberExport, "riding">[]): RidingCount[] {
  const counts = new Map<string, number>();
  let unknown = 0;
  for (const { riding } of members) {
    if (riding) counts.set(riding, (counts.get(riding) ?? 0) + 1);
    else unknown += 1;
  }
  const rows = [...counts]
    .map(([riding, count]) => ({ riding, count }))
    .sort((a, b) => b.count - a.count || a.riding.localeCompare(b.riding));
  if (unknown > 0) rows.push({ riding: "Unknown riding", count: unknown });
  return rows;
}

function csvField(value: string | null): string {
  let text = value ?? "";
  // Names are typed by users; spreadsheet apps run cells starting with = + - @ as formulas.
  if (/^[=+\-@]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** The members as CSV (RFC 4180, CRLF line endings) for sending to an MP. */
export function membersCsv(members: CampaignMemberExport[]): string {
  const lines = [
    ["name", "email", "riding", "joined_at"],
    ...members.map((member) => [member.name, member.email, member.riding, member.joinedAt]),
  ];
  return lines.map((fields) => fields.map(csvField).join(",")).join("\r\n") + "\r\n";
}
