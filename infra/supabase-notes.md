# Supabase Notes

Create one public bucket for MVP assets:

```text
website-assets
```

Allowed paths:

```text
org/{organization_id}/logos/{uuid}.{ext}
org/{organization_id}/heroes/{uuid}.{ext}
org/{organization_id}/founders/{uuid}.{ext}
org/{organization_id}/testimonials/{uuid}.{ext}
```

Only `image/jpeg`, `image/png` and `image/webp` are accepted, with a 5 MB size limit.
