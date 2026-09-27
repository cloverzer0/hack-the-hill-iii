import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { CampaignDetail } from "@/lib/campaigns/campaigns";
import { PublishedSummary } from "./PublishedSummary";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children?: ReactNode; className?: string }) =>
    createElement("a", { href, className }, children),
}));

const CAMPAIGN: CampaignDetail = {
  id: "11111111-1111-4111-8111-111111111111",
  title: "Publish a plan to lower debt interest",
  storyId: "data-fin-buv11-2024",
  storyTitle: "Interest on the federal debt rose 52% in two years",
  starterFirstName: "Alice",
  memberCount: 1,
  stage: "gathering",
  createdAt: "2026-09-26T12:00:00.000Z",
  updatedAt: "2026-09-26T12:00:00.000Z",
  joined: true,
  isStarter: true,
  petition: null,
  issue: "Whereas interest on the federal debt rose 52% in two years;",
  opening: "We, the undersigned, call upon the Government of Canada to",
  request: "publish a plan.",
  teamNote: null,
  ridingCount: 1,
  canEdit: true,
  canJoin: false,
  canLeave: false,
};

const render = (campaign: CampaignDetail, existing = false) =>
  renderToStaticMarkup(createElement(PublishedSummary, { campaign, existing }));

describe("PublishedSummary", () => {
  it("confirms the campaign is on its story and explains what happens next", () => {
    const html = render(CAMPAIGN);
    expect(html).toContain("Your campaign is published");
    expect(html).toContain("Interest on the federal debt rose 52% in two years");
    expect(html).toContain("Publish a plan to lower debt interest");
    expect(html).toContain("1 member");
    expect(html).toContain("We ask an MP to sponsor it.");
    expect(html).toContain('href="/dev/petition"');
    expect(html).not.toContain("already started");
  });

  it("formats bigger member counts", () => {
    expect(render({ ...CAMPAIGN, memberCount: 1204 })).toContain("1,204 members");
  });

  it("says so when the user had already started a campaign on this story", () => {
    expect(render(CAMPAIGN, true)).toContain("already started a campaign on this story");
  });
});
