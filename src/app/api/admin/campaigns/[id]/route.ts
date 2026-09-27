import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getAdminCampaign, updateAdminCampaign } from "@/lib/adminCampaigns";
import { handleRouteError, jsonError, readJson } from "@/lib/http";

const stage = z.enum(["gathering", "in_review", "mp_asked", "mp_agreed", "live", "closed"]);
const patchSchema = z.object({ stage: stage.optional(), note: z.string().max(2000).nullable().optional(), sponsorMp: z.unknown().nullable().optional(), sponsorRequested: z.boolean().optional() });
type Context = { params: Promise<{ id: string }> };

async function admin() { const user = await requireUser(); return isAdmin(user) ? user : null; }

export async function GET(_request: Request, { params }: Context) {
  try { if (!await admin()) return jsonError("not_found", 404); const result = await getAdminCampaign((await params).id); return result ? NextResponse.json(result) : jsonError("not_found", 404); } catch (error) { return handleRouteError(error); }
}

export async function PATCH(request: Request, { params }: Context) {
  try { if (!await admin()) return jsonError("not_found", 404); const parsed = patchSchema.safeParse(await readJson(request)); if (!parsed.success) return jsonError("invalid_body", 400); const updated = await updateAdminCampaign((await params).id, parsed.data as never); return updated ? NextResponse.json(updated) : jsonError("not_found", 404); } catch (error) { if (error instanceof Error && error.message === "petition_required") return jsonError("petition_required", 409); return handleRouteError(error); }
}
