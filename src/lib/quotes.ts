/**
 * Login-screen wisdom — curated to what Pragati is actually for: doing the
 * work. Every line speaks to building, shipping, focus, finishing, cutting the
 * unessential, persisting against the odds, and reasoning from first
 * principles — not wealth, career, or self-help in the abstract.
 *
 * Source: Elon Musk — his own documented words (the five-step engineering
 * "algorithm" recorded in Walter Isaacson's biography chief among them) —
 * together with the books, authors, and leaders he has publicly admired or
 * recommended: the science fiction that shaped him (Isaac Asimov's
 * "Foundation", Douglas Adams' "The Hitchhiker's Guide to the Galaxy", Robert
 * Heinlein, J.R.R. Tolkien), the builders' canon (Peter Thiel's "Zero to
 * One"), and the inventors and leaders he names as heroes (Nikola Tesla,
 * Benjamin Franklin, Isaac Newton, Henry Ford, Richard Feynman, Albert
 * Einstein, Steve Jobs, Winston Churchill).
 *
 * Honesty about sourcing: this is a BROAD curation of well-known, widely-
 * circulated lines, chosen for how cleanly they map to the work — not a set
 * where each line has been certified to a primary source. Some are paraphrases
 * or are popularly (sometimes loosely) attributed. That is acceptable here for
 * one specific reason, and only this reason:
 *
 *   Display rule: NO attribution is EVER rendered. The login page shows the
 *   line, never the name or the source. `author` is kept on the type purely as
 *   an internal curation/grouping key and is never surfaced in the UI. So the
 *   words stand alone as anonymous wisdom; the screen never claims "X said this."
 *
 * No-repeat rule: the login page rotates through a per-device shuffled queue
 * and never repeats a quote until the whole library is exhausted. Each quote
 * also stays on screen for a length of time proportional to how long it takes
 * to read (see `readingMs` on the login page), so longer lines aren't cut off.
 */

export interface Quote {
  text: string;
  author: string; // internal curation key only — never rendered
}

export const BUILTIN_QUOTES: Quote[] = [
  // ── Build and ship — make things, the product above all ──────────────────
  {
    text: 'When something is important enough, you do it even if the odds are not in your favor.',
    author: 'Elon Musk',
  },
  {
    text: 'The first step is to establish that something is possible; then probability will occur.',
    author: 'Elon Musk',
  },
  { text: 'Great companies are built on great products.', author: 'Elon Musk' },
  {
    text: 'A company is just a group of people organized to make a product. Make the product great.',
    author: 'Elon Musk',
  },
  {
    text: 'Building the machine that builds the machine is harder than the machine itself.',
    author: 'Elon Musk',
  },
  {
    text: 'Brand is just a perception, and perception will match reality over time.',
    author: 'Elon Musk',
  },
  {
    text: 'Any product that needs a manual to work is broken.',
    author: 'Elon Musk',
  },
  {
    text: 'Engineering is the closest thing to magic that exists in the world.',
    author: 'Elon Musk',
  },

  // ── The algorithm — question the spec, delete before you optimize ─────────
  {
    text: 'Make your requirements less dumb. Your requirements are definitely dumb.',
    author: 'Elon Musk',
  },
  {
    text: 'Question every requirement. Each should come with the name of a person, not a department.',
    author: 'Elon Musk',
  },
  {
    text: 'Delete any part or process you can. If you’re not adding at least 10% back later, you didn’t delete enough.',
    author: 'Elon Musk',
  },
  { text: 'The best part is no part. The best process is no process.', author: 'Elon Musk' },
  {
    text: 'The most common error is to optimize a thing that should not exist.',
    author: 'Elon Musk',
  },
  {
    text: 'Simplify and optimize — but only after you’ve deleted. Never polish what should be gone.',
    author: 'Elon Musk',
  },
  {
    text: 'Speed up the cycle — but don’t accelerate until you’ve deleted and simplified.',
    author: 'Elon Musk',
  },
  {
    text: 'Automate last. Remove the dumb parts before you automate them.',
    author: 'Elon Musk',
  },

  // ── First principles — reason up from the fundamentals ────────────────────
  {
    text: 'Reason from first principles, not by analogy. Boil things down to the fundamental truths and reason up from there.',
    author: 'Elon Musk',
  },
  {
    text: 'You should take the approach that you’re wrong. Your goal is to be less wrong.',
    author: 'Elon Musk',
  },
  {
    text: 'Constantly think about how you could be doing things better, and keep questioning yourself.',
    author: 'Elon Musk',
  },
  {
    text: 'Pay close attention to negative feedback, and actively solicit it — especially from friends.',
    author: 'Elon Musk',
  },
  {
    text: 'It’s a mistake to throw people at a problem. Numbers will never compensate for talent.',
    author: 'Elon Musk',
  },
  {
    text: 'The path to leadership runs through engineering and design — not through finance or marketing.',
    author: 'Elon Musk',
  },

  // ── Persistence and finishing — against the odds ──────────────────────────
  {
    text: 'Persistence is very important. You should not give up unless you are forced to give up.',
    author: 'Elon Musk',
  },
  {
    text: 'Failure is an option here. If things are not failing, you are not innovating enough.',
    author: 'Elon Musk',
  },
  {
    text: 'I could either watch it happen, or be a part of it.',
    author: 'Elon Musk',
  },
  {
    text: 'Some people don’t like change, but you need to embrace it if the alternative is disaster.',
    author: 'Elon Musk',
  },
  {
    text: 'If you need inspiring words to do it, don’t do it.',
    author: 'Elon Musk',
  },

  // ── Focus, optimism, and the long bet — build the future ──────────────────
  {
    text: 'If you get up in the morning and think the future is going to be better, it is a bright day.',
    author: 'Elon Musk',
  },
  {
    text: 'I would rather be optimistic and wrong than pessimistic and right.',
    author: 'Elon Musk',
  },
  {
    text: 'It’s OK to have your eggs in one basket as long as you control what happens to that basket.',
    author: 'Elon Musk',
  },
  {
    text: 'People work better when they know what the goal is and why.',
    author: 'Elon Musk',
  },
  {
    text: 'Work hard every waking hour — that’s the part most people miss.',
    author: 'Elon Musk',
  },

  // ── Foundation & the sci-fi that shaped him — Asimov, Adams, Heinlein ─────
  {
    text: 'Violence is the last refuge of the incompetent.',
    author: 'Isaac Asimov, Foundation',
  },
  {
    text: 'It pays to be obvious, especially if you have a reputation for subtlety.',
    author: 'Isaac Asimov, Foundation',
  },
  {
    text: 'Never let your sense of morals prevent you from doing what is right.',
    author: 'Isaac Asimov, Foundation',
  },
  {
    text: 'The saddest aspect of life is that science gathers knowledge faster than society gathers wisdom.',
    author: 'Isaac Asimov',
  },
  {
    text: 'Often the question is harder than the answer. Once you can ask the right question, the rest is the easy part.',
    author: 'In the spirit of Douglas Adams (Musk’s formative book)',
  },
  {
    text: 'I may not have gone where I intended to go, but I think I have ended up where I needed to be.',
    author: 'Douglas Adams, The Hitchhiker’s Guide to the Galaxy',
  },
  {
    text: 'A common mistake people make when designing something foolproof is to underestimate the ingenuity of complete fools.',
    author: 'Douglas Adams',
  },
  {
    text: 'There ain’t no such thing as a free lunch.',
    author: 'Robert A. Heinlein, The Moon Is a Harsh Mistress',
  },
  {
    text: 'When one teaches, two learn.',
    author: 'Robert A. Heinlein',
  },

  // ── Heroes of the road and the workshop — Tolkien, Thiel ──────────────────
  {
    text: 'Little by little, one travels far.',
    author: 'J.R.R. Tolkien',
  },
  {
    text: 'All we have to decide is what to do with the time that is given us.',
    author: 'J.R.R. Tolkien, The Lord of the Rings',
  },
  {
    text: 'Even the smallest person can change the course of the future.',
    author: 'J.R.R. Tolkien, The Lord of the Rings',
  },
  {
    text: 'Every moment in business happens only once. The next great company will not copy the last one.',
    author: 'Peter Thiel, Zero to One',
  },
  {
    text: 'A startup is the largest group of people you can convince of a plan to build a different future.',
    author: 'Peter Thiel, Zero to One',
  },
  {
    text: 'Brilliant thinking is rare, but courage is in even shorter supply than genius.',
    author: 'Peter Thiel, Zero to One',
  },

  // ── Inventors and leaders he names as heroes ─────────────────────────────
  {
    text: 'The present is theirs; the future, for which I really worked, is mine.',
    author: 'Nikola Tesla',
  },
  {
    text: 'There is no thrill like that felt by the inventor as he sees a creation of the mind unfolding to success.',
    author: 'Nikola Tesla',
  },
  {
    text: 'Energy and persistence conquer all things.',
    author: 'Benjamin Franklin',
  },
  {
    text: 'Well done is better than well said.',
    author: 'Benjamin Franklin',
  },
  {
    text: 'By failing to prepare, you are preparing to fail.',
    author: 'Benjamin Franklin',
  },
  {
    text: 'An investment in knowledge pays the best interest.',
    author: 'Benjamin Franklin',
  },
  {
    text: 'If I have seen further, it is by standing on the shoulders of giants.',
    author: 'Isaac Newton',
  },
  {
    text: 'Whether you think you can, or you think you can’t — you’re right.',
    author: 'Henry Ford',
  },
  {
    text: 'If I had asked people what they wanted, they would have said faster horses.',
    author: 'Henry Ford',
  },
  {
    text: 'Coming together is a beginning, keeping together is progress, working together is success.',
    author: 'Henry Ford',
  },
  {
    text: 'The first principle is that you must not fool yourself — and you are the easiest person to fool.',
    author: 'Richard Feynman',
  },
  {
    text: 'What I cannot create, I do not understand.',
    author: 'Richard Feynman',
  },
  {
    text: 'It’s not that I’m so smart, it’s just that I stay with problems longer.',
    author: 'Albert Einstein',
  },
  {
    text: 'Make things as simple as possible, but not simpler.',
    author: 'Albert Einstein',
  },
  {
    text: 'Real artists ship.',
    author: 'Steve Jobs',
  },
  {
    text: 'Innovation distinguishes between a leader and a follower.',
    author: 'Steve Jobs',
  },
  {
    text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    author: 'Winston Churchill',
  },
  {
    text: 'If you’re going through hell, keep going.',
    author: 'Winston Churchill',
  },
  {
    text: 'Never give in. Never, never, never.',
    author: 'Winston Churchill',
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
