import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, campaignSupporters, petitions, users, type CampaignRow } from "@/db/schema";
import { CAMPAIGN_STATUSES, type CampaignStatus } from "@/lib/campaigns";
import type { Mp } from "@/lib/mp/types";

export type AdminCampaign = {
  campaign: CampaignRow;
  starter: { id: string; name: string | null; email: string | null };
  members: { name: string | null; email: string | null; riding: string | null; joinedAt: string }[];
  supporterCount: number;
  ridingCount: number;
  petition: typeof petitions.$inferSelect | null;
};

export async function listAdminCampaigns(stage?: CampaignStatus, sort = "members") {
  const rows = await db.select({ campaign: campaigns, starter: users, supporterCount: sql<number>`count(${campaignSupporters.userId})::int` }).from(campaigns).innerJoin(users, eq(users.id, campaigns.startedBy)).leftJoin(campaignSupporters, eq(campaignSupporters.campaignId, campaigns.id)).where(stage ? eq(campaigns.status, stage) : undefined).groupBy(campaigns.id, users.id).orderBy(sort === "updated" ? desc(campaigns.updatedAt) : desc(sql`count(${campaignSupporters.userId})`));
  return rows.map((row) => ({ ...row, stage: row.campaign.status }));
}

export async function getAdminCampaign(id: string): Promise<AdminCampaign | null> {
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, id));
  if (!campaign) return null;
  const [starter] = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, campaign.startedBy));
  const members = await db.select({ name: users.name, email: users.email, riding: campaignSupporters.riding, joinedAt: campaignSupporters.joinedAt }).from(campaignSupporters).innerJoin(users, eq(users.id, campaignSupporters.userId)).where(eq(campaignSupporters.campaignId, id)).orderBy(asc(campaignSupporters.joinedAt));
  const [petition] = await db.select().from(petitions).where(eq(petitions.campaignId, id));
  return { campaign, starter, members: members.map((member) => ({ ...member, joinedAt: member.joinedAt.toISOString() })), supporterCount: members.length, ridingCount: new Set(members.map((member) => member.riding).filter(Boolean)).size, petition: petition ?? null };
}

export async function getPetition(number: string) {
  const [petition] = await db.select().from(petitions).where(eq(petitions.number, number));
  return petition ?? null;
}

export async function updateAdminCampaign(id: string, patch: { stage?: CampaignStatus; note?: string | null; sponsorMp?: Mp | null; sponsorRequested?: boolean }) {
  const [current] = await db.select().from(campaigns).where(eq(campaigns.id, id));
  if (!current) return null;
  if (patch.stage === "live") {
    const [petition] = await db.select().from(petitions).where(eq(petitions.campaignId, id));
    if (!petition) throw new Error("petition_required");
  }
  const [updated] = await db.update(campaigns).set({ ...(patch.stage ? { status: patch.stage } : {}), ...(patch.note !== undefined ? { note: patch.note } : {}), ...(patch.sponsorMp !== undefined ? { sponsorMp: patch.sponsorMp } : {}), ...(patch.sponsorRequested ? { sponsorRequestedAt: sql`now()`, status: "mp_asked" } : {}), updatedAt: sql`now()` }).where(eq(campaigns.id, id)).returning();
  return updated;
}

export function normalizePetitionNumber(value: string) {
  const match = value.trim().match(/^e?-?(\d+)$/i);
  return match ? `e-${match[1]}` : null;
}

export async function attachPetition(input: { campaignId: string; number: string; title: string; sponsorName?: string; sponsorRiding?: string; signatures?: number; closesAt?: string | null }) {
  const number = normalizePetitionNumber(input.number);
  if (!number) throw new Error("invalid_petition_number");
  const [petition] = await db.insert(petitions).values({ number, campaignId: input.campaignId, title: input.title, sponsorName: input.sponsorName ?? null, sponsorRiding: input.sponsorRiding ?? null, signatures: input.signatures ?? 0, closesAt: input.closesAt ? new Date(input.closesAt) : null }).onConflictDoUpdate({ target: petitions.number, set: { campaignId: input.campaignId, title: input.title, sponsorName: input.sponsorName ?? null, sponsorRiding: input.sponsorRiding ?? null, signatures: input.signatures ?? 0, closesAt: input.closesAt ? new Date(input.closesAt) : null } }).returning();
  await db.update(campaigns).set({ status: "live", updatedAt: sql`now()` }).where(eq(campaigns.id, input.campaignId));
  return petition;
}

export async function removePetition(number: string) {
  const [petition] = await db.select().from(petitions).where(eq(petitions.number, number));
  if (!petition) return false;
  await db.delete(petitions).where(eq(petitions.number, number));
  await db.update(campaigns).set({ status: "mp_agreed", updatedAt: sql`now()` }).where(eq(campaigns.id, petition.campaignId));
  return true;
}

export { CAMPAIGN_STATUSES };
