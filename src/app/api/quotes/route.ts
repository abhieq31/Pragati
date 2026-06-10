import { NextResponse } from 'next/server';
import { BUILTIN_QUOTES, type Quote } from '@/lib/quotes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/quotes — the login screen's quote library.
 *
 * Public (the login page is unauthenticated) and harmless: attributed quotes
 * only, no user data. When QUOTES_FEED_URL is set, the feed (a public JSON
 * array of {text, author} — host it as a GitHub raw file and the library
 * updates "life long" without a redeploy) is fetched and memoised in the
 * function instance for 6 hours; the built-in library is the permanent
 * fallback, so a broken feed can never blank the login page.
 */
let memo: { at: number; quotes: Quote[] } | null = null;
const MEMO_MS = 6 * 60 * 60 * 1000;

function sane(q: any): q is Quote {
  return (
    q &&
    typeof q.text === 'string' &&
    q.text.trim().length > 0 &&
    q.text.length <= 400 &&
    typeof q.author === 'string' &&
    q.author.length <= 60
  );
}

export async function GET() {
  let quotes = BUILTIN_QUOTES;
  const feed = process.env.QUOTES_FEED_URL?.trim();
  if (feed) {
    if (memo && Date.now() - memo.at < MEMO_MS) {
      quotes = memo.quotes;
    } else {
      try {
        const res = await fetch(feed, { signal: AbortSignal.timeout(2500) });
        if (res.ok) {
          const data = (await res.json()) as unknown;
          if (Array.isArray(data)) {
            const cleaned = data.filter(sane).slice(0, 200);
            if (cleaned.length >= 5) {
              memo = { at: Date.now(), quotes: cleaned };
              quotes = cleaned;
            }
          }
        }
      } catch {
        /* feed unreachable — built-ins carry the day */
      }
    }
  }
  return NextResponse.json(
    { quotes },
    { headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' } },
  );
}
