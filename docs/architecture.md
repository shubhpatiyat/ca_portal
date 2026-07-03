# Architecture

The platform is dynamic in content, section order and visibility, but not free-form. A new visual section type requires code changes in:

1. Backend Pydantic section schemas.
2. Admin editor registry.
3. Public Next.js renderer registry.

The browser never sends an organization ID as the authority for writes. FastAPI resolves the current tenant through Supabase Auth user membership.
