# Talent Radar

A minimal recruiter assessment app built with Next.js 16 App Router, Supabase, and Stripe webhook handling.

## Run locally

```bash
make setup
cp .env.example .env.local
# Set the Supabase URL, anon key, service-role key, and Stripe webhook secret.
npx supabase start             # local development
make db-reset                  # applies migrations and supabase/seed.sql
make dev
```

For a hosted Supabase project, set the three Supabase variables from the
project's API settings in `.env.local` (never commit that file), then apply
the migrations with `npx supabase link --project-ref YOUR_PROJECT_REF` and
`npx supabase db push`. The Supabase CLI is required for these commands.

Stripe webhook requests are verified using the Stripe signing-secret format.
Run `npm test` to validate accepted, tampered, malformed, and expired signed
events. To exercise a live test event, run `stripe listen --forward-to
localhost:3000/api/stripe/webhook`, copy the generated `whsec_...` value to
`STRIPE_WEBHOOK_SECRET`, and trigger a test event with the Stripe CLI.

The search API is deterministic and fixture-compatible (`POST /api/search`); an LLM provider can be integrated behind `LLM_API_KEY` without changing the structured `SearchFilters` contract. Fixture files are intentionally kept at the repository root.

## API

- Recruiter endpoints require `Authorization: Bearer <Supabase access token>`.
- `POST /api/search`: `{ brief }` returns a `search_id`, filters, total, first 20 results, and `searches_remaining`.
- `GET /api/search/{search_id}?page=N` returns persisted results (20 per page).
- `GET /api/people/{id}`, `GET/POST /api/shortlists`, and
  `POST/DELETE /api/shortlists/{shortlist_id}/people/{person_id}`.
- `GET/POST /api/saved-briefs`, `GET /api/plan`, and `POST /api/billing/events`.
- Billing events require a valid Stripe signature, are deduplicated, and are
  applied only in company/timestamp order.
