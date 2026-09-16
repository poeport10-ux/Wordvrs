# WordVrs

WordVrs is a publishing ecosystem made of two connected apps that share one
backend, one database, and one account system:

- **WordVrs Writer** (`apps/writer`) — the platform for authors: rich text
  editor with autosave, novel/poetry/script/interactive-fiction modes, chapter
  organization with drag-and-drop reordering and branching choices for
  interactive fiction, voice dictation and a writing-prompt generator,
  characters/world-building/timeline/notes, version history, writing streaks
  and achievement badges, author-hosted events (Q&As, live readings), a
  dashboard (books, drafts, revenue, analytics, followers, subscribers,
  messages, publishing, marketing, settings), and a publishing flow that makes
  a book available in the Reader app.
- **WordVrs Reader** (`apps/reader`) — the platform for readers: discover
  (including a trending tab), follow authors, subscribe, purchase or read free
  books, build a library, track reading progress and reading streaks, navigate
  branching/interactive fiction, read aloud with text-to-speech, customize
  font size/line spacing/dyslexia-friendly spacing/high-contrast mode, RSVP to
  author events, review and comment, and manage notifications.
- **WordVrs API** (`apps/api`) — the shared Express + Prisma + PostgreSQL
  backend both apps talk to. One user table, one auth system, one book
  catalog — publishing a book in Writer immediately makes it discoverable in
  Reader according to the author's visibility setting.

Shared code lives in `packages/`:

- `packages/shared` — TypeScript domain types and a small fetch-based API
  client used by both frontends.
- `packages/theme` — the cosmic design system (Tailwind preset + CSS
  variables) that gives both apps a consistent, unique visual identity while
  keeping each app's own accent color (violet for Writer, teal for Reader).

## Getting started

```bash
pnpm install

# start Postgres locally
docker compose up -d

# configure the API
cp apps/api/.env.example apps/api/.env
pnpm --filter @wordvrs/api prisma:migrate
pnpm --filter @wordvrs/api seed   # optional demo data

# run everything (in separate terminals)
pnpm dev:api       # http://localhost:4000
pnpm dev:writer    # http://localhost:5173
pnpm dev:reader    # http://localhost:5174
```

Demo accounts created by the seed script:

- Writer: `nova@wordvrs.dev` / `password123`
- Reader: `reader@wordvrs.dev` / `password123`

Both apps read `VITE_API_URL` (defaults to `http://localhost:4000`) to reach
the shared API.

## Deployment

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for deploying WordVrs to
prophetpoe.com (Reader + Writer on Vercel, API on Azure).

## What's implemented vs. scaffolded

The core, end-to-end flows are fully functional against the real database:
auth, book/chapter CRUD with autosave and version snapshots, drag-and-drop
chapter ordering, branching/interactive fiction, characters/world/timeline/
notes, publishing, discovery (newest + trending) and search, follows,
purchases (as ledger records), reviews, comments, library/reading progress/
bookmarks/highlights, notifications, messaging, writing and reading streaks,
achievement badges, author-hosted events with RSVPs, voice dictation and
read-aloud (via the browser's native Web Speech API — no external AI service
required), and reading accessibility settings (font size, line spacing,
dyslexia-friendly spacing, high contrast).

A few specialized, infrastructure-heavy features are intentionally scaffolded
rather than faked, and are labeled "Coming soon" in the UI: real payment
processing/payouts (purchases and subscriptions are tracked today so this can
be wired to a processor like Stripe without a data migration), print-on-demand
fulfillment, AI-generated cover design, audiobook production/playback, and a
model-backed AI writing assistant (today's "writing prompt" button is a static
curated list, not a live model call). The data model and routes for all of
these already have a natural home (`Book.isbn`, `Purchase`, `Subscription`,
etc.) so they can be filled in incrementally.

## Roadmap: mapping the original concept doc

WordVrs started from a much larger brainstorm document (~150 screens, ~400
feature ideas, an AI feature catalog, and a phased business plan). Most of
that list is either implemented above, or is a UI variant of something already
implemented (e.g. the doc's dozens of near-duplicate "personalized
recommendation" and "reading analytics" entries collapse into the trending/
feed/analytics endpoints that already exist). The categories below are the
ones **not** built, called out explicitly rather than silently dropped —
several of these are marked "TBD" or "not included" in the concept doc's own
phase plan, which is the prioritization this list follows:

- **Real AI model integration** — the doc's ~240 "AI assistant" bullet points
  (content generation, plot/character tools, market analysis, cover critique,
  etc.) all require a live LLM/image-generation API and a product decision on
  which provider and cost model to use. The writing-prompt button and the
  editor's dictation/read-aloud features are the non-model-backed slice of
  this that's genuinely built today.
- **Payments, royalties, and print-on-demand** — real checkout, payouts, tax
  forms, and POD fulfillment need a payment processor and a POD partner
  integration; purchases/subscriptions are tracked so this is additive.
- **Audiobook production & playback** — narration tooling and an audio player.
- **VR/AR interactive storytelling, video chat** — explicitly marked "not
  included" / left for a future phase in the concept doc itself.
- **Admin/moderation dashboard, content moderation queue, spam filtering,
  user bans** — a separate internal tool; the data model (comments, reviews,
  users) is ready for it.
- **Two-factor auth, IP whitelisting, audit trail, GDPR/compliance tooling** —
  security hardening beyond this MVP's JWT auth.
- **Translation/localization services, multi-language UI** — needs a
  translation API and an i18n pass across both apps.
- **OAuth/social login** — email+password only today.
- **Merchandise storefront & fulfillment, crowdfunding, in-app virtual
  currency/gift cards** — separate commerce surfaces beyond book
  sales/subscriptions.
- **Literary agent matching, PR services, professional editing marketplace**
  — third-party marketplace/matching products, not core to the writer/reader
  loop.
- **Dedicated book-club spaces** — today's Comments thread on each book
  covers the same discussion need; a dedicated club/group model with its own
  membership and events would be the next step.

## Monorepo layout

```
apps/
  api/      Express + Prisma + PostgreSQL backend
  writer/   React + Vite Writer app
  reader/   React + Vite Reader app
packages/
  shared/   Shared types + API client
  theme/    Shared Tailwind design tokens
```
