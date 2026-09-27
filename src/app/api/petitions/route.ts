import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { attachPetition } from "@/lib/adminCampaigns";
import { handleRouteError, jsonError, readJson } from "@/lib/http";

const schema = z.object({ campaignId: z.string().uuid(), number: z.string().min(1), title: z.string().min(1).max(500), officialUrl: z.string().url().refine((value) => value.startsWith("https://www.ourcommons.ca/petitions/"), "official_url_required"), sponsorName: z.string().max(200).optional(), sponsorRiding: z.string().max(200).optional(), signatures: z.number().int().min(0).optional(), closesAt: z.string().datetime().nullable().optional() });
export async function POST(request: Request) { try { const user = await requireUser(); if (!isAdmin(user)) return jsonError("not_found", 404); const parsed = schema.safeParse(await readJson(request)); if (!parsed.success) return jsonError("invalid_body", 400); return NextResponse.json(await attachPetition(parsed.data), { status: 201 }); } catch (error) { if (error instanceof Error && error.message === "invalid_petition_number") return jsonError("invalid_petition_number", 400); return handleRouteError(error); } }
