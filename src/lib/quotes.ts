/**
 * Login-screen wisdom — lines drawn from *The Book of Elon* (the curated
 * almanack of Elon Musk's own words), chosen to resonate with what Pragati is
 * for: executing fast and well, deleting needless process, simplifying, reading
 * delivery honestly, and seeking hard feedback.
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
  // ── Execute fast and well ────────────────────────────────────────────────
  { text: 'The point is ensuring we execute ultrafast and well.', author: 'The Book of Elon' },
  {
    text: 'Find the design necessity of every part and every process.',
    author: 'The Book of Elon',
  },
  { text: 'Physically go to where the problem is, immediately.', author: 'The Book of Elon' },
  { text: 'Eliminate what isn’t necessary to solve the key problem.', author: 'The Book of Elon' },
  {
    text: 'The first goal is to make the damn thing work—we’ll optimize it later.',
    author: 'The Book of Elon',
  },
  { text: 'Somebody has to do the real work.', author: 'The Book of Elon' },
  // ── Simplify ─────────────────────────────────────────────────────────────
  {
    text: 'Simplicity is our mantra. It creates both reliability and low cost.',
    author: 'The Book of Elon',
  },
  {
    text: 'It’s a lot of minimizing things that can go wrong and maximizing the efficiency of the simple things.',
    author: 'The Book of Elon',
  },
  { text: 'It’s easy to say “simplify,” but it’s very difficult to do it.', author: 'The Book of Elon' },
  // ── Time is the one thing you can’t scrap ────────────────────────────────
  { text: 'If a timeline is long, it’s wrong.', author: 'The Book of Elon' },
  {
    text: 'It’s okay to scrap equipment or money. It’s not okay to scrap time.',
    author: 'The Book of Elon',
  },
  // ── First principles & truth ─────────────────────────────────────────────
  {
    text: 'Start somewhere. Then be prepared to question your assumptions, fix what you did wrong, and adapt to reality.',
    author: 'The Book of Elon',
  },
  {
    text: 'The first-principles approach is a good way to figure out counterintuitive solutions.',
    author: 'The Book of Elon',
  },
  { text: 'Physics is law. Everything else is a recommendation.', author: 'The Book of Elon' },
  { text: 'It’s OK to be wrong. Just don’t be confident and wrong.', author: 'The Book of Elon' },
  {
    text: 'Being tenacious and super focused on the truth is extremely important. Look for feedback from all sources.',
    author: 'The Book of Elon',
  },
  // ── Feedback ─────────────────────────────────────────────────────────────
  { text: 'I’m a huge believer in taking feedback.', author: 'The Book of Elon' },
  {
    text: 'Pay close attention to negative feedback, and solicit it, particularly from friends. It’s incredibly helpful.',
    author: 'The Book of Elon',
  },
  // ── Teams & ownership ────────────────────────────────────────────────────
  {
    text: 'Always view yourself as working for the good of the company and never your department.',
    author: 'The Book of Elon',
  },
  {
    text: 'Wherever the smartest, most driven people are choosing to work, that company is going to win.',
    author: 'The Book of Elon',
  },
  {
    text: 'There is something special—far more rewarding than money—about working with an epic team to make breakthroughs.',
    author: 'The Book of Elon',
  },
  {
    text: 'As long as we push hard and are not complacent, the future is going to be great.',
    author: 'The Book of Elon',
  },
  // ── Work & resolve ───────────────────────────────────────────────────────
  { text: 'Don’t aspire to glory; aspire to work.', author: 'The Book of Elon' },
  { text: 'Nobody ever changed the world on forty hours a week.', author: 'The Book of Elon' },
  {
    text: 'Go do it. Just go out there and do it. People are far too afraid to try. Don’t be afraid to fail. Just go.',
    author: 'The Book of Elon',
  },
  { text: 'Look fear straight in the eye and it will disappear.', author: 'The Book of Elon' },
  {
    text: 'Come hell or high water, we are going to make this work.',
    author: 'The Book of Elon',
  },
  { text: 'Failure is essentially irrelevant unless it is catastrophic.', author: 'The Book of Elon' },
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
