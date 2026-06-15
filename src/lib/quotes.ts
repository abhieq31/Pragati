/**
 * Login-screen wisdom — Naval Ravikant and the bookshelf he points to.
 * Lines drawn from *The Almanack of Naval Ravikant* (Eric Jorgenson's
 * compilation of Naval's writing, tweets, and podcasts) plus the authors he
 * most recommends — Charlie Munger, Marcus Aurelius, Seneca, Bruce Lee,
 * Nassim Taleb, Richard Feynman, James Clear, David Deutsch, and more —
 * chosen to resonate with what Pragati is for: building leverage through code
 * and systems, applying specific knowledge, judging what to do next, and
 * letting small daily work compound into delivery.
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
  {
    text: 'Apply specific knowledge, with leverage, and eventually you will get what you deserve.',
    author: 'The Almanack of Naval Ravikant',
  },
  { text: 'Productize yourself.', author: 'The Almanack of Naval Ravikant' },
  {
    text: 'You will get rich by giving society what it wants but does not yet know how to get — at scale.',
    author: 'The Almanack of Naval Ravikant',
  },
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
    text: 'Building specific knowledge will feel like play to you but will look like work to others.',
    author: 'The Almanack of Naval Ravikant',
  },
  { text: 'Sales skills are a form of specific knowledge.', author: 'The Almanack of Naval Ravikant' },
  {
    text: 'Become the best in the world at what you do. Keep redefining what you do until this is true.',
    author: 'The Almanack of Naval Ravikant',
  },
  { text: 'Clear thinking requires courage.', author: 'The Almanack of Naval Ravikant' },
  // ── Decisions & momentum ─────────────────────────────────────────────────
  { text: 'If you can’t decide, the answer is no.', author: 'The Almanack of Naval Ravikant' },
  { text: 'Impatience with actions, patience with results.', author: 'The Almanack of Naval Ravikant' },
  { text: 'Set and enforce an aspiration rate for yourself.', author: 'The Almanack of Naval Ravikant' },
  { text: 'Inspiration is perishable — act on it immediately.', author: 'The Almanack of Naval Ravikant' },
  {
    text: 'Embrace accountability, and take business risks under your own name. Society will reward you with responsibility, equity, and leverage.',
    author: 'The Almanack of Naval Ravikant',
  },
  {
    text: 'Arm yourself with specific knowledge, accountability, and leverage.',
    author: 'The Almanack of Naval Ravikant',
  },
  // ── Long-term games, long-term people ────────────────────────────────────
  { text: 'Play long-term games with long-term people.', author: 'The Almanack of Naval Ravikant' },
  {
    text: 'If you can’t see yourself working with someone for life, don’t work with them for a day.',
    author: 'The Almanack of Naval Ravikant',
  },
  {
    text: 'Choose business partners with high intelligence, energy, and, above all, integrity.',
    author: 'The Almanack of Naval Ravikant',
  },
  {
    text: 'Don’t partner with cynics and pessimists. Their beliefs are self-fulfilling.',
    author: 'The Almanack of Naval Ravikant',
  },
  { text: 'Escape competition through authenticity.', author: 'The Almanack of Naval Ravikant' },
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
  {
    text: 'Work as hard as you can — even though who you work with and what you work on matter more than how hard you work.',
    author: 'The Almanack of Naval Ravikant',
  },
  // ── Always learning ──────────────────────────────────────────────────────
  {
    text: 'Learn to sell, learn to build. If you can do both, you will be unstoppable.',
    author: 'The Almanack of Naval Ravikant',
  },
  {
    text: 'Reading is faster than listening. Doing is faster than watching.',
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

  // ═══ From the shelf Naval points to — the books he recommends ═════════════
  // Same display rule: the source is never shown, only the line. The `author`
  // key records the true book/voice for honest curation.

  // ── Compounding & patience (Charlie Munger · Poor Charlie’s Almanack) ─────
  {
    text: 'The first rule of compounding: never interrupt it unnecessarily.',
    author: 'Charlie Munger, Poor Charlie’s Almanack',
  },
  {
    text: 'Spend each day trying to be a little wiser than you were when you woke up.',
    author: 'Charlie Munger, Poor Charlie’s Almanack',
  },
  { text: 'Take a simple idea and take it seriously.', author: 'Charlie Munger, Poor Charlie’s Almanack' },
  {
    text: 'The big money is not in the buying and selling, but in the waiting.',
    author: 'Charlie Munger, Poor Charlie’s Almanack',
  },
  // ── Systems & habits (James Clear · Atomic Habits) ───────────────────────
  {
    text: 'You do not rise to the level of your goals. You fall to the level of your systems.',
    author: 'James Clear, Atomic Habits',
  },
  {
    text: 'Habits are the compound interest of self-improvement.',
    author: 'James Clear, Atomic Habits',
  },
  {
    text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    author: 'Will Durant, The Story of Philosophy',
  },
  // ── Obstacle as path, mind over events (Marcus Aurelius · Meditations) ────
  {
    text: 'The impediment to action advances action. What stands in the way becomes the way.',
    author: 'Marcus Aurelius, Meditations',
  },
  {
    text: 'You have power over your mind — not outside events. Realize this, and you will find strength.',
    author: 'Marcus Aurelius, Meditations',
  },
  {
    text: 'Waste no more time arguing about what a good man should be. Be one.',
    author: 'Marcus Aurelius, Meditations',
  },
  { text: 'Confine yourself to the present.', author: 'Marcus Aurelius, Meditations' },
  // ── Don’t waste the time you have (Seneca · Letters from a Stoic) ─────────
  {
    text: 'It is not that we have a short time to live, but that we waste much of it.',
    author: 'Seneca, On the Shortness of Life',
  },
  { text: 'While we are postponing, life speeds by.', author: 'Seneca, Letters from a Stoic' },
  // ── Mastery by subtraction (Bruce Lee · Striking Thoughts) ───────────────
  {
    text: 'I fear not the man who has practiced 10,000 kicks once, but the man who has practiced one kick 10,000 times.',
    author: 'Bruce Lee, Striking Thoughts',
  },
  {
    text: 'It’s not the daily increase but daily decrease. Hack away at the unessential.',
    author: 'Bruce Lee, Striking Thoughts',
  },
  {
    text: 'Absorb what is useful, discard what is useless, and add what is specifically your own.',
    author: 'Bruce Lee, Striking Thoughts',
  },
  // ── First principles & honest thinking (Feynman · Deutsch · Kahneman) ─────
  {
    text: 'The first principle is that you must not fool yourself — and you are the easiest person to fool.',
    author: 'Richard Feynman',
  },
  {
    text: 'Problems are inevitable. Problems are soluble.',
    author: 'David Deutsch, The Beginning of Infinity',
  },
  {
    text: 'Nothing in life is as important as you think it is, while you are thinking about it.',
    author: 'Daniel Kahneman, Thinking, Fast and Slow',
  },
  // ── Skin in the game, against renting your time (Nassim Taleb) ────────────
  {
    text: 'The three most harmful addictions are heroin, carbohydrates, and a monthly salary.',
    author: 'Nassim Taleb, The Bed of Procrustes',
  },
  {
    text: 'An idea starts to be interesting when you get scared of taking it to its logical conclusion.',
    author: 'Nassim Taleb, The Bed of Procrustes',
  },
  {
    text: 'When we are no longer able to change a situation, we are challenged to change ourselves.',
    author: 'Viktor Frankl, Man’s Search for Meaning',
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
