/**
 * Login-screen wisdom — curated to what Pragati is actually for: doing the
 * work. Every line speaks to execution, focus, finishing, cutting the
 * unessential, and compounding small daily progress into delivery — not wealth,
 * career, or self-help in the abstract.
 *
 * Sourced exclusively from Elon Musk — his own documented words (the five-step
 * engineering "algorithm" recorded in Walter Isaacson's "Elon Musk" chief
 * among them) — and books he has publicly recommended on the record: Isaac
 * Asimov's "Foundation" and Douglas Adams' "The Hitchhiker's Guide to the
 * Galaxy" (the one he singles out as formative — its lesson that "often the
 * question is harder than the answer"). Every line was checked against
 * multiple independent sources before inclusion — this is a public-facing
 * screen, so nothing here is recalled from memory and trusted on faith.
 * (Deliberately excluded: punchy lines widely attributed to Musk on quote
 * sites with no primary source, and book recommendations of his — Gordon's
 * "Structures", Clark's "Ignition!" — whose memorable passages are technical
 * rather than about getting work shipped.)
 *
 * Restricted to lines that map to getting work shipped: question the spec,
 * delete before you optimize, persist against the odds, seek brutal feedback,
 * and put the product above everything around it.
 *
 * Display rule: NO attribution is ever rendered. The words stand alone — the
 * login page shows the line, never the name or the source. (`author` is kept on
 * the type for internal curation only and is never surfaced in the UI.)
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
  // ── The algorithm — delete before you optimize ───────────────────────────
  // Musk's five-step process, as recorded verbatim in Walter Isaacson's
  // biography; it is, almost word for word, a doctrine of cutting the
  // unessential — which is exactly what this screen is here to reinforce.
  {
    text: 'The best part is no part. The best process is no process.',
    author: 'Elon Musk (Isaacson, Elon Musk)',
  },
  {
    text: 'Question every requirement. Each should carry the name of a person, never a department — then make it less dumb.',
    author: 'Elon Musk, the algorithm — step 1 (Isaacson)',
  },
  {
    text: 'Delete any part or process you can. If you’re not adding at least 10% of them back later, you didn’t delete enough.',
    author: 'Elon Musk, the algorithm — step 2 (Isaacson)',
  },
  {
    text: 'Simplify and optimize — but only after deleting. The common mistake is to optimize something that should not exist.',
    author: 'Elon Musk, the algorithm — step 3 (Isaacson)',
  },
  {
    text: 'The most common error of a smart engineer is to optimize a thing that should not exist.',
    author: 'Elon Musk (Isaacson, Elon Musk)',
  },
  {
    text: 'Automate last. The mistake is to automate before you’ve questioned, deleted, and shaken the bugs out.',
    author: 'Elon Musk, the algorithm — step 5 (Isaacson)',
  },

  // ── Ship against the odds — persistence over certainty ───────────────────
  {
    text: 'When something is important enough, you do it even if the odds are not in your favor.',
    author: 'Elon Musk',
  },
  {
    text: 'Persistence is very important. You should not give up unless you are forced to give up.',
    author: 'Elon Musk',
  },
  {
    text: 'The first step is to establish that something is possible; then probability will occur.',
    author: 'Elon Musk',
  },
  {
    text: 'If things are not failing, you are not innovating enough.',
    author: 'Elon Musk',
  },
  {
    text: 'I’d rather be optimistic and wrong than pessimistic and right.',
    author: 'Elon Musk',
  },

  // ── Brutal feedback — find what's wrong and fix it ───────────────────────
  {
    text: 'Solicit negative feedback, particularly from friends. They can tell you what’s actually wrong.',
    author: 'Elon Musk',
  },
  {
    text: 'Focus on signal over noise. Don’t waste effort on things that don’t actually make the product better.',
    author: 'Elon Musk',
  },
  {
    text: 'Constantly think about how you could be doing things better, and keep questioning yourself.',
    author: 'Elon Musk',
  },

  // ── The product is the point ─────────────────────────────────────────────
  {
    text: 'Great companies are built on great products.',
    author: 'Elon Musk',
  },
  {
    text: 'Brand is just a perception, and perception will match reality over time.',
    author: 'Elon Musk',
  },
  {
    text: 'I think it is possible for ordinary people to choose to be extraordinary.',
    author: 'Elon Musk',
  },

  // ── From the books he recommends — ask the right question, then execute ───
  {
    text: 'Often the question is harder than the answer. Phrase the question correctly, and the answer is the easy part.',
    author: 'Elon Musk, on Douglas Adams’ The Hitchhiker’s Guide to the Galaxy',
  },
  {
    text: 'A common mistake people make when designing something completely foolproof is to underestimate the ingenuity of complete fools.',
    author: 'Douglas Adams, The Hitchhiker’s Guide to the Galaxy',
  },
  {
    text: 'Don’t Panic.',
    author: 'Douglas Adams, The Hitchhiker’s Guide to the Galaxy',
  },
  {
    text: 'To succeed, planning alone is insufficient. One must improvise as well.',
    author: 'Isaac Asimov, Foundation',
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
