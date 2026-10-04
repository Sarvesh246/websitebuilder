import { afterEach, describe, expect, it, vi } from "vitest";
import { avatarDataUri } from "@/lib/avatar";
import { getServiceHealth, readState, toState } from "@/lib/status/serviceStatus";

describe("avatarDataUri", () => {
  it("is deterministic per seed and differs between seeds", () => {
    const a = avatarDataUri("11111111-1111-4111-8111-111111111111");
    expect(a).toBe(avatarDataUri("11111111-1111-4111-8111-111111111111"));
    expect(a).not.toBe(avatarDataUri("22222222-2222-4222-8222-222222222222"));
  });

  it("is an inline SVG that is safe inside a double-quoted CSS url()", () => {
    const uri = avatarDataUri("seed") ?? "";
    expect(uri.startsWith("data:image/svg+xml")).toBe(true);
    expect(uri).not.toContain('"');
    expect(decodeURIComponent(uri)).not.toMatch(/<script|onload=|javascript:/i);
  });
});

describe("service status mapping", () => {
  it("maps known words and never treats unknown input as operational", () => {
    expect(toState("up")).toBe("operational");
    expect(toState("Degraded")).toBe("degraded");
    expect(toState("down")).toBe("down");
    for (const v of ["", "weird", null, undefined, 1, {}]) expect(toState(v)).toBe("unknown");
  });

  it("rejects malformed upstream bodies", () => {
    expect(readState(null)).toBe("unknown");
    expect(readState("up")).toBe("unknown");
    expect(readState({ api: null })).toBe("unknown");
    expect(readState({ api: { status: "up" } })).toBe("operational");
  });
});

describe("getServiceHealth", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("calls only the fixed host, refuses redirects, and degrades to unknown on failure", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      if (url.includes("api=stripe")) return new Response(JSON.stringify({ api: { status: "up" } }), { status: 200 });
      if (url.includes("api=supabase")) throw new Error("network");
      if (url.includes("api=vercel")) return new Response("x".repeat(30_000), { status: 200 });
      return new Response("nope", { status: 500 });
    });
    const out = await getServiceHealth();
    expect(out.map((s) => s.state)).toEqual(["operational", "unknown", "unknown", "unknown"]);
    for (const c of calls) {
      expect(c.url.startsWith("https://apistatuscheck.com/api/status?api=")).toBe(true);
      expect(c.init.redirect).toBe("error");
    }
  });
});
