import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { campaignErrorResponse } from "@/lib/campaigns/errors";
import { removePetition } from "@/lib/campaigns/admin";
import { getPetition } from "@/lib/petitions/petitions";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  try {
    const petition = await getPetition((await params).id);
    if (!petition) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json(petition);
  } catch (error) {
    return campaignErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Context) {
  try {
    await requireAdmin();
    await removePetition((await params).id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return campaignErrorResponse(error);
  }
}
