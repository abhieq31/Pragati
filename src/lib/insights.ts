/**
 * Industry insights — a curated, evergreen, high-signal operating feed.
 *
 * Why curated, not live-scraped: a free-forever product can't lean on a paid
 * news API, and live headlines are noisy, rot fast, and carry legal/attribution
 * risk. What actually moves an organisation forward is durable operating
 * wisdom — the kind a great operator repeats — tuned to the tenant's world.
 * So this ships a hand-picked library keyed by industry, with an optional
 * operator-hosted feed (INSIGHTS_FEED_URL) for those who want a live stream,
 * mirroring the quotes-feed pattern. Pure + dependency-free + unit-testable.
 *
 * Single-tenant deployments set PRAGATI_INDUSTRY. The
 * default is 'general' — universal leverage principles that fit any team.
 *
 * Tone: demanding but humane. Every insight is meant to advance the work AND
 * respect the person — leverage over hours, judgment over busyness. A feed
 * that quietly makes someone better at their job without stealing their
 * evening is the win-win.
 */

export type Industry =
  | 'general'
  | 'pharma_manufacturing'
  | 'software'
  | 'finance'
  | 'healthcare'
  | 'manufacturing'
  | 'consulting'
  | 'education'
  | 'construction'
  | 'logistics';

export interface Insight {
  /** Short uppercase category chip, e.g. "LEVERAGE", "QUALITY". */
  tag: string;
  /** One-line headline — the takeaway, readable at a glance. */
  title: string;
  /** One or two sentences of substance. No fluff, no filler. */
  body: string;
}

export const INDUSTRY_LABELS: Record<Industry, string> = {
  general: 'General',
  pharma_manufacturing: 'Pharmaceutical manufacturing',
  software: 'Software & technology',
  finance: 'Finance & fintech',
  healthcare: 'Healthcare & life sciences',
  manufacturing: 'Manufacturing & industrial',
  consulting: 'Consulting & professional services',
  education: 'Education',
  construction: 'Construction & engineering',
  logistics: 'Logistics & supply chain',
};

/** Universal operating principles — the fallback, and always worth reading. */
const GENERAL: Insight[] = [
  {
    tag: 'Leverage',
    title: 'Find the one task that makes the rest easier — or irrelevant',
    body: 'Most days hide a single highest-leverage move. Do that first, while your mind is freshest, and the day bends around it.',
  },
  {
    tag: 'Focus',
    title: 'A full calendar is not a full life',
    body: 'Protect a block of deep, uninterrupted work each day. The meetings will expand to fill whatever you leave them; your best thinking will not.',
  },
  {
    tag: 'Momentum',
    title: 'Ship something small before noon',
    body: 'One finished thing early creates the momentum that carries the harder work after lunch. Done compounds; perfect stalls.',
  },
  {
    tag: 'Clarity',
    title: 'If you can’t say it in one line, you don’t understand it yet',
    body: 'Before assigning work, write the outcome in a single sentence. Ambiguity is the most expensive thing a team ships.',
  },
  {
    tag: 'Balance',
    title: 'Rest is part of the work',
    body: 'The people who sustain great output guard their evenings as fiercely as their deadlines. Stop at a clean line, not an exhausted one.',
  },
  {
    tag: 'Trust',
    title: 'Give the why, not just the what',
    body: 'A team that understands the goal makes a hundred small right decisions you never have to make for them.',
  },
];

const LIBRARY: Partial<Record<Industry, Insight[]>> = {
  pharma_manufacturing: [
    {
      tag: 'Quality',
      title: 'The cheapest deviation is the one caught before batch release',
      body: 'Build the check into the step, not the review. Quality designed-in costs minutes; quality inspected-in costs a recall.',
    },
    {
      tag: 'Compliance',
      title: 'Write the record as if an inspector reads it next year',
      body: 'A contemporaneous, attributable note today is worth a week of reconstruction later. Capture the why while it’s fresh.',
    },
    {
      tag: 'Throughput',
      title: 'Changeover time is the silent tax on a line',
      body: 'Shave the handoff between runs and you add capacity without adding a shift. Most plants leave hours on the floor here.',
    },
    {
      tag: 'CAPA',
      title: 'A corrective action without a root cause is a wish',
      body: 'Fix the system that let the error through, not just the error. Recurrence is the only honest scorecard for a CAPA.',
    },
  ],
  software: [
    {
      tag: 'Velocity',
      title: 'Small PRs merge faster and break less',
      body: 'Cut the change until it’s reviewable in ten minutes. Big batches hide bugs and stall the whole queue behind them.',
    },
    {
      tag: 'Focus',
      title: 'Protect the maker’s schedule',
      body: 'A single mid-morning meeting can fracture a whole day of deep work. Cluster interruptions; defend the long blocks.',
    },
    {
      tag: 'Quality',
      title: 'The bug you ship is the most expensive line you wrote',
      body: 'Time spent making a change obviously correct is cheaper than the incident it prevents. Slow is smooth; smooth is fast.',
    },
  ],
  finance: [
    {
      tag: 'Rigor',
      title: 'Reconcile daily, not at quarter-end',
      body: 'A small daily check beats a heroic month-end scramble. The error you find today is a footnote; the one you find in Q3 is a restatement.',
    },
    {
      tag: 'Risk',
      title: 'The model is a tool, not the decision',
      body: 'Know which assumption, if wrong, breaks the whole number — and watch that one like a hawk.',
    },
  ],
  healthcare: [
    {
      tag: 'Care',
      title: 'The handoff is where safety is won or lost',
      body: 'Most breakdowns happen in the gaps between shifts and systems. Make the handoff explicit, written, and unambiguous.',
    },
    {
      tag: 'Balance',
      title: 'A rested team is a safer team',
      body: 'Burnout isn’t a badge; it’s a risk factor. Sustainable pace is a patient-safety measure, not a perk.',
    },
  ],
  manufacturing: [
    {
      tag: 'Flow',
      title: 'Find the bottleneck — everything else is noise',
      body: 'An hour saved anywhere but the constraint is an illusion. Improve the constraint and the whole line speeds up.',
    },
    {
      tag: 'Quality',
      title: 'Stop the line to fix the cause, not the symptom',
      body: 'A defect passed downstream multiplies in cost at every station. Catch it where it’s born.',
    },
  ],
  consulting: [
    {
      tag: 'Value',
      title: 'Lead with the answer, then the analysis',
      body: 'The client buys judgment, not slides. Say the recommendation first; let the work defend it underneath.',
    },
    {
      tag: 'Scope',
      title: 'The unmanaged scope creep eats the margin',
      body: 'Name the boundary out loud, early. Every quiet “small addition” compounds into a weekend.',
    },
  ],
  education: [
    {
      tag: 'Impact',
      title: 'Feedback is only useful while the work is still warm',
      body: 'A note returned today shapes the next attempt; one returned in two weeks is an autopsy.',
    },
  ],
  construction: [
    {
      tag: 'Sequence',
      title: 'A day saved in planning is a week saved on site',
      body: 'The cheapest place to move a wall is on the drawing. Resolve the clash before the crew arrives.',
    },
  ],
  logistics: [
    {
      tag: 'Flow',
      title: 'Inventory hides problems; flow exposes them',
      body: 'Every buffer you add to feel safe also hides the delay that created the need. Shorten the cycle and the truth shows up.',
    },
  ],
};

/** Resolve the active industry for the current deployment. */
export function resolveIndustry(): Industry {
  const raw = (process.env.PRAGATI_INDUSTRY || 'general').trim().toLowerCase();
  return (raw in INDUSTRY_LABELS ? raw : 'general') as Industry;
}

/** The full insight pool for an industry: its specialised set, then the
 *  universal principles, so even a thin industry always has depth. */
export function insightsFor(industry: Industry): Insight[] {
  return [...(LIBRARY[industry] || []), ...GENERAL];
}

/** Deterministic daily pick — the same insight for everyone in a workspace on
 *  a given day (a shared "thought for the day"), rotating without repeats
 *  until the pool is exhausted. `seed` lets the welcome email pick a distinct
 *  one from the day's brief. */
export function pickInsight(industry: Industry, seed = 0, now: Date = new Date()): Insight {
  const pool = insightsFor(industry);
  const day = Math.floor(now.getTime() / 86_400_000);
  return pool[(day + seed) % pool.length];
}
