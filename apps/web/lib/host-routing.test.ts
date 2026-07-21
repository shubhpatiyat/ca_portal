import { describe, expect, it } from "vitest";
import { decideHostRoute, normalizeHost } from "./host-routing";

const platformUrl = "https://platform.example.com";

describe("host routing", () => {
  it("normalizes ports and forwarded host lists", () => {
    expect(normalizeHost("Firm.Example.com:443, proxy.internal")).toBe("firm.example.com");
  });

  it("allows the landing page and client portal on a firm domain", () => {
    expect(decideHostRoute("www.firm.com", "/", platformUrl)).toEqual({ kind: "next" });
    expect(decideHostRoute("www.firm.com", "/client/login", platformUrl)).toEqual({ kind: "next" });
  });

  it("moves admin and admin auth routes to the platform origin", () => {
    expect(decideHostRoute("www.firm.com", "/admin/documents", platformUrl)).toEqual({
      kind: "redirect",
      destination: "https://platform.example.com/admin/documents"
    });
    expect(decideHostRoute("www.firm.com", "/auth/callback", platformUrl)).toEqual({
      kind: "redirect",
      destination: "https://platform.example.com/auth/callback"
    });
  });

  it("uses the platform root for admin and rejects its client portal", () => {
    expect(decideHostRoute("platform.example.com", "/", platformUrl)).toEqual({
      kind: "redirect",
      destination: "https://platform.example.com/admin/login"
    });
    expect(decideHostRoute("platform.example.com", "/client/login", platformUrl)).toEqual({ kind: "not_found" });
    expect(decideHostRoute("platform.example.com", "/admin/login", platformUrl)).toEqual({ kind: "next" });
  });
});
