import { describe, expect, it } from "vitest";
import { boundedText } from "@/lib/http/boundedText";

describe("bounded streamed bodies", () => {
  it("preserves Unicode split across stream chunks", async () => {
    const bytes = new TextEncoder().encode("€ hello");
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, 1));
        controller.enqueue(bytes.slice(1));
        controller.close();
      },
    });
    expect(await boundedText(stream, bytes.length)).toBe("€ hello");
  });
  it("rejects and cancels an oversized body without trusting Content-Length", async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array(5));
      },
      cancel() {
        cancelled = true;
      },
    });
    await expect(boundedText(stream, 4)).rejects.toThrow(RangeError);
    expect(cancelled).toBe(true);
  });
});
