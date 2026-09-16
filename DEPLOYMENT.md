# Deploying WordVrs to prophetpoe.com

WordVrs is three separately-deployable services sharing one Postgres
database. There's no single "build the site" step — each piece deploys to
its own host and is wired together with environment variables and DNS.

| Service                  | What it is         | Host       | Domain                                        |
| ------------------------ | ------------------- | ---------- | ---------------------------------------------- |
| `apps/reader`             | Reader app (+ its own marketing landing page) | Vercel     | `prophetpoe.com`, `www.prophetpoe.com`        |
| `apps/writer`             | Writer app (+ its own marketing landing page) | Vercel     | `write.prophetpoe.com`                        |
| `apps/api`                | Express + Prisma + Postgres backend            | Azure (Web App for Containers + Postgres Flexible Server) | `api.prophetpoe.com` |

The frontends stay on Vercel (a good fit for static Vite SPAs, free tier,
zero-config Vite detection). The API — a stateful long-running Express
process with a Postgres dependency — deploys to Azure as a container:
Azure Container Registry holds the image, a Linux Web App for Containers
runs it, and Azure Database for PostgreSQL Flexible Server is the
database. A GitHub Actions workflow
(`.github/workflows/deploy-api-azure.yml`) builds `apps/api/Dockerfile`
and pushes/deploys on every push to `apps/api`.

I don't have Azure, Vercel, or IONOS credentials, so the steps below are
things you (or whoever holds those accounts) need to run/click through by
hand. Everything on the repo side — Dockerfile, Vercel config, the Azure
GitHub Actions workflow, CORS wiring, cross-app links — is already
committed.

## 1. Deploy the API (Azure)

### 1a. Create the Azure resources

Run these with the [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli)
(`az login` first). They use the same resource names the GitHub Actions
workflow already expects (`wordvrsacr`, `wordvrs-api`) — if you rename
anything, update `ACR_NAME`/`WEBAPP_NAME` at the top of
`.github/workflows/deploy-api-azure.yml` to match.

```bash
# Resource group — everything below lives in this one
az group create --name wordvrs-rg --location eastus

# Container registry for the API's Docker image
az acr create --resource-group wordvrs-rg --name wordvrsacr \
  --sku Basic --admin-enabled true

# Managed Postgres (adjust --admin-password to something strong)
az postgres flexible-server create \
  --resource-group wordvrs-rg --name wordvrs-db --location eastus \
  --admin-user wordvrs --admin-password '<STRONG_PASSWORD>' \
  --sku-name Standard_B1ms --tier Burstable --storage-size 32 --version 16 \
  --public-access 0.0.0.0-255.255.255.255
az postgres flexible-server db create \
  --resource-group wordvrs-rg --server-name wordvrs-db --database-name wordvrs

# Linux App Service plan + Web App for Containers
# (seeded with a placeholder image — the GitHub Actions workflow replaces it)
az appservice plan create --name wordvrs-plan --resource-group wordvrs-rg \
  --is-linux --sku B1
az webapp create --resource-group wordvrs-rg --plan wordvrs-plan \
  --name wordvrs-api \
  --deployment-container-image-name mcr.microsoft.com/appsvc/staticsite:latest
```

`--public-access 0.0.0.0-255.255.255.255` opens the Postgres server to the
internet (simplest to get started); once this is working, tighten it to
`--public-access AzureServices` or a VNet so only Azure resources can
reach it.

### 1b. Configure the Web App's runtime settings

```bash
az webapp config appsettings set --resource-group wordvrs-rg --name wordvrs-api --settings \
  WEBSITES_PORT=4000 \
  DATABASE_URL="postgresql://wordvrs:<STRONG_PASSWORD>@wordvrs-db.postgres.database.azure.com:5432/wordvrs?sslmode=require" \
  JWT_SECRET="<GENERATE_A_LONG_RANDOM_SECRET>" \
  CORS_ORIGINS="https://prophetpoe.com,https://www.prophetpoe.com,https://write.prophetpoe.com"
```

`WEBSITES_PORT` is the Azure-specific setting that tells App Service which
port your container listens on (the Express server listens on `PORT`,
which defaults to `4000` — see `apps/api/src/lib/env.ts`); App Service
does **not** infer this automatically for custom containers.

### 1c. Wire up GitHub Actions to build and deploy

The workflow needs three repo secrets (**Settings → Secrets and
variables → Actions → New repository secret**):

- `ACR_USERNAME` / `ACR_PASSWORD` — from `az acr credential show --name wordvrsacr`
- `AZURE_CREDENTIALS` — a service principal with rights to deploy to the
  resource group:
  ```bash
  az ad sp create-for-rbac --name wordvrs-gh-deploy --role contributor \
    --scopes /subscriptions/<YOUR_SUBSCRIPTION_ID>/resourceGroups/wordvrs-rg \
    --sdk-auth
  ```
  Paste the full JSON it prints as the secret value.

Push to `apps/api` on this repo's default branch
(`claude/wordvrs-writer-reader-apps-qxwl1l`) and the workflow builds the
Docker image, pushes it to ACR, and deploys it to the Web App. First
deploy runs `prisma migrate deploy` before starting the server (see the
Dockerfile `CMD`) — no manual migration step needed. You can also trigger
it by hand from the **Actions** tab (`workflow_dispatch`).

### 1d. Custom domain + HTTPS

```bash
az webapp config hostname add --webapp-name wordvrs-api \
  --resource-group wordvrs-rg --hostname api.prophetpoe.com
```

This will fail until the DNS records in step 3 are in place — Azure
verifies ownership via a `TXT` record before it'll accept the custom
domain. For the free TLS certificate, use the Portal rather than the CLI
(the steps are more stable there): your Web App → **Custom domains** →
confirm `api.prophetpoe.com` shows **Secure: Not Secure yet** → click it →
**Add binding** → **App Service Managed Certificate (Free)** → **SNI SSL**.

Sanity check once it's bound: `https://api.prophetpoe.com/health` should
return `{"status":"ok","service":"wordvrs-api"}`.

(Optional, demo data only) run `pnpm --filter @wordvrs/api seed` from
Azure's **SSH** console for the Web App (Portal → your Web App →
**Development Tools → SSH**). Skip this for a real production database.

## 2. Deploy the frontends (Vercel)

Create **two** Vercel projects from the same GitHub repo (Vercel supports
multiple projects per monorepo, each scoped to a subdirectory):

### Project: `wordvrs-reader`

- Root Directory: `apps/reader`
- Framework Preset: Vite (auto-detected)
- Environment variables:
  - `VITE_API_URL` = `https://api.prophetpoe.com`
  - `VITE_WRITER_URL` = `https://write.prophetpoe.com`
- Domains: add `prophetpoe.com` and `www.prophetpoe.com`

### Project: `wordvrs-writer`

- Root Directory: `apps/writer`
- Framework Preset: Vite (auto-detected)
- Environment variables:
  - `VITE_API_URL` = `https://api.prophetpoe.com`
  - `VITE_READER_URL` = `https://prophetpoe.com`
- Domains: add `write.prophetpoe.com`

`VITE_*` variables are baked in at build time, so set them **before** the
first deploy (or trigger a redeploy after adding them). Each app already
ships a `vercel.json` with a catch-all SPA rewrite so client-side routes
(`/discover`, `/book/:slug`, etc.) don't 404 on refresh.

## 3. DNS (IONOS)

prophetpoe.com is registered/managed at IONOS. Domain-lock (the
transfer-protection toggle IONOS shows on the domain overview page) only
blocks moving the domain to a different registrar — it does **not** block
editing DNS records, so you don't need to touch it for any of this.

Where to go: log in at [ionos.com](https://www.ionos.com) → **Domains &
SSL** → click **prophetpoe.com** → the **DNS** tab. You'll land on a table
of records very similar to the one below. IONOS pre-populates a couple of
its own defaults (usually an `A` record on `@` pointing at an IONOS
parking page, sometimes a `www` CNAME) — **edit those in place** rather
than adding duplicates; DNS won't let two records of the same type share a
host. Leave any `MX`/`TXT` records alone if you use IONOS for email — they
route mail, not the site.

Vercel shows you the exact target to use once you add the domain in its
dashboard (it sometimes issues a slightly different apex IP than the one
below) — treat what it displays as the source of truth over this table.
For `api`, Azure needs **two** records: the `CNAME` that actually routes
traffic, plus a `TXT` record it uses once to verify you own the domain
before it'll accept the custom-domain binding in step 1d.

| Host in IONOS's "Subdomain/Host" field | Type  | Points to (Value)                | Notes |
| --------------------------------------- | ----- | ---------------------------------- | ----- |
| `@` (or leave blank — IONOS uses this for the bare domain) | A     | `76.76.21.21` (Vercel's apex IP)   | Root domain, `prophetpoe.com` |
| `www`                                    | CNAME | `cname.vercel-dns.com`             | |
| `write`                                  | CNAME | `cname.vercel-dns.com`             | |
| `api`                                    | CNAME | `wordvrs-api.azurewebsites.net`    | Matches the `--name wordvrs-api` used when creating the Web App |
| `asuid.api`                              | TXT   | `<Custom Domain Verification ID>` | From `az webapp show --resource-group wordvrs-rg --name wordvrs-api --query customDomainVerificationId -o tsv`; needed only for domain verification, doesn't route traffic |

IONOS doesn't offer ALIAS/ANAME on standard plans, so the apex has to be
an `A` record (not a CNAME) — this is why `prophetpoe.com` and `www` use
different record types above; that's expected, not a mistake.

Save each record (IONOS applies them individually). Propagation with
IONOS is usually fast — often minutes, sometimes up to a few hours; rarely
the full 24–48h some registrars quote. You can check propagation with
`dig prophetpoe.com` / `dig api.prophetpoe.com TXT` from a terminal, or
whatsmydns.net, before assuming something's broken — and before retrying
the `az webapp config hostname add` command from step 1d if it fails.

Once Vercel shows the frontend domains as **Valid** (its dashboard polls
DNS and flags this automatically), its HTTPS certificates are issued
automatically. For `api.prophetpoe.com`, HTTPS is the manual "App Service
Managed Certificate" step in 1d, after the hostname binding succeeds.

## 4. Verify end-to-end

- `https://prophetpoe.com` loads the Reader landing page; "Are you an
  author?" links to `https://write.prophetpoe.com`.
- `https://write.prophetpoe.com` loads the Writer landing page; "Looking
  to read?" links back to `https://prophetpoe.com`.
- Register an account on either app, confirm login works and a
  published book shows up in Reader discovery — both apps share the same
  API/database, so this is the real integration check.

## Local development

Unchanged — see the root `README.md`. Local dev still uses
`docker-compose.yml` for Postgres and the three `pnpm dev:*` scripts; none
of the above affects local workflow.
