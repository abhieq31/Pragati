/**
 * Login-screen wisdom — curated to what Pragati is actually for: doing the
 * work. Every line speaks to execution, focus, finishing, cutting the
 * unessential, and compounding small daily progress into delivery — not wealth,
 * career, or self-help in the abstract.
 *
 * Sourced from Naval Ravikant and the bookshelf he points to — Charlie Munger,
 * Marcus Aurelius, Seneca, Bruce Lee, James Clear, Richard Feynman, David
 * Deutsch, Daniel Kahneman, Will Durant, Viktor Frankl — but only the lines
 * that map to getting work shipped.
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
  // ── Do the work — action beats talk ──────────────────────────────────────
  { text: 'Inspiration is perishable — act on it immediately.', author: 'The Almanack of Naval Ravikant' },
  { text: 'Impatience with actions, patience with results.', author: 'The Almanack of Naval Ravikant' },
  {
    text: 'Reading is faster than listening. Doing is faster than watching.',
    author: 'The Almanack of Naval Ravikant',
  },
  {
    text: 'Knowing is not enough; we must apply. Willing is not enough; we must do.',
    author: 'Bruce Lee, Striking Thoughts',
  },
  {
    text: 'If you spend too much time thinking about a thing, you’ll never get it done.',
    author: 'Bruce Lee, Striking Thoughts',
  },
  {
    text: 'The impediment to action advances action. What stands in the way becomes the way.',
    author: 'Marcus Aurelius, Meditations',
  },
  {
    text: 'Waste no more time arguing about what a good man should be. Be one.',
    author: 'Marcus Aurelius, Meditations',
  },
  {
    text: 'Get active in your own rescue — and do it while you can.',
    author: 'Marcus Aurelius, Meditations',
  },

  // ── Focus — the one thing in front of you ────────────────────────────────
  { text: 'If you can’t decide, the answer is no.', author: 'The Almanack of Naval Ravikant' },
  {
    text: 'A busy calendar and a busy mind will destroy your ability to do great things.',
    author: 'The Almanack of Naval Ravikant',
  },
  {
    text: 'Who you work with and what you work on matter more than how hard you work.',
    author: 'The Almanack of Naval Ravikant',
  },
  {
    text: 'Concentrate every minute on doing what’s in front of you, with precise and genuine seriousness.',
    author: 'Marcus Aurelius, Meditations',
  },
  { text: 'Confine yourself to the present.', author: 'Marcus Aurelius, Meditations' },
  { text: 'Take a simple idea and take it seriously.', author: 'Charlie Munger, Poor Charlie’s Almanack' },
  {
    text: 'Nothing in life is as important as you think it is, while you are thinking about it.',
    author: 'Daniel Kahneman, Thinking, Fast and Slow',
  },
  {
    text: 'If a man knows not to which port he sails, no wind is favorable.',
    author: 'Seneca, Letters from a Stoic',
  },

  // ── Simplify — cut the unessential ───────────────────────────────────────
  {
    text: 'It’s not the daily increase but daily decrease. Hack away at the unessential.',
    author: 'Bruce Lee, Striking Thoughts',
  },
  {
    text: 'Absorb what is useful, discard what is useless, and add what is specifically your own.',
    author: 'Bruce Lee, Striking Thoughts',
  },

  // ── Compound — small reps, every day ─────────────────────────────────────
  {
    text: 'The first rule of compounding: never interrupt it unnecessarily.',
    author: 'Charlie Munger, Poor Charlie’s Almanack',
  },
  {
    text: 'Spend each day trying to be a little wiser than you were when you woke up.',
    author: 'Charlie Munger, Poor Charlie’s Almanack',
  },
  {
    text: 'It is remarkable how much long-term advantage you get by being consistently not stupid, instead of trying to be very intelligent.',
    author: 'Charlie Munger, Poor Charlie’s Almanack',
  },
  { text: 'Habits are the compound interest of self-improvement.', author: 'James Clear, Atomic Habits' },
  {
    text: 'Success is the product of daily habits — not once-in-a-lifetime transformations.',
    author: 'James Clear, Atomic Habits',
  },
  {
    text: 'You do not rise to the level of your goals. You fall to the level of your systems.',
    author: 'James Clear, Atomic Habits',
  },
  {
    text: 'Goals are good for setting a direction, but systems are best for making progress.',
    author: 'James Clear, Atomic Habits',
  },
  {
    text: 'You should be far more concerned with your current trajectory than your current results.',
    author: 'James Clear, Atomic Habits',
  },
  {
    text: 'Every action you take is a vote for the type of person you wish to become.',
    author: 'James Clear, Atomic Habits',
  },
  {
    text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    author: 'Will Durant, The Story of Philosophy',
  },

  // ── Time — don’t postpone ────────────────────────────────────────────────
  {
    text: 'It is not that we have a short time to live, but that we waste much of it.',
    author: 'Seneca, On the Shortness of Life',
  },
  { text: 'While we are postponing, life speeds by.', author: 'Seneca, Letters from a Stoic' },
  {
    text: 'Begin at once to live, and count each separate day as a separate life.',
    author: 'Seneca, Letters from a Stoic',
  },

  // ── Mastery — earned by repetition ───────────────────────────────────────
  {
    text: 'I fear not the man who has practiced 10,000 kicks once, but the man who has practiced one kick 10,000 times.',
    author: 'Bruce Lee, Striking Thoughts',
  },
  {
    text: 'Become the best in the world at what you do. Keep redefining what you do until this is true.',
    author: 'The Almanack of Naval Ravikant',
  },
  {
    text: 'Building specific knowledge will feel like play to you but will look like work to others.',
    author: 'The Almanack of Naval Ravikant',
  },

  // ── See it straight — honest judgment & problems ─────────────────────────
  {
    text: 'The first principle is that you must not fool yourself — and you are the easiest person to fool.',
    author: 'Richard Feynman',
  },
  {
    text: 'Problems are inevitable. Problems are soluble.',
    author: 'David Deutsch, The Beginning of Infinity',
  },
  { text: 'Clear thinking requires courage.', author: 'The Almanack of Naval Ravikant' },
  {
    text: 'When we are no longer able to change a situation, we are challenged to change ourselves.',
    author: 'Viktor Frankl, Man’s Search for Meaning',
  },

  // ── Build with people — teams that deliver ───────────────────────────────
  { text: 'Play long-term games with long-term people.', author: 'The Almanack of Naval Ravikant' },
  { text: 'Praise specifically, criticize generally.', author: 'The Almanack of Naval Ravikant' },
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
