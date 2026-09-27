import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Draft } from "@/lib/petition";
import { PetitionForm } from "./PetitionForm";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const STORY = { id: "data-fin-buv11-2024", title: "Interest on the federal debt rose 52% in two years" };

function draft(text: { title: string; issue: string; request: string }): Draft {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    storyId: STORY.id,
    storyTitle: STORY.title,
    ...text,
    mp: null,
    sponsorEmail: null,
    sponsorRequestedAt: null,
    createdAt: "2026-09-26T12:00:00.000Z",
    updatedAt: "2026-09-26T12:00:00.000Z",
  };
}

const GOOD = { title: "Cut debt interest", issue: "Whereas costs rose.", request: "publish a plan." };
const render = (props: Parameters<typeof PetitionForm>[0]) => renderToStaticMarkup(createElement(PetitionForm, props));

describe("PetitionForm", () => {
  it("counts the words in the issue, the fixed opening and the request", () => {
    // 3 (issue) + 10 (opening) + 3 (request)
    expect(render({ story: STORY, draft: draft(GOOD) })).toContain("16 / 250 words");
  });

  it("enables Next when the text follows the House rules", () => {
    const html = render({ story: STORY, draft: draft(GOOD) });
    expect(html).toContain("Next: publish to the app");
    expect(html).not.toContain('disabled=""');
  });

  it("lists the problems and disables Next when the text breaks the rules", () => {
    const html = render({ story: STORY, draft: draft({ ...GOOD, issue: "Costs rose.", request: "see www.example.com" }) });
    expect(html).toContain("The issue must start with &quot;Whereas&quot;.");
    expect(html).toContain("include links.");
    expect(html).toContain('disabled=""');
  });
});
