import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Draft } from "@/lib/petition";
import { PublishStep } from "./PublishStep";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children?: ReactNode; className?: string }) =>
    createElement("a", { href, className }, children),
}));

const DRAFT: Draft = {
  id: "00000000-0000-4000-8000-000000000001",
  storyId: "data-fin-buv11-2024",
  storyTitle: "Interest on the federal debt rose 52% in two years",
  title: "Cut debt interest",
  issue: "Whereas costs rose.",
  request: "publish a plan.",
  mp: null,
  sponsorEmail: null,
  sponsorRequestedAt: null,
  createdAt: "2026-09-26T12:00:00.000Z",
  updatedAt: "2026-09-26T12:00:00.000Z",
};

const render = (savedRiding: string | null) =>
  renderToStaticMarkup(createElement(PublishStep, { draft: DRAFT, savedRiding }));

describe("PublishStep", () => {
  it("shows the text as it will be published, with the fixed opening", () => {
    const html = render(null);
    expect(html).toContain("Cut debt interest");
    expect(html).toContain("We, the undersigned, call upon the Government of Canada to publish a plan.");
    expect(html).toContain(`href="/petition/${DRAFT.id}"`);
  });

  it("uses the saved riding, with a way to change it", () => {
    const html = render("Ottawa Centre");
    expect(html).toContain("Ottawa Centre");
    expect(html).toContain(">Change<");
    expect(html).not.toContain('placeholder="K1P 1A4"');
  });

  it("asks for a postal code when no riding is saved", () => {
    const html = render(null);
    expect(html).toContain('placeholder="K1P 1A4"');
    expect(html).toContain("never your postal code");
  });

  it("needs the consent box ticked before publishing", () => {
    const html = render("Ottawa Centre");
    expect(html).toContain(
      "Email me about this campaign, and share my name, email and riding with the MP we ask to sponsor it.",
    );
    expect(html).toContain("Publish to the app");
    expect(html).toContain('disabled=""');
  });
});
