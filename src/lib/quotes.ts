/**
 * Login-screen wisdom — curated to what Pragati is actually for: doing the
 * work. Every line speaks to execution, focus, finishing, cutting the
 * unessential, and compounding small daily progress into delivery — not wealth,
 * career, or self-help in the abstract.
 *
 * Sourced exclusively from two pools, each verified against multiple
 * independent sources before inclusion (this is a public-facing screen, so
 * nothing here is recalled from memory and trusted on faith):
 *
 *   1. Jensen Huang and the books he has publicly named as recommended
 *      reading — Andrew Grove's "Only the Paranoid Survive" (Huang has
 *      called Grove's books "all really good"), Ryan Holiday's "The
 *      Obstacle Is the Way", and Eric Ries's "The Lean Startup".
 *   2. Jeff Bezos (his own words, e.g. the annual shareholder letters) and
 *      books on the documented "Jeff's Reading List" (per Brad Stone's "The
 *      Everything Store" and corroborating reporting) — Fred Brooks' "The
 *      Mythical Man-Month", Eliyahu Goldratt's "The Goal", Jim Collins'
 *      "Good to Great" and "Built to Last", and Womack & Jones' "Lean
 *      Thinking".
 *
 * Restricted within both pools to lines that map to getting work shipped: no
 * complacency, character earned under load, learning faster than the
 * competition, judging the work — and the system that produces it —
 * straight.
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
  // ── Do the work — struggle is the price of the result ────────────────────
  {
    text: 'You have to suffer, struggle, and endeavor to do hard things to really appreciate what you’ve done.',
    author: 'Jensen Huang',
  },
  { text: 'Action is commonplace, right action is not.', author: 'Ryan Holiday, The Obstacle Is the Way' },
  { text: 'If you cannot fail, you cannot learn.', author: 'Eric Ries, The Lean Startup' },
  {
    text: 'The only way to win is to learn faster than anyone else.',
    author: 'Eric Ries, The Lean Startup',
  },

  // ── No complacency — stay paranoid about what matters ────────────────────
  {
    text: 'Success breeds complacency. Complacency breeds failure. Only the paranoid survive.',
    author: 'Andrew Grove, Only the Paranoid Survive',
  },
  {
    text: 'When it comes to business, I believe in the value of paranoia.',
    author: 'Andrew Grove, Only the Paranoid Survive',
  },
  {
    text: 'Most companies don’t die because they are wrong; most die because they don’t commit themselves.',
    author: 'Andrew Grove, Only the Paranoid Survive',
  },
  { text: 'There are two options: adapt or die.', author: 'Andrew Grove, Only the Paranoid Survive' },
  {
    text: 'Don’t differentiate without a difference.',
    author: 'Andrew Grove, Only the Paranoid Survive',
  },
  {
    text: 'Bad companies are destroyed by crisis. Good companies survive them. Great companies are improved by them.',
    author: 'Andrew Grove, Only the Paranoid Survive',
  },

  // ── Character & ownership — earned under load ─────────────────────────────
  { text: 'I wish upon you ample doses of pain and suffering.', author: 'Jensen Huang' },
  { text: 'Greatness is not intelligence. Greatness comes from character.', author: 'Jensen Huang' },
  {
    text: 'Nobody owes you a career. Your career is literally your business. You own it as a sole proprietor.',
    author: 'Andrew Grove, Only the Paranoid Survive',
  },

  // ── Focus — the one thing in front of you ────────────────────────────────
  {
    text: 'Remember that this moment is not your life, it’s just a moment in your life. Focus on what is in front of you, right now.',
    author: 'Ryan Holiday, The Obstacle Is the Way',
  },
  {
    text: 'Perception precedes action. Right action follows the right perspective.',
    author: 'Ryan Holiday, The Obstacle Is the Way',
  },

  // ── See it straight — honest judgment & problems ─────────────────────────
  {
    text: 'There is the event itself and the story we tell ourselves about what it means.',
    author: 'Ryan Holiday, The Obstacle Is the Way',
  },
  {
    text: 'Failure shows us the way — by showing us what isn’t the way.',
    author: 'Ryan Holiday, The Obstacle Is the Way',
  },
  {
    text: 'It matters what you do with what happens and what you’ve been given.',
    author: 'Ryan Holiday, The Obstacle Is the Way',
  },

  // ── Day 1 — customer obsession, never coast on yesterday's win ───────────
  {
    text: 'Day 2 is stasis. Followed by irrelevance. Followed by excruciating, painful decline. Followed by death. And that is why it is always Day 1.',
    author: 'Jeff Bezos, 2016 letter to shareholders',
  },
  {
    text: 'Obsessive customer focus is by far the most protective of Day 1 vitality.',
    author: 'Jeff Bezos, 2016 letter to shareholders',
  },
  {
    text: 'Customers are always beautifully, wonderfully dissatisfied, even when they report being happy and business is great.',
    author: 'Jeff Bezos, 2016 letter to shareholders',
  },

  // ── Decide and move — regret the things you didn't try ───────────────────
  {
    text: 'I want to have minimized the number of regrets that I have in my life.',
    author: 'Jeff Bezos',
  },
  {
    text: 'Most of our regrets are acts of omission — the things we didn’t try, the paths untraveled.',
    author: 'Jeff Bezos',
  },
  { text: 'Disagree and commit.', author: 'Jeff Bezos, 2016 letter to shareholders' },

  // ── The system, not the hero — bottlenecks, team size, brutal facts ──────
  {
    text: 'Adding manpower to a late software project makes it later.',
    author: 'Fred Brooks, The Mythical Man-Month',
  },
  {
    text: 'An hour lost at a bottleneck is an hour out of the entire system. An hour saved at a non-bottleneck is worthless.',
    author: 'Eliyahu Goldratt, The Goal',
  },
  {
    text: 'The strength of the chain is determined by the weakest link.',
    author: 'Eliyahu Goldratt, The Goal',
  },
  { text: 'Good is the enemy of great.', author: 'Jim Collins, Good to Great' },
  {
    text: 'You absolutely cannot make a series of good decisions without first confronting the brutal facts.',
    author: 'Jim Collins, Good to Great',
  },
  { text: 'Success is never final.', author: 'Jim Collins, Built to Last' },
  {
    text: 'It is better to understand who you are than where you are going — for where you are going will almost certainly change.',
    author: 'Jim Collins, Built to Last',
  },
  {
    text: 'Value can only be defined by the ultimate customer.',
    author: 'Womack & Jones, Lean Thinking',
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
