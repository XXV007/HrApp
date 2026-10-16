<div align="center">

# ✦ Talent Radar

### A focused talent intelligence workspace for modern recruiting teams

Describe the person you need in plain English, surface the most relevant candidates, and move promising people into organized shortlists.

<p>
  <img src="https://img.shields.io/badge/Next.js-16-111827?style=flat-square&logo=next.js&logoColor=white" alt="Next.js 16">
  <img src="https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Supabase-ready-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase">
  <img src="https://img.shields.io/badge/Stripe-webhooks-635BFF?style=flat-square&logo=stripe&logoColor=white" alt="Stripe">
</p>

</div>

> Talent Radar is a recruiter-focused MVP built with the Next.js App Router. It combines natural-language candidate search, relevance ranking, multi-tenant Supabase persistence, shortlist workflows, saved briefs, usage limits, and Stripe billing events in one clean workspace.

## Product preview

The workspace is designed around one high-signal action:

1. **Write a hiring brief** — “Senior React engineers in New York who have worked at a startup.”
2. **Search the candidate universe** — structured filters are extracted from the brief.
3. **Review ranked matches** — candidates are returned with relevance scores, skills, location, and work availability.
4. **Save the workflow** — persist searches, briefs, and shortlist decisions for the recruiting team.

## Features

| Area | What is included |
| --- | --- |
| **Natural-language search** | Parses roles, seniority, cities, skills, schools, languages, PhDs, startup experience, and “open to work” intent. |
| **Deterministic ranking** | Produces repeatable, fixture-compatible results with relevance scoring and stable ordering. |
| **Candidate workspace** | Responsive search interface with example briefs, loading states, empty states, match percentages, and actionable error messaging. |
| **Search history** | Stores complete search results and supports paginated retrieval through a persistent search ID. |
| **Shortlists** | Creates company-scoped shortlists and adds or removes candidates from them. |
| **Saved briefs** | Saves reusable recruiting prompts for future searches. |
| **Authentication and tenancy** | Supabase bearer-token authentication with company membership checks and row-level security policies. |
| **Usage controls** | Free-plan search credits are enforced transactionally in Postgres; paid companies bypass the free limit. |
| **Billing events** | Stripe webhook signatures are verified, duplicate events are ignored, and out-of-order billing events do not overwrite newer state. |
| **Extensible search intelligence** | The structured `SearchFilters` contract can sit behind an LLM provider without changing the API response shape. |

## Tech stack

- **Frontend:** Next.js 16, React 19, TypeScript, CSS
- **Backend:** Next.js Route Handlers
- **Database and auth:** Supabase, Postgres, Supabase Auth, row-level security
- **Payments:** Stripe webhook processing
- **Validation:** TypeScript, ESLint, Vitest
- **Data:** JSON candidate fixtures plus a Supabase JSONB candidate store

## Quick start

### Prerequisites

- Node.js `>=20.9.0`
- npm
- A Supabase project, or Docker plus the Supabase CLI for local development
- Stripe CLI for live webhook forwarding tests

### Install and run

```bash
git clone https://github.com/XXV007/HrApp.git
cd HrApp

npm install
cp .env.example .env.local
```

Set the values in `.env.local` before starting the app:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
LLM_API_KEY=
LLM_MODEL=
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase setup

### Hosted project

Authenticate the CLI, link the project, and apply the migrations:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
npm run import:candidates
```

The migration set creates:

- Companies and recruiter profiles
- Shortlists and shortlist candidates
- Saved briefs
- Persisted searches and monthly search usage
- Candidate documents and full-text search indexes
- Stripe event storage
- Company-scoped row-level security policies

`npm run import:candidates` loads the tracked candidate fixture into the
Supabase `candidates` table in 500-row batches. It requires the server-side
service-role key and is intended for initial setup or fixture refreshes.

The search quota and API rate limit are enforced in Postgres through the
`create_search_with_quota` and `consume_api_rate_limit` functions. This keeps
quota consumption and search persistence atomic and works across multiple
application instances.

### Local project

With Docker running:

```bash
npx supabase start
npm run db:reset
```

The seed script creates local Acme and Globex recruiter accounts. The sample
password is intended only for local development and must not be reused.

## API

Protected endpoints expect:

```http
Authorization: Bearer <supabase-access-token>
```

### Search

```http
POST /api/search
Content-Type: application/json

{ "brief": "Senior React engineers in New York who have worked at a startup" }
```

Returns a `search_id`, parsed filters, total matches, the first page of results,
and the remaining free-plan search allowance.

```http
GET /api/search/{search_id}?page=1
```

Returns the persisted results in pages of 20.

### Recruiting workflows

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/people/{id}` | Retrieve an authenticated candidate profile |
| `GET` / `POST` | `/api/shortlists` | List or create company shortlists |
| `POST` / `DELETE` | `/api/shortlists/{shortlist_id}/people/{person_id}` | Manage shortlist membership |
| `GET` / `POST` | `/api/saved-briefs` | List or save recruiting briefs |
| `GET` | `/api/plan` | Read the current company plan |
| `POST` | `/api/billing/events` | Process a signed billing event |
| `POST` | `/api/stripe/webhook` | Receive Stripe webhook events |

## Stripe webhook testing

Start the app, then forward Stripe test events to the webhook route:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the generated `whsec_...` value into `.env.local`, restart the dev
server, and trigger a test event:

```bash
stripe trigger customer.subscription.created
```

Webhook handling verifies the Stripe signature, rejects stale or malformed
requests, deduplicates event IDs, and applies events in company/timestamp order.

## Quality checks

Run the complete local validation suite:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The test suite covers:

- Search filter extraction and deterministic ranking
- Search pagination
- Authentication rejection and persisted search responses
- Valid, tampered, malformed, and expired Stripe signatures

Optional Supabase integration checks can run against a configured project after
the migrations and candidate import have completed:

```bash
RUN_INTEGRATION=1 npm test -- tests/integration/supabase.test.ts
```

Browser smoke tests use Playwright:

```bash
npx playwright install
npm run test:e2e
```

Set `E2E_BASE_URL`, `E2E_EMAIL`, and `E2E_PASSWORD` for an authenticated
workflow test. Without credentials, the smoke test validates the login page.

The default Playwright configuration starts a production-like local server for
the browser suite. If a server is already running, point the suite at it with
`E2E_BASE_URL`.

Convenience commands are also available through the Makefile:

```bash
make dev
make lint
make test
make typecheck
make build
make db-reset
```

## Project structure

```text
app/
├── page.tsx                         # Recruiter search workspace
└── api/
    ├── search/                      # Search and persisted result pages
    ├── people/                      # Candidate profiles
    ├── shortlists/                  # Shortlist management
    ├── saved-briefs/                # Saved recruiting prompts
    ├── plan/                        # Company plan information
    └── stripe/webhook/              # Signed Stripe events
lib/
├── search.ts                        # Brief parsing and ranking
├── data.ts                          # Candidate fixture access
├── auth.ts                          # Supabase auth and tenancy checks
├── env.ts                           # Server environment validation
├── logger.ts                         # Structured JSON application logs
├── rate-limit.ts                     # Postgres-backed rate-limit client
└── types.ts                         # Shared domain types
supabase/
├── migrations/                      # Database schema, RLS, search, billing
└── seed.sql                         # Local development accounts
tests/                               # Vitest search, API, and Stripe tests
```

## Security notes

- Never commit `.env.local`, Supabase service-role keys, Stripe secrets, or
  access tokens.
- Keep the Supabase service-role key server-side only.
- Use test-mode Stripe keys during development.
- Replace the seeded local credentials before using a shared environment.
- Candidate access is protected by authenticated company membership and
  database row-level security.

## Current scope

Talent Radar is an intentionally focused MVP. The API and persistence layers
are ready for a production-oriented integration, while richer candidate detail views, subscription checkout, and deeper
shortlist management remain future product surfaces.

## License

This project is currently private and does not yet declare an open-source
license.
