/**
 * Login-screen wisdom — lines drawn from *The Almanack of Naval Ravikant*
 * (Eric Jorgenson's compilation of Naval's writing, tweets, and podcast
 * transcripts), chosen to resonate with what Pragati is for: building
 * leverage through code and systems, applying specific knowledge, judging
 * what to do next, and letting small daily work compound into delivery.
 *
 * Display rule: NO attribution is ever rendered. The words stand alone — the
 * login page shows the line, never the name or the source. (`author` is kept on
 * the type for internal curation only and is never surfaced in the UI.)
 *
 * No-repeat rule: the login page rotates through a per-device shuffled queue
 * and never repeats a quote until the whole library is exhausted. Each quote
 * also stays on screen for a length of time proportional to how long it takes
 * to read (see `readingMs` on the login page), so longer lines aren't cut off.
 *
 * The library can still be refreshed forever without a redeploy by hosting a
 * JSON array of {text, author} and setting QUOTES_FEED_URL — /api/quotes
 * serves the feed with this list as permanent fallback.
 */

export interface Quote {
  text: string;
  author: string; // internal curation key only — never rendered
}

export const BUILTIN_QUOTES: Quote[] = [
  // ── Leverage: build it once, let it work ────────────────────────────────
  {
    text: 'Code and media are permissionless leverage. They’re the leverage behind the newly rich.',
    author: 'The Almanack of Naval Ravikant',
  },
  {
    text: 'All the returns in life, whether in wealth, relationships, or knowledge, come from compound interest.',
    author: 'The Almanack of Naval Ravikant',
  },
  { text: 'You’re not going to get rich renting out your time.', author: 'The Almanack of Naval Ravikant' },
  { text: 'Earn with your mind, not your time.', author: 'The Almanack of Naval Ravikant' },
  // ── Specific knowledge & judgment ────────────────────────────────────────
  {
    text: 'Specific knowledge is knowledge that you cannot be trained for.',
    author: 'The Almanack of Naval Ravikant',
  },
  {
    text: 'Specific knowledge is found by pursuing your genuine curiosity and passion rather than whatever is hot right now.',
    author: 'The Almanack of Naval Ravikant',
  },
  {
    text: 'Become the best in the world at what you do. Keep redefining what you do until this is true.',
    author: 'The Almanack of Naval Ravikant',
  },
  { text: 'Clear thinking requires courage.', author: 'The Almanack of Naval Ravikant' },
  // ── Decisions & momentum ─────────────────────────────────────────────────
  { text: 'If you can’t decide, the answer is no.', author: 'The Almanack of Naval Ravikant' },
  { text: 'Set and enforce an aspiration rate for yourself.', author: 'The Almanack of Naval Ravikant' },
  { text: 'Inspiration is perishable — act on it immediately.', author: 'The Almanack of Naval Ravikant' },
  {
    text: 'Embrace accountability, and take business risks under your own name. Society will reward you with responsibility, equity, and leverage.',
    author: 'The Almanack of Naval Ravikant',
  },
  // ── Long-term games, long-term people ────────────────────────────────────
  { text: 'Play long-term games with long-term people.', author: 'The Almanack of Naval Ravikant' },
  {
    text: 'Choose business partners with high intelligence, energy, and, above all, integrity.',
    author: 'The Almanack of Naval Ravikant',
  },
  {
    text: 'Don’t partner with cynics and pessimists. Their beliefs are self-fulfilling.',
    author: 'The Almanack of Naval Ravikant',
  },
  { text: 'Praise specifically, criticize generally.', author: 'The Almanack of Naval Ravikant' },
  // ── Calm execution, sustainable pace ─────────────────────────────────────
  {
    text: 'A fit body, a calm mind, a house full of love. These things cannot be bought. They must be earned.',
    author: 'The Almanack of Naval Ravikant',
  },
  {
    text: 'Happiness is a choice you make and a skill you develop.',
    author: 'The Almanack of Naval Ravikant',
  },
  {
    text: 'Anger is a hot coal that burns you more than the person you’re aiming at.',
    author: 'The Almanack of Naval Ravikant',
  },
  {
    text: 'Desire is a contract you make with yourself to be unhappy until you get what you want.',
    author: 'The Almanack of Naval Ravikant',
  },
  // ── Always learning ──────────────────────────────────────────────────────
  {
    text: 'Learn to sell, learn to build. If you can do both, you will be unstoppable.',
    author: 'The Almanack of Naval Ravikant',
  },
  { text: 'Read what you love until you love to read.', author: 'The Almanack of Naval Ravikant' },
  {
    text: 'Free education is abundant. It’s the desire to learn that’s scarce.',
    author: 'The Almanack of Naval Ravikant',
  },
  {
    text: 'The most important skill for getting rich is becoming a perpetual learner.',
    author: 'The Almanack of Naval Ravikant',
  },
  {
    text: 'The Internet has massively broadened the possible space of careers.',
    author: 'The Almanack of Naval Ravikant',
  },
];

/** Deterministic daily starting point so everyone who opens the login page on
 *  the same day begins on the same quote (then rotation takes over). */
export function dailyQuoteOffset(count: number, now: Date = new Date()): number {
  if (count <= 0) return 0;
  const day = Math.floor(now.getTime() / 86_400_000);
  return day % count;
}

/**
 * How long a quote should stay on screen — proportional to how long it takes to
 * read, so a one-liner doesn't linger and a long line isn't whisked away before
 * it's read. ~200 wpm (≈ 360 ms/word) over a small base, clamped so the
 * rotation never feels either frantic or stalled.
 */
export function readingMs(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const ms = 2600 + words * 360;
  return Math.min(Math.max(ms, 6000), 16000);
}
