import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  signOut: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  deleteCookie: vi.fn(),
  getAll: vi.fn(() =>
    [
      "sb-project-auth-token.0",
      "sb-project-auth-token.1",
      "sb-project-auth-token-code-verifier",
      "nf-view-as",
      "nf-theme",
    ].map((name) => ({ name, value: "test" })),
  ),
}));
vi.mock("@/utils/supabase/server", () => ({ createClient: async () => ({ auth: mocks }) }));
vi.mock("next/headers", () => ({ cookies: async () => ({ getAll: mocks.getAll, delete: mocks.deleteCookie }) }));
import { POST } from "@/app/auth/signout/route";
import { GET } from "@/app/auth/callback/route";

describe("auth routes", () => {
  beforeEach(() => vi.clearAllMocks());
  it("clears local session chunks even when the provider is unavailable", async () => {
    mocks.signOut.mockRejectedValueOnce(new Error("offline"));
    const response = await POST(
      new Request("https://northframe.co/auth/signout", {
        method: "POST",
        headers: { origin: "https://northframe.co" },
      }),
    );
    expect(response.status).toBe(303);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(mocks.deleteCookie.mock.calls.map((call) => call[0])).toEqual([
      "sb-project-auth-token.0",
      "sb-project-auth-token.1",
      "sb-project-auth-token-code-verifier",
      "nf-view-as",
    ]);
    expect(mocks.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
  it("rejects cross-origin sign-out before touching the session", async () => {
    expect(
      (
        await POST(
          new Request("https://northframe.co/auth/signout", {
            method: "POST",
            headers: { origin: "https://foreign.test" },
          }),
        )
      ).status,
    ).toBe(403);
    expect(mocks.signOut).not.toHaveBeenCalled();
    expect(mocks.deleteCookie).not.toHaveBeenCalled();
  });
  it("preserves a safe destination after callback failure", async () => {
    mocks.exchangeCodeForSession.mockResolvedValueOnce({ error: new Error("expired") });
    const response = await GET(
      new Request("https://northframe.co/auth/callback?code=expired&next=%2Fstart%3Fpackage%3Dpresence"),
    );
    expect(response.headers.get("location")).toBe(
      "https://northframe.co/login?error=callback&next=%2Fstart%3Fpackage%3Dpresence",
    );
  });
  it("does not redirect a successful callback to another host", async () => {
    mocks.exchangeCodeForSession.mockResolvedValueOnce({ error: null });
    expect(
      (await GET(new Request("https://northframe.co/auth/callback?code=test&next=%2F%2Fevil.test"))).headers.get(
        "location",
      ),
    ).toBe("https://northframe.co/portal");
  });
});
