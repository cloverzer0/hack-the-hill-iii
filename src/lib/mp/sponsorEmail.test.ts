import { describe, expect, it } from "vitest";
import { composeLinks } from "./sponsorEmail";

describe("composeLinks", () => {
  const links = composeLinks({ to: "mp@parl.gc.ca", subject: "A & B", body: "Line 1\nLine 2" });

  it("builds a Gmail compose link", () => {
    expect(links.gmail).toBe(
      "https://mail.google.com/mail/?view=cm&fs=1&to=mp%40parl.gc.ca&su=A%20%26%20B&body=Line%201%0ALine%202",
    );
  });

  it("builds an Outlook web compose link", () => {
    expect(links.outlook).toBe(
      "https://outlook.live.com/mail/0/deeplink/compose?to=mp%40parl.gc.ca&subject=A%20%26%20B&body=Line%201%0ALine%202",
    );
  });

  it("builds a mailto link", () => {
    expect(links.mailto).toBe("mailto:mp@parl.gc.ca?subject=A%20%26%20B&body=Line%201%0ALine%202");
  });

  it("opens Gmail in the team's account when one is given", () => {
    const withAccount = composeLinks({
      to: "mp@parl.gc.ca",
      subject: "A & B",
      body: "Line 1\nLine 2",
      authuser: "team@gmail.com",
    });
    expect(withAccount.gmail).toBe(
      "https://mail.google.com/mail/?authuser=team%40gmail.com&view=cm&fs=1&to=mp%40parl.gc.ca&su=A%20%26%20B&body=Line%201%0ALine%202",
    );
    expect(withAccount.outlook).toBe(links.outlook);
  });
});
