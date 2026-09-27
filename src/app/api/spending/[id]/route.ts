import { NextResponse } from "next/server";
import { handleRouteError, jsonError } from "@/lib/http";
import { getStory } from "@/lib/stories";

type Context = { params: Promise<{ id: string }> };

/**
 * Purpose:
 *	GET /api/spending/:id: one spending story for the detail page (screen 04). Public, no login needed.
 *
 * Args:
 *	- _request: the incoming request (unused)
 *	- context.params: resolves to { id }, the story id
 *
 * Returns:
 *	NextResponse: JSON Story; 404 not_found for an unknown id
 */
export async function GET(_request: Request, { params }: Context) {
  try {
    const story = await getStory((await params).id);
    if (!story) return jsonError("not_found", 404);
    return NextResponse.json(story);
  } catch (error) {
    return handleRouteError(error);
  }
}
