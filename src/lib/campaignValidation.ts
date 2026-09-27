import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);

export const createCampaignSchema = z.object({
  storyId: text(200),
  title: text(250),
  issue: text(2000),
  request: text(1000),
  riding: text(160),
  consent: z.literal(true),
});

export const joinCampaignSchema = z.object({
  riding: text(160),
  consent: z.literal(true),
});

export function hasWebAddress(value: string) {
  return /(?:https?:\/\/|www\.)\S+/i.test(value);
}

export function wordCount(issue: string, request: string) {
  return `${issue} We, the undersigned, call upon the Government of Canada to ${request}`.trim().split(/\s+/).filter(Boolean).length;
}
