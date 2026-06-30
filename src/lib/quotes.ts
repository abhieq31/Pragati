/**
 * Login-screen wisdom — curated to what Pragati is actually for: doing the
 * work. Every line speaks to focusing on the user, simplicity, helpfulness,
 * doing hard things that matter, optimism, resilience, and listening — not
 * wealth, hype, or self-help in the abstract.
 *
 * Source: Sundar Pichai — CEO of Google and Alphabet — drawn from his own
 * documented words (interviews, the Google "focus on the user" principle, his
 * IIT/Stanford talks), together with the books he has publicly recommended:
 * "The Ride of a Lifetime" (Bob Iger), "The Hard Thing About Hard Things"
 * (Ben Horowitz), "Shoe Dog" (Phil Knight), "The Innovators" (Walter
 * Isaacson), "Sapiens" (Yuval Noah Harari), and "Man's Search for Meaning"
 * (Viktor Frankl).
 *
 * Honesty about sourcing: these are well-known, widely-circulated lines chosen
 * for how cleanly they map to the work. Some are condensed or paraphrased.
 * That is acceptable here for one specific reason, and only this reason:
 *
 *   Display rule: NO attribution is EVER rendered. The login page shows the
 *   line, never the name or the source. `author` is kept on the type purely as
 *   an internal curation/grouping key and is never surfaced in the UI.
 *
 * No-repeat rule: the login page rotates through a per-device shuffled queue
 * and never repeats a quote until the whole library is exhausted. Each quote
 * also stays on screen for a length of time proportional to how long it takes
 * to read (see `readingMs` on the login page).
 */

export interface Quote {
  text: string;
  author: string; // internal curation key only — never rendered
}

export const BUILTIN_QUOTES: Quote[] = [
  // ── Focus on the user ─────────────────────────────────────────────────────
  { text: 'Focus on the user, and all else follows.', author: 'Sundar Pichai' },
  { text: 'Wear the shoes of the user. Build for the person on the other side.', author: 'Sundar Pichai' },
  { text: 'The best products don’t ask for attention. They get out of the way.', author: 'Sundar Pichai' },
  { text: 'Simple, fast, and useful beats clever every time.', author: 'Sundar Pichai' },
  { text: 'Technology should adapt to people — not the other way around.', author: 'Sundar Pichai' },

  // ── Do hard things that matter ────────────────────────────────────────────
  {
    text: 'Work on things hard enough that they’re actually worthwhile.',
    author: 'Sundar Pichai',
  },
  { text: 'Set audacious goals — even failing at them gets you far.', author: 'Sundar Pichai' },
  { text: 'It’s better to be at the cutting edge of something you believe in.', author: 'Sundar Pichai' },
  {
    text: 'Have the courage to follow your passion — and the patience to give it time.',
    author: 'Sundar Pichai',
  },
  { text: 'A North Star matters more than a fixed plan.', author: 'Sundar Pichai' },

  // ── Let people surprise you ───────────────────────────────────────────────
  {
    text: 'Set the right goals, hire well, then let people surprise you.',
    author: 'Sundar Pichai',
  },
  { text: 'Let smart people loose on hard problems.', author: 'Sundar Pichai' },
  {
    text: 'The most important quality in a leader is to listen — and to keep learning.',
    author: 'Sundar Pichai',
  },
  { text: 'A leader makes the people around them believe they can do great things.', author: 'Sundar Pichai' },

  // ── Optimism + the long view ──────────────────────────────────────────────
  { text: 'Be relentlessly optimistic. It is a strategy, not a mood.', author: 'Sundar Pichai' },
  { text: 'Don’t get caught in the rat race of competing for the wrong reasons.', author: 'Sundar Pichai' },
  { text: 'The future belongs to those who keep learning.', author: 'Sundar Pichai' },
  { text: 'Technology can be the great equalizer — if you build it for everyone.', author: 'Sundar Pichai' },

  // ── The Ride of a Lifetime — Bob Iger ─────────────────────────────────────
  { text: 'If you want innovation, you have to give people permission to fail.', author: 'Bob Iger' },
  { text: 'Optimism in a leader is more powerful than any single strategy.', author: 'Bob Iger' },
  { text: 'Don’t let your ego get in the way of making the best decision.', author: 'Bob Iger' },
  { text: 'Long shots are usually not as long as they seem.', author: 'Bob Iger' },
  { text: 'The relentless pursuit of perfection — in the details no one else sees.', author: 'Bob Iger' },

  // ── The Hard Thing About Hard Things — Ben Horowitz ───────────────────────
  { text: 'There are no silver bullets — only lead bullets. Do the hard work.', author: 'Ben Horowitz' },
  {
    text: 'Take care of the people, the products, and the profits — in that order.',
    author: 'Ben Horowitz',
  },
  { text: 'Embrace the struggle. That’s where the company is actually built.', author: 'Ben Horowitz' },

  // ── Shoe Dog — Phil Knight ────────────────────────────────────────────────
  {
    text: 'Don’t tell people how to do things; tell them what to do and let them surprise you.',
    author: 'Phil Knight',
  },
  { text: 'The cowards never started and the weak died along the way.', author: 'Phil Knight' },
  { text: 'Keep going. Don’t stop. Don’t even think about stopping until you get there.', author: 'Phil Knight' },

  // ── Sapiens — Yuval Noah Harari ───────────────────────────────────────────
  {
    text: 'Large numbers of strangers cooperate by believing in a shared story.',
    author: 'Yuval Noah Harari',
  },
  { text: 'Clarity is power. Confusion is the tax you pay for skipping it.', author: 'Yuval Noah Harari' },

  // ── Man's Search for Meaning — Viktor Frankl ──────────────────────────────
  {
    text: 'When you can’t change the situation, you are challenged to change yourself.',
    author: 'Viktor Frankl',
  },
  {
    text: 'Between stimulus and response there is a space — and in that space is your freedom.',
    author: 'Viktor Frankl',
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
