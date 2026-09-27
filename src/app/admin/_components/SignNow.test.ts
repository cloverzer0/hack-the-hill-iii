import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { CampaignDetail } from "@/lib/campaigns/campaigns";
import type { PetitionCard } from "@/lib/petitions/petitions";
import { SignNow } from "./SignNow";

const petition = (status: PetitionCard["status"]): PetitionCard => ({
  number: "1234-56789",
  title: "Make things better",
  url: "https://www.ourcommons.ca/petitions/en/Petition/Details?Petition=e-1234",
  campaignId: "campaign-1",
  campaignTitle: "Make things better",
  storyId: "story-1",
  sponsorName: "Alex MP",
  sponsorRiding: "Ottawa Centre",
  signatures: 42,
  signaturesNeeded: 500,
  status,
  openedAt: status === "open" ? "2026-09-20T00:00:00.000Z" : null,
  closesAt: null,
  presentedAt: null,
  responseTabledAt: null,
  syncedAt: "2026-09-26T12:00:00.000Z",
});

const campaign = (petitionCard: PetitionCard | null): CampaignDetail => ({
  id: "campaign-1",
  title: "Make things better",
  storyId: "story-1",
  storyTitle: "A spending story",
  starterFirstName: "Avery",
  memberCount: 1,
  target: 1000,
  deadline: "2026-12-01",
  stage: "live",
  createdAt: "2026-09-20T00:00:00.000Z",
  updatedAt: "2026-09-26T12:00:00.000Z",
  joined: false,
  isStarter: false,
  petition: petitionCard,
  issue: "The issue",
  opening: "We, the undersigned,",
  request: "ask the government to act.",
  teamNote: null,
  ridingCount: 1,
  canEdit: false,
  canJoin: false,
  canLeave: false,
  sponsorMp: null,
  sponsorRequestedAt: null,
});

const render = (campaignDetail: CampaignDetail) => renderToStaticMarkup(createElement(SignNow, {
  campaign: campaignDetail,
  members: [{ name: "Avery", email: "avery@example.ca", riding: "Ottawa Centre", isStarter: true, joinedAt: "2026-09-20T00:00:00.000Z" }],
  teamGmail: null,
}));

describe("SignNow", () => {
  it("renders nothing when there is no petition", () => {
    expect(render(campaign(null))).toBe("");
  });

  it("shows the message and member email button only while the petition is open", () => {
    const html = render(campaign(petition("open")));
    expect(html).toContain("sign Make things better on ourcommons.ca");
    expect(html).toContain("Copy member emails (1)");
  });

  it("explains that a pending petition is not ready for member signatures", () => {
    const html = render(campaign(petition("pending")));
    expect(html).toContain("This appears once ourcommons.ca shows the petition open for signature.");
    expect(html).not.toContain("Copy member emails");
  });

  it.each(["closed", "presented", "response"] as const)("explains that a %s petition is closed for signature", (status) => {
    const html = render(campaign(petition(status)));
    expect(html).toContain("The petition is closed for signature, so there&#x27;s nothing to send.");
    expect(html).not.toContain("Copy member emails");
  });
});
