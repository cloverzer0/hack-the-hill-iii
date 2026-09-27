import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getPetition, removePetition } from "@/lib/adminCampaigns";
import { handleRouteError, jsonError } from "@/lib/http";
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) { try { const user = await requireUser(); if (!isAdmin(user)) return jsonError("not_found", 404); const petition = await getPetition((await params).id); return petition ? NextResponse.json({ ...petition, url: `https://www.ourcommons.ca/petitions/en/Petition/Details?Petition=${encodeURIComponent(petition.number)}` }) : jsonError("not_found", 404); } catch (error) { return handleRouteError(error); } }
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) { try { const user = await requireUser(); if (!isAdmin(user)) return jsonError("not_found", 404); return (await removePetition((await params).id)) ? new NextResponse(null, { status: 204 }) : jsonError("not_found", 404); } catch (error) { return handleRouteError(error); } }
