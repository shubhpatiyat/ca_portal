import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  organization_id: z.string().min(1),
  organization_slug: z.string().min(1).optional().nullable(),
  hostnames: z.array(z.string().min(1).max(255)).max(20).optional().default([]),
  page_slugs: z.array(z.string().min(1).max(80)).min(1).max(20)
});

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const expected = process.env.NEXT_REVALIDATE_SECRET;

  if (!expected || authorization !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized revalidation request." }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid revalidation payload.", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const tags = new Set<string>();
  tags.add(`tenant:${parsed.data.organization_id}`);
  if (parsed.data.organization_slug) {
    tags.add(`tenant:${parsed.data.organization_slug}`);
  }

  for (const slug of parsed.data.page_slugs) {
    tags.add(`page:${parsed.data.organization_id}:${slug}`);
    if (parsed.data.organization_slug) {
      tags.add(`page:${parsed.data.organization_slug}:${slug}`);
    }
    for (const hostname of parsed.data.hostnames) {
      tags.add(`host:${hostname}`);
      tags.add(`page-host:${hostname}:${slug}`);
    }
  }

  tags.forEach((tag) => revalidateTag(tag, "max"));

  return NextResponse.json({
    revalidated: true,
    tags: [...tags]
  });
}
