import Link from "next/link";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/campaigns/stages";
import { adminListHref, type AdminListOptions } from "../listOptions";

const chip = "rounded-full border px-3 py-1 text-sm";

function chipClass(active: boolean): string {
  return `${chip} ${active ? "border-ink bg-ink text-paper" : "border-line bg-paper hover:border-ink"}`;
}

export function AdminListFilters({ current }: { current: AdminListOptions }) {
  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap gap-2">
        <Link href={adminListHref({ sort: current.sort })} className={chipClass(!current.stage)}>
          All stages
        </Link>
        {STAGE_ORDER.map((stage) => (
          <Link key={stage} href={adminListHref({ stage, sort: current.sort })} className={chipClass(current.stage === stage)}>
            {STAGE_LABELS[stage]}
          </Link>
        ))}
      </div>
      <div className="flex gap-4 text-sm">
        <span className="text-muted">Sort:</span>
        <Link href={adminListHref({ stage: current.stage })} className={current.sort === "members" ? "font-semibold" : "underline"}>
          Most members
        </Link>
        <Link
          href={adminListHref({ stage: current.stage, sort: "updated" })}
          className={current.sort === "updated" ? "font-semibold" : "underline"}
        >
          Recently updated
        </Link>
      </div>
    </div>
  );
}
