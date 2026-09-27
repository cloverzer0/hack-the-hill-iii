import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getCampaign, joinCampaign } from "@/lib/campaigns";
import { joinCampaignSchema } from "@/lib/campaignValidation";
import { handleRouteError, jsonError, readJson } from "@/lib/http";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const user = await requireUser();
    const campaign = await getCampaign((await params).id, user.id);
    return campaign ? NextResponse.json(campaign) : jsonError("not_found", 404);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request, { params }: Context) {
  try {
    const user = await requireUser();
    const parsed = joinCampaignSchema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError("invalid_body", 400);
    const campaign = await joinCampaign({ campaignId: (await params).id, userId: user.id, name: user.name ?? "A Canadian", email: user.email ?? "", ...parsed.data });
    return campaign ? NextResponse.json(campaign) : jsonError("not_found_or_closed", 409);
  } catch (error) {
    return handleRouteError(error);
  }
}
