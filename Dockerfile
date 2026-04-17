# syntax=docker/dockerfile:1.7

# ---- deps ----
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# Skip optional dependencies that are needed only for dev screenshot tooling
# (puppeteer downloads Chromium at install time in some versions).
RUN npm ci --omit=dev --omit=optional --no-audit --no-fund || npm install --omit=dev --omit=optional --no-audit --no-fund

# ---- build ----
FROM node:20-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- runtime ----
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
RUN useradd -u 1001 -U -m -s /bin/false qinformx

COPY --from=deps   /app/node_modules ./node_modules
COPY --from=build  /app/.next        ./.next
COPY --from=build  /app/public       ./public
COPY --from=build  /app/package.json /app/package-lock.json ./
COPY --from=build  /app/next.config.mjs ./
COPY --from=build  /app/src          ./src
COPY --from=build  /app/tsconfig.json ./
COPY --from=build  /app/scripts      ./scripts
COPY --from=build  /app/tailwind.config.ts /app/postcss.config.mjs ./

USER qinformx
EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "-p", "3000", "-H", "0.0.0.0"]
