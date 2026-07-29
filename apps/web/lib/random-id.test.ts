import { afterEach, describe, expect, it, vi } from "vitest";
import { randomId } from "./random-id";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("randomId", () => {
  it("returns a UUID when randomUUID is available", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "11111111-1111-4111-8111-111111111111" });
    expect(randomId()).toBe("11111111-1111-4111-8111-111111111111");
  });

  it("creates a valid v4 UUID when randomUUID is unavailable", () => {
    vi.stubGlobal("crypto", {
      getRandomValues: (bytes: Uint8Array) => {
        bytes.fill(17);
        return bytes;
      }
    });

    expect(randomId()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});
