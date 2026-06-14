/**
 * Login-screen wisdom — a single voice: the builder's playbook of first
 * principles, ruthless simplification, and execution under pressure. Chosen to
 * resonate with what Pragati is for — shipping real work, deleting needless
 * process, and reading delivery honestly.
 *
 * Display rule: NO attribution is ever rendered. The words stand alone — the
 * login page shows the line, never the name. (`author` is kept on the type for
 * internal curation only and is never surfaced in the UI.)
 *
 * No-repeat rule: the login page rotates through a per-device shuffled queue
 * and never repeats a quote until the whole library is exhausted.
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
  // ── First principles ────────────────────────────────────────────────────
  { text: 'Boil things down to their fundamental truths, then reason up from there.', author: 'Elon Musk' },
  {
    text: 'It is important to reason from first principles rather than by analogy.',
    author: 'Elon Musk',
  },
  {
    text: 'The only rules are the ones dictated by the laws of physics. Everything else is a recommendation.',
    author: 'Elon Musk',
  },
  // ── Question the requirements ────────────────────────────────────────────
  {
    text: 'Make the requirements less dumb. Your requirements are definitely dumb — it is just a question of how dumb.',
    author: 'Elon Musk',
  },
  {
    text: 'Every requirement should carry a name, not a department. A requirement no one will own is a requirement no one should follow.',
    author: 'Elon Musk',
  },
  // ── Delete, then simplify ────────────────────────────────────────────────
  {
    text: 'Delete any part or process you can. If you are not adding back at least a tenth of what you remove, you are not deleting enough.',
    author: 'Elon Musk',
  },
  { text: 'The best part is no part. The best process is no process.', author: 'Elon Musk' },
  {
    text: 'The most common error of a smart engineer is to optimize something that should not exist.',
    author: 'Elon Musk',
  },
  {
    text: 'Simplify first, then accelerate. Never speed up a step that should have been deleted.',
    author: 'Elon Musk',
  },
  { text: 'Any product that needs a manual to work is broken.', author: 'Elon Musk' },
  // ── Schedules, urgency, cost of delay ────────────────────────────────────
  { text: 'If a schedule is long, it is wrong. If it is tight, it is right.', author: 'Elon Musk' },
  { text: 'The longer a problem waits, the more it costs to fix.', author: 'Elon Musk' },
  {
    text: 'Move fast — but know exactly what you are building, and why.',
    author: 'Elon Musk',
  },
  // ── Persistence & resolve ────────────────────────────────────────────────
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
  { text: 'If things are not failing, you are not innovating enough.', author: 'Elon Musk' },
  {
    text: 'If you get up in the morning and think the future is going to be better, it is a bright day.',
    author: 'Elon Musk',
  },
  // ── Focus & feedback ─────────────────────────────────────────────────────
  {
    text: 'Focus on signal over noise. Do not waste time on anything that does not make the work better.',
    author: 'Elon Musk',
  },
  {
    text: 'A goal everyone understands — and understands the reason for — gets done faster.',
    author: 'Elon Musk',
  },
  {
    text: 'Constantly seek criticism. A well-reasoned critique of your work is worth its weight in gold.',
    author: 'Elon Musk',
  },
  {
    text: 'Pay attention to negative feedback, and actively solicit it — especially from people who will tell you the truth.',
    author: 'Elon Musk',
  },
  // ── Teams & ownership ────────────────────────────────────────────────────
  {
    text: 'Great things are never built by one person. They are built by a team that trusts one another.',
    author: 'Elon Musk',
  },
  {
    text: 'Talent wins the game, but the real multiplier is how well the team works together.',
    author: 'Elon Musk',
  },
  {
    text: 'Take ownership of the outcome, not just your part of it.',
    author: 'Elon Musk',
  },
  {
    text: 'It is OK to have your eggs in one basket — as long as you control what happens to that basket.',
    author: 'Elon Musk',
  },
  // ── Progress ─────────────────────────────────────────────────────────────
  {
    text: 'Make progress, fail, learn, make more progress. That is the only way forward.',
    author: 'Elon Musk',
  },
  {
    text: 'Brand is just a perception, and perception will match reality over time.',
    author: 'Elon Musk',
  },
];

/** Deterministic daily starting point so everyone who opens the login page on
 *  the same day begins on the same quote (then rotation takes over). */
export function dailyQuoteOffset(count: number, now: Date = new Date()): number {
  if (count <= 0) return 0;
  const day = Math.floor(now.getTime() / 86_400_000);
  return day % count;
}
