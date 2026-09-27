import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SettingsMenu } from "./SettingsMenu";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children?: ReactNode; className?: string }) =>
    createElement("a", { href, className }, children),
}));

const render = (props: Parameters<typeof SettingsMenu>[0]) => renderToStaticMarkup(createElement(SettingsMenu, props));

describe("SettingsMenu", () => {
  it("shows who is signed in and links to the Auth0 logout route", () => {
    const html = render({ name: "Alice", email: "alice@example.com", canLogOut: true });
    expect(html).toContain('aria-label="Settings"');
    expect(html).toContain("Signed in as");
    expect(html).toContain("Alice");
    expect(html).toContain("alice@example.com");
    expect(html).toContain('href="/auth/logout"');
  });

  it("uses the email when there is no name, without repeating it", () => {
    const html = render({ name: null, email: "bob@example.com", canLogOut: true });
    expect(html.match(/bob@example\.com/g)).toHaveLength(1);
  });

  it("disables logging out when login is off in local dev", () => {
    const html = render({ name: "Local Dev", email: "dev@localhost", canLogOut: false });
    expect(html).not.toContain("/auth/logout");
    expect(html).toContain("Login is off in local dev.");
  });

  it("links admins to the admin page", () => {
    const html = render({ name: "Team", email: "team@example.ca", canLogOut: true, isAdmin: true });
    expect(html).toContain('href="/admin"');
    expect(html).toContain(">Admin<");
  });

  it("shows no admin link to everyone else", () => {
    const html = render({ name: "Alice", email: "alice@example.com", canLogOut: true });
    expect(html).not.toContain('href="/admin"');
  });
});
