/**
 * Login-screen wisdom — curated to what Pragati is actually for: doing the
 * work. Every line speaks to execution, focus, finishing, cutting the
 * unessential, and compounding small daily progress into delivery — not wealth,
 * career, or self-help in the abstract.
 *
 * Sourced exclusively from Jeff Bezos — his own words (the annual Amazon
 * shareholder letters chief among them) — and books on the documented
 * "Jeff's Reading List" (per Brad Stone's "The Everything Store" and
 * corroborating reporting): Fred Brooks' "The Mythical Man-Month", Eliyahu
 * Goldratt's "The Goal", Jim Collins' "Good to Great" and "Built to Last",
 * and Womack & Jones' "Lean Thinking". Every line was checked against
 * multiple independent sources before inclusion — this is a public-facing
 * screen, so nothing here is recalled from memory and trusted on faith.
 * (Deliberately excluded: lines that read right out of context but trace to
 * a different, unverified book by the same author — e.g. Goldratt's "Tell me
 * how you measure me" is from "The Haystack Syndrome", not "The Goal".)
 *
 * Restricted to lines that map to getting work shipped: Day 1 urgency, bias
 * to action over waiting for certainty, bottlenecks and brutal facts over
 * wishful thinking, team-size and scheduling reality.
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
  {
    text: 'Put the customer first. Invent. And be patient.',
    author: 'Jeff Bezos',
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
  {
    text: 'Most decisions should probably be made with somewhere around 70% of the information you wish you had. If you wait for 90%, in most cases, you’re probably being slow.',
    author: 'Jeff Bezos, 2016 letter to shareholders',
  },

  // ── Invention is experiments, and experiments fail ───────────────────────
  {
    text: 'Failure and invention are inseparable twins. To invent you have to experiment, and if you know in advance that it’s going to work, it’s not an experiment.',
    author: 'Jeff Bezos',
  },
  {
    text: 'Invention requires a long-term willingness to be misunderstood.',
    author: 'Jeff Bezos',
  },
  {
    text: 'If you double the number of experiments you do per year, you’re going to double your inventiveness.',
    author: 'Jeff Bezos',
  },
  {
    text: 'I think frugality drives innovation, just like other constraints do.',
    author: 'Jeff Bezos',
  },

  // ── The system, not the hero — team size, scheduling reality ─────────────
  {
    text: 'Adding manpower to a late software project makes it later.',
    author: 'Fred Brooks, The Mythical Man-Month',
  },
  {
    text: 'Nine women cannot make a baby in one month.',
    author: 'Fred Brooks, The Mythical Man-Month',
  },
  {
    text: 'Conceptual integrity is the most important consideration in system design.',
    author: 'Fred Brooks, The Mythical Man-Month',
  },

  // ── Bottlenecks and brutal facts over wishful thinking ───────────────────
  {
    text: 'An hour lost at a bottleneck is an hour out of the entire system. An hour saved at a non-bottleneck is worthless.',
    author: 'Eliyahu Goldratt, The Goal',
  },
  {
    text: 'The strength of the chain is determined by the weakest link.',
    author: 'Eliyahu Goldratt, The Goal',
  },
  {
    text: 'Productivity is the act of bringing a company closer to its goal.',
    author: 'Eliyahu Goldratt, The Goal',
  },
  { text: 'Good is the enemy of great.', author: 'Jim Collins, Good to Great' },
  {
    text: 'You absolutely cannot make a series of good decisions without first confronting the brutal facts.',
    author: 'Jim Collins, Good to Great',
  },

  // ── Built to last — there are no shortcuts ────────────────────────────────
  { text: 'Success is never final.', author: 'Jim Collins, Built to Last' },
  {
    text: 'It is better to understand who you are than where you are going — for where you are going will almost certainly change.',
    author: 'Jim Collins, Built to Last',
  },

  // ── Cut the unessential — value is defined by the customer ───────────────
  {
    text: 'The critical starting point for lean thinking is value.',
    author: 'Womack & Jones, Lean Thinking',
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
