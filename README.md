# CA Site Platform

Production-minded MVP for a guided multi-tenant website platform for Chartered Accountants in India. CA firms edit plain business fields, while the public site renders a fixed library of typed frontend-owned sections.

## What Is Included

- `apps/web`: Next.js App Router, TypeScript, Tailwind CSS, accessible admin UI, public SEO-rendered tenant pages, revalidation route, lead form, typed section renderer.
- `apps/api`: FastAPI, SQLAlchemy 2.0 models, Alembic migration, Pydantic v2 section registry, Supabase JWT verification, tenant membership checks, onboarding, draft/publish/restore, public delivery, media and lead routes.
- `docs` and `infra`: placeholders for future operational notes.

## Local Setup

1. Install web dependencies:

```bash
npm install
```

2. Create and activate a Python environment, then install API dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r apps/api/requirements.txt
```

3. Copy environment examples:

```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

4. Configure Supabase values in `apps/api/.env` and `apps/web/.env.local`.

5. Run migrations from the API directory:

```bash
cd apps/api
alembic upgrade head
cd ../..
```

6. Seed the demo firm:

```bash
PYTHONPATH=apps/api python -m app.services.seed
```

7. Start the API and web app:

```bash
npm run dev:api
npm run dev:web
```

Demo site: `http://localhost:3000/s/sharma-associates`

Default tenant-domain demo after seeding: `http://sharma-associates.lvh.me:3000`

## Supabase Setup

- Create a Supabase project.
- Use the project PostgreSQL connection string for `DATABASE_URL`.
- Set `SUPABASE_URL` to the project URL.
- Set `SUPABASE_SERVICE_ROLE_KEY` from Project Settings > API. Keep it server-only.
- Set `SUPABASE_JWT_ISSUER` to the Supabase auth issuer for your project.
- Keep `SUPABASE_JWT_AUDIENCE=authenticated`.
- Enable email/password auth.
- Create a public storage bucket named `website-assets`.
- Add policies that allow service-role writes and public reads for MVP website images.
- Create or copy an Auth user UUID into `SEED_OWNER_USER_ID`, then run the seed command.

## Local Commands

```bash
npm run dev:web
npm run build:web
npm run dev:api
npm run test:api
```

## Deployment

### Netlify

- Set the site base directory to `apps/web`.
- Use `apps/web/netlify.toml`.
- Configure:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_API_URL`
  - `API_BASE_URL`
  - `NEXT_REVALIDATE_SECRET`
  - `NEXT_PUBLIC_PLATFORM_URL`
  - `NEXT_PUBLIC_PLATFORM_DOMAIN`
  - `NEXT_PUBLIC_PLATFORM_SCHEME`

### Render

- Use `apps/api/render.yaml`.
- Configure the environment variables from `apps/api/.env.example`.
- Ensure `CORS_ORIGINS` includes the Netlify origin.
- Set `NEXT_REVALIDATE_URL` to `https://your-netlify-site.netlify.app/api/revalidate`.
- Set `PLATFORM_DOMAIN` to the root used for generated tenant domains, for example `yourapp.com`, `app.chat.localhost`, or `lvh.me:3000` locally.
- Set `PLATFORM_SCHEME` to `https` in production and `http` for local wildcard domains.

## Core Flows

- Onboarding creates an organization, owner membership, website config, verified default platform domain, home page, draft revision and default sections.
- Editors can update drafts, reorder sections, upload scoped media and preview the current draft.
- Only owners can publish. Publishing validates every section, snapshots a published revision, archives the prior published revision, writes audit logs and calls Next.js revalidation.
- Public delivery returns only published visible sections, SEO data and contact details.
- Public leads are rate-limited, scoped to the organization and shown in the admin leads view.

## MVP Limitations

- Custom domain DNS verification is modeled but not implemented.
- Media presign returns the scoped storage URL shape; production upload signing should call Supabase Storage APIs with service-role credentials.
- The web app includes demo fallbacks when `NEXT_PUBLIC_API_URL` is not configured so the vertical slice is reviewable locally before Supabase is connected.
- Email notifications and background jobs are intentionally excluded from this MVP.
