# Build context must be the repository root (this is a pnpm workspace and
# @wordvrs/api depends on the workspace lockfile + sibling packages).
#   docker build -f apps/api/Dockerfile .

FROM node:20-alpine AS base
RUN corepack enable
WORKDIR /repo

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @wordvrs/api prisma:generate
RUN pnpm --filter @wordvrs/api build

FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /repo ./
EXPOSE 4000
CMD ["sh", "-c", "pnpm --filter @wordvrs/api exec prisma migrate deploy && pnpm --filter @wordvrs/api start"]
