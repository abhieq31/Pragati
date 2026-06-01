# Performance budgets & optimisation

This document records Pragati's front-end performance targets, the current
baseline (Vercel Speed Insights, P75), and the work done / planned to hit them.

## Budgets (P75, desktop)

| Metric | Target | Baseline | Status |
| ------ | ------ | -------- | ------ |
| Real Experience Score | ≥ 90 | 64 | Improving |
| First Contentful Paint (FCP) | ≤ 1.8 s | 3.19 s | Improving |
| Largest Contentful Paint (LCP) | ≤ 2.5 s | 6.07 s | Improving |
| Interaction to Next Paint (INP) | ≤ 200 ms | 80 ms | ✅ Met |
| Cumulative Layout Shift (CLS) | ≤ 0.1 | 0.06 | ✅ Met |
| Time to First Byte (TTFB) | ≤ 0.8 s | 0.17 s | ✅ Met |

INP, CLS and TTFB are already comfortably within budget. The work is on FCP/LCP,
both bottlenecked on the **client** (TTFB is low) — i.e. JavaScript size and
hydration of large client components, not server latency.

## What's been done

- **Non-render-blocking fonts.** General Sans loads with `media="print"` flipped
  to `all` on load + `display=swap`, so the page paints in the system font
  immediately instead of blocking FCP (`src/app/layout.tsx`).
- **Server-side theme paint.** `<html class="dark">` is resolved from a cookie
  on the first byte — no flash, no post-hydration repaint.
- **SSR-seeded dashboards.** The dashboard and detail pages render with real
  server-fetched data (`getLeadDashboardData`, `getProjectDetail`, …) so the
  first paint has content, not just a skeleton.
- **Lazy heavy widgets.** The contribution heatmap (`ActivityGraph`),
  onboarding tour, force-password and PIN modals are `next/dynamic` with
  `ssr: false`, keeping them out of the above-the-fold bundle.
- **`loading.tsx` everywhere.** Each route streams a lightweight loader while
  the server component resolves.
- **Icon tree-shaking.** `optimizePackageImports: ['lucide-react']` in
  `next.config.mjs`; import icons at the usage site, never a barrel of them.

## Still on the roadmap

- Continue splitting the two largest client components — `DashboardClient.tsx`
  and `AppShell.tsx` — into smaller lazily-loaded pieces, and convert the
  display-only parts (summary chips, counts) into server components.
- Move client-side `api()` fetches that run on mount to server fetches with
  `cache`/`revalidate` so navigations don't re-fetch.
- Add `stale-while-revalidate` headers on read-mostly API responses.

## How to profile

1. `npm run build && npm start`, then open the route in Chrome.
2. DevTools → **Performance** → record a reload; read FCP/LCP markers.
3. DevTools → **Coverage** to find unused JS/CSS shipped to a route.
4. `npx next build` prints per-route **First Load JS** — watch for routes that
   balloon past the shared baseline (~88 kB) and split them.
5. Validate real-user numbers in **Vercel → Speed Insights** (P75), not just lab.

## Definition of done for a perf PR

- No route's First Load JS regresses by more than ~5 kB without justification.
- No new render-blocking resource (font, stylesheet, sync script) in `<head>`.
- CLS stays ≤ 0.1 (reserve space for async content; no layout-shifting inserts).
