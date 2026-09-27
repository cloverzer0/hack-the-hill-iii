import { beforeEach, describe, expect, it, vi } from "vitest";
import { notFound } from "next/navigation";
import { NotAdminError, requireAdmin } from "@/lib/admin";
import type { CurrentUser } from "@/lib/auth";
import { requireAdminPage } from "./requireAdminPage";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));
vi.mock("@/lib/admin", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/admin")>()),
  requireAdmin: vi.fn(),
}));

const TEAM: CurrentUser = { id: "auth0|team", email: "team@example.ca", name: "Team Member" };

beforeEach(() => {
  vi.mocked(requireAdmin).mockReset();
  vi.mocked(notFound).mockClear();
});

describe("requireAdminPage", () => {
  it("returns the admin", async () => {
    vi.mocked(requireAdmin).mockResolvedValue(TEAM);
    await expect(requireAdminPage()).resolves.toEqual(TEAM);
  });

  it("shows the not-found page when requireAdmin rejects a non-admin", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(new NotAdminError());
    await expect(requireAdminPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledOnce();
  });

  it("rethrows errors other than NotAdminError", async () => {
    const error = new Error("auth unavailable");
    vi.mocked(requireAdmin).mockRejectedValue(error);
    await expect(requireAdminPage()).rejects.toBe(error);
    expect(notFound).not.toHaveBeenCalled();
  });
});
