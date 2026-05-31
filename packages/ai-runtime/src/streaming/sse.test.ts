import { describe, expect, it } from "vitest";
import { encodeSseEvent } from "./sse.js";

describe("encodeSseEvent", () => {
  it("formats SSE data lines", () => {
    const frame = encodeSseEvent({ type: "token", content: "Hi" });
    expect(frame).toBe('data: {"type":"token","content":"Hi"}\n\n');
  });
});
