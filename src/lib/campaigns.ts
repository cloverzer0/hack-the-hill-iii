import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, campaignSupporters, petitions, users, type CampaignRow } from "@/db/schema";

export const CAMPAIGN_STATUSES = ["gathering", "in_review", "mp_asked", "mp_agreed", "live", "closed"] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export type Campaign = {
  id: string;
  storyId: string;
  title: string;
  issue: string;
  request: string;
  target: number;
  deadline: string;
  status: CampaignStatus;
  note: string | null;
  sponsorMp: CampaignRow["sponsorMp"];
  petition: { number: string; title: string; sponsorName: string | null; sponsorRiding: string | null; signatures: number; closesAt: string | null; url: string } | null;
  starter: { id: string; name: string; email: string | null };
  supporters: number;
  ridingCount: number;
  joined: boolean;
  joinedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function toCampaign(row: CampaignRow, starter: { id: string; name: string; email: string | null }, supporters: number, ridingCount: number, joinedAt: Date | null, petition: Campaign["petition"]): Campaign {
  return {
    id: row.id,
    storyId: row.storyId,
    title: row.title,
    issue: row.issue,
    request: row.request,
    target: row.target,
    deadline: row.deadline,
    status: row.status as CampaignStatus,
    note: row.note,
    sponsorMp: row.sponsorMp ?? null,
    petition,
    starter,
    supporters,
    ridingCount,
    joined: Boolean(joinedAt),
    joinedAt: joinedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function hydrate(row: CampaignRow, viewerId: string | null): Promise<Campaign> {
  const members = await db.select({ userId: campaignSupporters.userId, riding: campaignSupporters.riding, joinedAt: campaignSupporters.joinedAt }).from(campaignSupporters).where(eq(campaignSupporters.campaignId, row.id));
  const [starter] = await db.select({ id: users.id, name: users.name, email: users.email }).from(users).where(eq(users.id, row.startedBy));
  const joinedAt = members.find((member) => member.userId === viewerId)?.joinedAt ?? null;
  const [petitionRow] = await db.select().from(petitions).where(eq(petitions.campaignId, row.id));
  const petition = petitionRow ? { number: petitionRow.number, title: petitionRow.title, sponsorName: petitionRow.sponsorName, sponsorRiding: petitionRow.sponsorRiding, signatures: petitionRow.signatures, closesAt: petitionRow.closesAt?.toISOString() ?? null, url: `https://www.ourcommons.ca/petitions/en/Petition/Details?Petition=${encodeURIComponent(petitionRow.number)}` } : null;
  return toCampaign(row, { id: starter.id, name: starter.name || "A Canadian", email: starter.email }, members.length, new Set(members.map((member) => member.riding)).size, joinedAt, petition);
}

export async function getCampaign(id: string, viewerId: string | null): Promise<Campaign | null> {
  const [row] = await db.select().from(campaigns).where(eq(campaigns.id, id));
  return row ? hydrate(row, viewerId) : null;
}

export async function listCampaigns(viewerId: string | null, storyId?: string): Promise<Campaign[]> {
  const rows = await db.select().from(campaigns).where(storyId ? eq(campaigns.storyId, storyId) : undefined).orderBy(asc(sql`case when ${campaigns.status} = 'live' then 0 when ${campaigns.status} = 'closed' then 2 else 1 end`), desc(campaigns.updatedAt));
  return Promise.all(rows.map((row) => hydrate(row, viewerId)));
}

export async function createCampaign(input: { userId: string; storyId: string; storyTitle: string; title: string; issue: string; request: string; riding: string; consent: boolean }): Promise<Campaign> {
  const existing = await db.select().from(campaigns).where(and(eq(campaigns.storyId, input.storyId), eq(campaigns.startedBy, input.userId)));
  if (existing[0]) return hydrate(existing[0], input.userId);
  const [row] = await db.insert(campaigns).values({ storyId: input.storyId, storyTitle: input.storyTitle, startedBy: input.userId, title: input.title, issue: input.issue, request: input.request, deadline: sql`current_date + 120` }).returning();
  await db.insert(campaignSupporters).values({ campaignId: row.id, userId: input.userId, riding: input.riding });
  return hydrate(row, input.userId);
}

export async function joinCampaign(input: { campaignId: string; userId: string; name: string; email: string; riding: string; consent: boolean }): Promise<Campaign | null> {
  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, input.campaignId));
  if (!campaign || campaign.status === "live" || campaign.status === "closed") return null;
  await db.insert(campaignSupporters).values({ campaignId: input.campaignId, userId: input.userId, riding: input.riding }).onConflictDoNothing();
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(campaignSupporters).where(eq(campaignSupporters.campaignId, input.campaignId));
  if (campaign.status === "gathering" && count >= campaign.target) {
    await db.update(campaigns).set({ status: "in_review", updatedAt: sql`now()` }).where(eq(campaigns.id, input.campaignId));
  }
  return getCampaign(input.campaignId, input.userId);
}
