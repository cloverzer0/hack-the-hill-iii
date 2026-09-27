import Link from "next/link";
import { listAdminCampaigns } from "@/lib/campaigns/admin";
import { STAGE_LABELS } from "@/lib/campaigns/stages";
import { AdminListFilters } from "./_components/AdminListFilters";
import { formatDate } from "./format";
import { adminListOptions } from "./listOptions";
import { requireAdminPage } from "./requireAdminPage";

type Props = { searchParams: Promise<{ stage?: string | string[]; sort?: string | string[] }> };

const cell = "p-3";

export default async function AdminPage({ searchParams }: Props) {
  await requireAdminPage();
  const options = adminListOptions(await searchParams);
  const rows = await listAdminCampaigns(options);

  return (
    <main>
      <h1 className="text-2xl font-semibold">Campaigns</h1>
      <AdminListFilters current={options} />
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-muted">No campaigns yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line bg-paper">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line text-xs text-muted">
              <tr>
                <th className={cell}>Campaign</th>
                <th className={cell}>Story</th>
                <th className={cell}>Starter</th>
                <th className={`${cell} text-right`}>Members</th>
                <th className={`${cell} text-right`}>Ridings</th>
                <th className={cell}>Stage</th>
                <th className={cell}>Petition</th>
                <th className={cell}>Updated</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-line last:border-0">
                  <td className={cell}>
                    <Link href={`/admin/campaigns/${row.id}`} className="font-medium underline">
                      {row.title}
                    </Link>
                  </td>
                  <td className={`${cell} text-muted`}>{row.storyTitle}</td>
                  <td className={cell}>{row.starterName ?? "—"}</td>
                  <td className={`${cell} text-right tabular-nums`}>{row.memberCount.toLocaleString("en-CA")}</td>
                  <td className={`${cell} text-right tabular-nums`}>{row.ridingCount}</td>
                  <td className={cell}>{STAGE_LABELS[row.stage]}</td>
                  <td className={cell}>{row.petitionNumber ?? "—"}</td>
                  <td className={`${cell} text-muted`}>{formatDate(row.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
