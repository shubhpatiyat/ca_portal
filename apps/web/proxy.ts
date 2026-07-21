import { NextRequest, NextResponse } from "next/server";
import { decideHostRoute } from "@/lib/host-routing";

export function proxy(request: NextRequest) {
  const decision = decideHostRoute(
    request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "",
    request.nextUrl.pathname,
    process.env.NEXT_PUBLIC_PLATFORM_URL ?? "http://localhost:3000"
  );

  if (decision.kind === "not_found") {
    return new NextResponse("Not Found", { status: 404 });
  }

  if (decision.kind === "redirect") {
    const destination = new URL(decision.destination);
    destination.search = request.nextUrl.search;
    return new NextResponse(null, {
      status: 307,
      headers: { location: destination.toString() }
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/admin/:path*", "/auth/callback", "/client/:path*"]
};
