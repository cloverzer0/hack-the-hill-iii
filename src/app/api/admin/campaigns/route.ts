import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { listAdminCampaigns } from "@/lib/adminCampaigns";
import { handleRouteError, jsonError } from "@/lib/http";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    if (!isAdmin(user)) return jsonError("not_found", 404);
    const params = new URL(request.url).searchParams;
    return NextResponse.json(await listAdminCampaigns((params.get("stage") as never) || undefined, params.get("sort") ?? "members"));
  } catch (error) { return handleRouteError(error); }
}
