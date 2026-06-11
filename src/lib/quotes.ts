/**
 * Login-screen wisdom — curated, attributed, and app-relevant.
 *
 * Every quote is from one of seven builders (Jobs, Naval, Bezos, Musk,
 * Franklin, Jensen Huang, Ellison) and earns its slot only if it speaks to
 * what Pragati is for: clarity, ownership, focus, shipping, and seeing the
 * whole board. The library is BUILT-IN (works offline, forever) and can be
 * refreshed "life long" without a redeploy by hosting a JSON array of
 * {text, author} anywhere public (a GitHub raw URL works) and setting
 * QUOTES_FEED_URL — /api/quotes serves the feed with this list as fallback.
 */

export interface Quote {
  text: string;
  author: string;
}

export const BUILTIN_QUOTES: Quote[] = [
  // Steve Jobs — focus & simplicity
  { text: 'Focus is about saying no to the hundred other good ideas.', author: 'Steve Jobs' },
  { text: 'Simple can be harder than complex — but it moves mountains.', author: 'Steve Jobs' },
  { text: 'Deciding what not to do is as important as deciding what to do.', author: 'Steve Jobs' },
  { text: 'Real artists ship.', author: 'Steve Jobs' },
  { text: 'Quality is more important than quantity. One home run beats two doubles.', author: 'Steve Jobs' },
  // Naval Ravikant — leverage & clarity
  { text: 'Clear thinker is a better compliment than smart.', author: 'Naval Ravikant' },
  { text: 'Earn with your mind, not your time.', author: 'Naval Ravikant' },
  {
    text: 'The most important skill for getting rich is becoming a perpetual learner.',
    author: 'Naval Ravikant',
  },
  { text: 'Impatience with actions, patience with results.', author: 'Naval Ravikant' },
  {
    text: 'Simple heuristic: if you’re evenly split on a decision, take the path more painful in the short term.',
    author: 'Naval Ravikant',
  },
  // Jeff Bezos — ownership & long term
  { text: 'It is always Day 1.', author: 'Jeff Bezos' },
  { text: 'Good intentions don’t work. Mechanisms do.', author: 'Jeff Bezos' },
  { text: 'Be stubborn on vision, flexible on details.', author: 'Jeff Bezos' },
  {
    text: 'If you double the number of experiments you do per year, you double your inventiveness.',
    author: 'Jeff Bezos',
  },
  { text: 'Complaining is not a strategy.', author: 'Jeff Bezos' },
  // Elon Musk — urgency & first principles
  { text: 'The best part is no part. The best process is no process.', author: 'Elon Musk' },
  { text: 'If a schedule is long, it’s wrong. If it’s tight, it’s right.', author: 'Elon Musk' },
  { text: 'Constantly think about how you could be doing things better.', author: 'Elon Musk' },
  {
    text: 'When something is important enough, you do it even if the odds are not in your favor.',
    author: 'Elon Musk',
  },
  // Benjamin Franklin — discipline & time
  { text: 'Lost time is never found again.', author: 'Benjamin Franklin' },
  { text: 'Well done is better than well said.', author: 'Benjamin Franklin' },
  { text: 'By failing to prepare, you are preparing to fail.', author: 'Benjamin Franklin' },
  { text: 'Little strokes fell great oaks.', author: 'Benjamin Franklin' },
  { text: 'Never confuse motion with action.', author: 'Benjamin Franklin' },
  // Jensen Huang — pace & standards
  { text: 'I want you to be in a state of urgency. Not panic — urgency.', author: 'Jensen Huang' },
  { text: 'Run. Don’t walk.', author: 'Jensen Huang' },
  { text: 'Expectations lead to disappointment. Determination leads to results.', author: 'Jensen Huang' },
  { text: 'The ability to learn is the most important quality a leader can have.', author: 'Jensen Huang' },
  // Larry Ellison — conviction
  {
    text: 'When you innovate, you’ve got to be prepared for everyone telling you you’re nuts.',
    author: 'Larry Ellison',
  },
  {
    text: 'Great achievers are driven not so much by the pursuit of success, but by the fear of failure.',
    author: 'Larry Ellison',
  },
  {
    text: 'When you’re the first person whose beliefs are different from what everyone else believes, you’re basically saying, “I’m right and everyone else is wrong.” That’s a very unpleasant position to be in — it’s at once exhilarating and at the same time an invitation to be attacked.',
    author: 'Larry Ellison',
  },
];

/** Deterministic daily starting point so everyone who opens the login page on
 *  the same day begins on the same quote (then rotation takes over). */
export function dailyQuoteOffset(count: number, now: Date = new Date()): number {
  if (count <= 0) return 0;
  const day = Math.floor(now.getTime() / 86_400_000);
  return day % count;
}
