/**
 * Quick-add parser — turns one line of free text into a task draft.
 *
 * Same philosophy as the rest of lib/ai: a small, deterministic, traceable
 * rule set, never an LLM. Every extraction is a plain regex with a documented
 * rule, so a result is always explainable ("matched 'tomorrow' → 2026-06-22"),
 * not a guess. Pure function — no I/O, no Date.now() unless the caller omits
 * `now`, which only matters for tests.
 */

export type Priority = 'low' | 'medium' | 'high' | 'critical';

export interface ParsedQuickAdd {
  /** Cleaned title with any matched date/priority phrase removed. */
  title: string;
  priority?: Priority;
  /** ISO yyyy-mm-dd, suitable for the dueDate field on POST /api/tasks. */
  dueDate?: string;
  /** Short human label for the live preview, e.g. "Fri, Jun 26". */
  dueLabel?: string;
}

const DAY = 86_400_000;

const WEEKDAY_ALIASES: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  weds: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};
const WEEKDAY_PATTERN =
  '(?:sun|sunday|mon|monday|tue|tues|tuesday|wed|weds|wednesday|thu|thur|thurs|thursday|fri|friday|sat|saturday)';

function dateOnly(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function addDays(d: Date, n: number): Date {
  return new Date(+dateOnly(d) + n * DAY);
}
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function dueLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

/** Nearest occurrence of `target` weekday (0=Sun) on/after today. With
 *  `skipToday`, today itself never counts — used for the "next <weekday>"
 *  form, so "next friday" said on a Friday means a week out, not today. */
function nextWeekday(now: Date, target: number, skipToday: boolean): Date {
  const today = dateOnly(now);
  let delta = (target - today.getDay() + 7) % 7;
  if (delta === 0 && skipToday) delta = 7;
  return addDays(today, delta);
}

interface StripResult {
  text: string;
  dueDate?: string;
  dueLabel?: string;
}

function strip(text: string, m: RegExpMatchArray, d: Date): StripResult {
  const idx = m.index ?? 0;
  const cleaned = (text.slice(0, idx) + text.slice(idx + m[0].length)).replace(/\s+/g, ' ').trim();
  return { text: cleaned, dueDate: isoDate(d), dueLabel: dueLabel(d) };
}

const PRIORITY_WORDS: { re: RegExp; priority: Priority }[] = [
  { re: /\b(asap|urgent|critical)\b/i, priority: 'critical' },
  { re: /\b(high\s*priority|important)\b/i, priority: 'high' },
  { re: /\b(low\s*priority|whenever|someday)\b/i, priority: 'low' },
];

/** Trailing "!!"/"!!!" shorthand (chat convention) → high/critical. A single
 *  "!" is left alone — too common in ordinary sentences to be a signal. */
function extractPriority(text: string): { text: string; priority?: Priority } {
  const bang = text.match(/\s*(!{2,})\s*$/);
  if (bang) {
    return {
      text: text.slice(0, bang.index).trim(),
      priority: bang[1].length >= 3 ? 'critical' : 'high',
    };
  }
  for (const { re, priority } of PRIORITY_WORDS) {
    if (re.test(text)) {
      return { text: text.replace(re, ' ').replace(/\s+/g, ' ').trim(), priority };
    }
  }
  return { text };
}

/** First matching due-date phrase wins — checked most-specific first so e.g.
 *  "next friday" doesn't fall through to the bare-weekday rule for "friday". */
function extractDue(text: string, now: Date): StripResult {
  let m = text.match(/\bin\s+(\d+)\s*(day|days|week|weeks)\b/i);
  if (m) {
    const n = parseInt(m[1], 10);
    return strip(text, m, addDays(now, /week/i.test(m[2]) ? n * 7 : n));
  }

  m = text.match(new RegExp(`\\bnext\\s+(${WEEKDAY_PATTERN})\\b`, 'i'));
  if (m) {
    return strip(text, m, nextWeekday(now, WEEKDAY_ALIASES[m[1].toLowerCase()], true));
  }

  m = text.match(/\bnext\s+week\b/i);
  if (m) return strip(text, m, addDays(now, 7));

  m = text.match(new RegExp(`\\b(${WEEKDAY_PATTERN})\\b`, 'i'));
  if (m) {
    return strip(text, m, nextWeekday(now, WEEKDAY_ALIASES[m[1].toLowerCase()], false));
  }

  m = text.match(/\b(today|tonight)\b/i);
  if (m) return strip(text, m, dateOnly(now));

  m = text.match(/\b(tomorrow|tmrw)\b/i);
  if (m) return strip(text, m, addDays(now, 1));

  // Explicit M/D or M/D/YYYY.
  m = text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if (m) {
    const month = parseInt(m[1], 10) - 1;
    const day = parseInt(m[2], 10);
    let year = m[3] ? parseInt(m[3], 10) : now.getFullYear();
    if (year < 100) year += 2000;
    const d = new Date(year, month, day);
    if (!isNaN(+d) && month >= 0 && month <= 11) return strip(text, m, d);
  }

  // ISO yyyy-mm-dd.
  m = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (m) {
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    if (!isNaN(+d)) return strip(text, m, d);
  }

  return { text };
}

export function parseQuickAdd(raw: string, now: Date = new Date()): ParsedQuickAdd {
  const original = raw.trim();
  const { text: afterPriority, priority } = extractPriority(original);
  const { text: cleaned, dueDate, dueLabel: label } = extractDue(afterPriority, now);

  return {
    // An empty title after stripping (e.g. the input was just "tomorrow !!!")
    // is useless — fall back to the untouched original rather than save blank.
    title: cleaned || original,
    priority,
    dueDate,
    dueLabel: label,
  };
}
