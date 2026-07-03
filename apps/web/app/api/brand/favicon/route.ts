import { NextResponse } from "next/server";
import { brandInitials } from "@/lib/brand";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function GET(request: Request) {
  const url = new URL(request.url);
  const name = url.searchParams.get("name") ?? "CA";
  const initials = escapeXml(brandInitials(name));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#041627"/>
  <rect x="5" y="5" width="54" height="54" rx="11" fill="none" stroke="#3a674f" stroke-width="3"/>
  <text x="32" y="39" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="22" font-weight="700" fill="#fbf9f4">${initials}</text>
</svg>`;

  return new NextResponse(svg, {
    headers: {
      "content-type": "image/svg+xml",
      "cache-control": "public, max-age=3600"
    }
  });
}
