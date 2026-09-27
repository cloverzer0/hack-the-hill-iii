import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createCampaign, listCampaigns } from "@/lib/campaigns";
import { createCampaignSchema } from "@/lib/campaignValidation";
import { handleRouteError, jsonError, readJson } from "@/lib/http";
import { ensureUser } from "@/lib/users";
import { getStory } from "@/lib/stories";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const storyId = new URL(request.url).searchParams.get("story") ?? undefined;
    return NextResponse.json(await listCampaigns(user.id, storyId));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const parsed = createCampaignSchema.safeParse(await readJson(request));
    if (!parsed.success) return jsonError("invalid_body", 400);
    const story = await getStory(parsed.data.storyId);
    if (!story) return jsonError("story_not_found", 404);
    await ensureUser(user);
    const campaign = await createCampaign({ userId: user.id, storyTitle: story.title, ...parsed.data });
    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
