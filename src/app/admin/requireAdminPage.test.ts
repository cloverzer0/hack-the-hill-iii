import { beforeEach, describe, expect, it, vi } from "vitest";
import { isAdmin } from "@/lib/admin";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import { requireAdminPage } from "./requireAdminPage";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("@/lib/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/auth")>()),
  getCurrentUser: vi.fn(),
}));
vi.mock("@/lib/admin", () => ({ isAdmin: vi.fn() }));

const TEAM: CurrentUser = { id: "auth0|team", email: "team@example.ca", name: "Team Member" };

beforeEach(() => {
  vi.mocked(isAdmin).mockReset();
});

describe("requireAdminPage", () => {
  it("returns the admin", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(TEAM);
    vi.mocked(isAdmin).mockReturnValue(true);
    await expect(requireAdminPage()).resolves.toEqual(TEAM);
  });

  it("shows the not-found page to other users", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(TEAM);
    vi.mocked(isAdmin).mockReturnValue(false);
    await expect(requireAdminPage()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("shows the not-found page when nobody is logged in", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    await expect(requireAdminPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(isAdmin).not.toHaveBeenCalled();
  });
});
