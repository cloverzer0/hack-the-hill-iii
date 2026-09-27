import { describe, expect, it } from "vitest";
import { buildMpAsk, buildSignNow } from "./outreach";

const CAMPAIGN = {
  title: "Publish a plan to lower debt interest",
  issue: "Whereas interest on the federal debt rose 52% in two years;",
  request: "publish a plan to reduce what Canadians pay in debt interest.",
};
const MP = { name: "Yasir Naqvi", riding: "Ottawa Centre" };
const members = (...ridings: (string | null)[]) => ridings.map((riding) => ({ riding }));

describe("buildMpAsk", () => {
  it("writes the ask with the campaign text and member counts", () => {
    const { subject, body } = buildMpAsk({
      campaign: CAMPAIGN,
      mp: MP,
      members: members("Ottawa Centre", "Ottawa South", "Ottawa Centre"),
    });
    expect(subject).toBe("Request to sponsor an e-petition: Publish a plan to lower debt interest");
    expect(body).toBe(
      [
        "Dear Yasir Naqvi,",
        "",
        "We're writing from wheredoesmytaxgo, where Canadians follow federal spending and organize around it. One of our campaigns is looking for an MP to sponsor it:",
        "",
        "Publish a plan to lower debt interest",
        "",
        "Whereas interest on the federal debt rose 52% in two years;",
        "",
        "We, the undersigned, call upon the Government of Canada to publish a plan to reduce what Canadians pay in debt interest.",
        "",
        "This campaign has 3 members from 2 ridings, including 2 in Ottawa Centre. We can share the member list so you can verify them.",
        "",
        "Would you sponsor it? Once you agree, we'll create it on ourcommons.ca and name you as the sponsor. Sponsoring doesn't mean you endorse it: it lets Canadians sign it and, with 500 signatures, have it presented in the House.",
        "",
        "Thank you,",
        "The wheredoesmytaxgo team",
      ].join("\n"),
    );
  });

  it("uses singular words for one member in one riding", () => {
    const { body } = buildMpAsk({ campaign: CAMPAIGN, mp: MP, members: members("Ottawa Centre") });
    expect(body).toContain("This campaign has 1 member from 1 riding, including 1 in Ottawa Centre.");
  });

  it("leaves out the local count when nobody is from the MP's riding", () => {
    const { body } = buildMpAsk({ campaign: CAMPAIGN, mp: MP, members: members("Ottawa South") });
    expect(body).toContain("This campaign has 1 member from 1 riding. We can share");
    expect(body).not.toContain("including");
  });

  it("doesn't count a missing riding as a riding", () => {
    const { body } = buildMpAsk({ campaign: CAMPAIGN, mp: MP, members: members("Ottawa Centre", null) });
    expect(body).toContain("This campaign has 2 members from 1 riding, including 1 in Ottawa Centre.");
  });
});

describe("buildSignNow", () => {
  it("tells members where to sign and that the confirmation email matters", () => {
    const { subject, body } = buildSignNow({
      campaign: { title: "Publish a plan to lower debt interest" },
      petition: { number: "e-7203", url: "https://www.ourcommons.ca/petitions/en/Petition/Details?Petition=e-7203" },
    });
    expect(subject).toBe("It's live: sign Publish a plan to lower debt interest on ourcommons.ca");
    expect(body).toBe(
      [
        "The campaign you joined is now official petition e-7203. Sign it here:",
        "https://www.ourcommons.ca/petitions/en/Petition/Details?Petition=e-7203",
        "",
        "Your signature only counts after you confirm the email from the House of Commons.",
        "",
        "Thank you,",
        "The wheredoesmytaxgo team",
      ].join("\n"),
    );
  });
});
