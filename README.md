# WordVrs

WordVrs is a publishing ecosystem made of two connected apps that share one
backend, one database, and one account system:

- **WordVrs Writer** (`apps/writer`) — the platform for authors: rich text
  editor with autosave, poetry/novel/script modes, chapter organization with
  drag-and-drop reordering, characters/world-building/timeline/notes, version
  history, writing streaks, a dashboard (books, drafts, revenue, analytics,
  followers, subscribers, messages, publishing, marketing, settings), and a
  publishing flow that makes a book available in the Reader app.
- **WordVrs Reader** (`apps/reader`) — the platform for readers: discover,
  follow authors, subscribe, purchase or read free books, build a library,
  track reading progress, review and comment, and manage notifications.
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

## What's implemented vs. scaffolded

The core, end-to-end flows are fully functional against the real database:
auth, book/chapter CRUD with autosave and version snapshots, drag-and-drop
chapter ordering, characters/world/timeline/notes, publishing, discovery and
search, follows, purchases (as ledger records), reviews, comments,
library/reading progress/bookmarks/highlights, notifications, messaging, and
writing streaks.

A few specialized, infrastructure-heavy features are intentionally scaffolded
rather than faked, and are labeled "Coming soon" in the UI: real payment
processing/payouts (purchases and subscriptions are tracked today so this can
be wired to a processor like Stripe without a data migration), print-on-demand
fulfillment, AI-generated cover design, audiobook production/playback, and the
AI writing assistant's model integration. The data model and routes for all of
these already have a natural home (`Book.isbn`, `Purchase`, `Subscription`,
etc.) so they can be filled in incrementally.

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
