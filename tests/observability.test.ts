import { createServer, type IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";
import { describe, expect, it, vi } from "vitest";
import { initServerLogs } from "@/lib/observability/otel";
import { serverLog } from "@/lib/observability/serverLog";

type Captured = { url: string; auth: string | undefined; body: string };

const startMock = async () => {
  const hits: Captured[] = [];
  const server = createServer((req: IncomingMessage, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      hits.push({ url: req.url ?? "", auth: req.headers.authorization, body: Buffer.concat(chunks).toString("utf8") });
      res.writeHead(200, { "content-type": "application/json" }).end("{}");
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  return { hits, server, host: `http://127.0.0.1:${(server.address() as AddressInfo).port}` };
};

describe("serverLog", () => {
  it("prints to the console and never throws when no provider is registered", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => serverLog("error", "test.event", { project: "abc" }, "local only")).not.toThrow();
    expect(spy).toHaveBeenCalledWith("[test.event]", "project=abc", "local only");
    spy.mockRestore();
  });

  it("ships the event to PostHog's OTLP path with the bearer key, and keeps local detail out", async () => {
    const { hits, server, host } = await startMock();
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    initServerLogs("phc_testkey", host);

    serverLog("error", "payments.final_charge_error", { project: "11111111-1111-4111-8111-111111111111" }, "jane@example.com SECRET-DETAIL");
    await vi.waitFor(() => expect(hits.length).toBeGreaterThan(0), { timeout: 5000 });

    const hit = hits[0];
    expect(hit.url).toBe("/otlp/v1/logs");
    expect(hit.auth).toBe("Bearer phc_testkey");
    expect(hit.body).toContain("payments.final_charge_error");
    expect(hit.body).toContain("11111111-1111-4111-8111-111111111111");
    expect(hit.body).toContain("northframe");
    // The local-only detail (could hold provider text or PII) must never be exported.
    expect(hit.body).not.toContain("jane@example.com");
    expect(hit.body).not.toContain("SECRET-DETAIL");

    spy.mockRestore();
    await new Promise((r) => server.close(r));
  });
});
