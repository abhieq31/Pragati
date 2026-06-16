/**
 * Unit tests for the support-ticket analytics — the PURE layer in lib/tickets.
 * No database is touched, mirroring the other tests/unit specs. The series the
 * UI/reports/brief all read flows through summarizeTickets, so its arithmetic
 * (week-over-week, net flow, robust anomaly, the clear-ETA projection) is the
 * thing worth pinning down here.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  median,
  mad,
  linearSlope,
  summarizeTickets,
  combineSeries,
  ticketArrow,
  wowText,
  composeTicketHeadline,
  type TicketEntry,
} from '../../src/lib/tickets';

/** Build a series of `open` values into TicketEntry[] with sequential dates. */
function series(opens: number[], logged: number[] = [], resolved: number[] = []): TicketEntry[] {
  return opens.map((open, i) => ({
    dateKey: `2026-06-${String(i + 1).padStart(2, '0')}`,
    open,
    logged: logged[i] ?? 0,
    resolved: resolved[i] ?? 0,
  }));
}

describe('pure stats', () => {
  it('median handles odd and even lengths', () => {
    assert.equal(median([3, 1, 2]), 2);
    assert.equal(median([4, 1, 2, 3]), 2.5);
    assert.equal(median([]), 0);
  });

  it('mad is the median absolute deviation', () => {
    // values 1..5, median 3, abs devs [2,1,0,1,2] → median 1
    assert.equal(mad([1, 2, 3, 4, 5]), 1);
    assert.equal(mad([7, 7, 7]), 0);
  });

  it('linearSlope recovers a known slope', () => {
    assert.equal(linearSlope([0, 2, 4, 6]), 2);
    assert.equal(linearSlope([10, 8, 6, 4]), -2);
    assert.equal(linearSlope([5]), 0);
    assert.equal(linearSlope([5, 5, 5]), 0);
  });

  it('ticketArrow points the right way', () => {
    assert.equal(ticketArrow(3), '↑');
    assert.equal(ticketArrow(-3), '↓');
    assert.equal(ticketArrow(0), '→');
  });
});

describe('summarizeTickets', () => {
  it('returns the empty summary for no readings', () => {
    const s = summarizeTickets([]);
    assert.equal(s.count, 0);
    assert.equal(s.latest, null);
    assert.equal(s.open, 0);
    assert.equal(s.headline, 'No readings logged yet.');
  });

  it('reads the latest reading as the headline backlog', () => {
    const s = summarizeTickets(series([100, 110, 95], [10, 12, 8], [5, 9, 20]));
    assert.equal(s.count, 3);
    assert.equal(s.open, 95);
    assert.equal(s.loggedToday, 8);
    assert.equal(s.resolvedToday, 20);
  });

  it('sorts an out-of-order series by date before computing', () => {
    const unsorted: TicketEntry[] = [
      { dateKey: '2026-06-03', open: 95, logged: 8, resolved: 20 },
      { dateKey: '2026-06-01', open: 100, logged: 10, resolved: 5 },
      { dateKey: '2026-06-02', open: 110, logged: 12, resolved: 9 },
    ];
    assert.equal(summarizeTickets(unsorted).open, 95);
  });

  it('computes 7-day inflow/throughput and net flow', () => {
    // 8 days; last 7 logged sum vs resolved sum.
    const logged = [5, 5, 5, 5, 5, 5, 5, 5];
    const resolved = [3, 3, 3, 3, 3, 3, 3, 3];
    const s = summarizeTickets(series([50, 50, 50, 50, 50, 50, 50, 50], logged, resolved));
    assert.equal(s.logged7, 35);
    assert.equal(s.resolved7, 21);
    assert.equal(s.netFlow7, 14); // inflow outpacing resolution
  });

  it('computes week-over-week backlog movement', () => {
    // First 7 days avg 100, next 7 days avg 120 → +20 absolute, +20% .
    const opens = [...Array(7).fill(100), ...Array(7).fill(120)];
    const s = summarizeTickets(series(opens));
    assert.equal(s.avgOpen7, 120);
    assert.equal(s.avgOpenPrev7, 100);
    assert.equal(s.openWoWDelta, 20);
    assert.equal(s.openWoWPct, 20);
    assert.equal(ticketArrow(s.openWoWDelta), '↑');
  });

  it('flags a rising vs falling backlog by slope', () => {
    assert.equal(summarizeTickets(series([10, 20, 30, 40, 50])).direction, 'rising');
    assert.equal(summarizeTickets(series([50, 40, 30, 20, 10])).direction, 'falling');
    assert.equal(summarizeTickets(series([30, 30, 30, 30, 30])).direction, 'flat');
  });

  it('projects a clear-ETA only when resolution outpaces inflow', () => {
    // Resolving 5/day more than logged, backlog 50 → ~10 days.
    const shrinking = summarizeTickets(
      series([50, 50, 50, 50, 50, 50, 50], Array(7).fill(2), Array(7).fill(7)),
    );
    assert.equal(shrinking.clearEtaDays, 10);

    // Inflow outpacing resolution → no ETA.
    const growing = summarizeTickets(
      series([50, 50, 50, 50, 50, 50, 50], Array(7).fill(7), Array(7).fill(2)),
    );
    assert.equal(growing.clearEtaDays, null);
  });

  it('detects a robust anomaly on a spike', () => {
    // A long flat baseline then a wild jump — should be flagged.
    const s = summarizeTickets(series([20, 21, 19, 20, 21, 20, 19, 20, 200]));
    assert.ok(s.anomaly);
    assert.equal(s.anomaly!.isAnomalous, true);

    // A steady series should not flag.
    const calm = summarizeTickets(series([20, 21, 19, 20, 21, 20, 22]));
    assert.equal(calm.anomaly!.isAnomalous, false);
  });

  it('needs at least five readings before testing for anomalies', () => {
    const s = summarizeTickets(series([10, 200]));
    assert.equal(s.anomaly, null);
  });

  it('caps the sparkline at the last 30 readings', () => {
    const opens = Array.from({ length: 40 }, (_, i) => i);
    const s = summarizeTickets(
      opens.map((open, i) => ({
        dateKey: `2026-${String(Math.floor(i / 28) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        open,
        logged: 0,
        resolved: 0,
      })),
    );
    assert.equal(s.sparkline.length, 30);
    assert.equal(s.sparkline[s.sparkline.length - 1], 39);
  });
});

describe('composeTicketHeadline', () => {
  it('leads with the standing backlog and today flow', () => {
    const s = summarizeTickets(series([100, 110, 95], [10, 12, 8], [5, 9, 20]));
    const h = composeTicketHeadline(s);
    assert.ok(h.startsWith('95 open'));
    assert.ok(h.includes('+8 in / −20 out today'));
  });

  it('matches the headline stored on the summary', () => {
    const s = summarizeTickets(series([100, 110, 95], [10, 12, 8], [5, 9, 20]));
    assert.equal(s.headline, composeTicketHeadline(s));
  });
});

describe('combineSeries', () => {
  it('sums same-day readings across projects', () => {
    const a: TicketEntry[] = [
      { dateKey: '2026-06-01', open: 10, logged: 1, resolved: 2 },
      { dateKey: '2026-06-02', open: 12, logged: 3, resolved: 1 },
    ];
    const b: TicketEntry[] = [
      { dateKey: '2026-06-01', open: 5, logged: 2, resolved: 0 },
      { dateKey: '2026-06-03', open: 7, logged: 1, resolved: 1 },
    ];
    const c = combineSeries([a, b]);
    assert.equal(c.length, 3);
    assert.deepEqual(c[0], { dateKey: '2026-06-01', open: 15, logged: 3, resolved: 2 });
    assert.deepEqual(c[1], { dateKey: '2026-06-02', open: 12, logged: 3, resolved: 1 });
    assert.deepEqual(c[2], { dateKey: '2026-06-03', open: 7, logged: 1, resolved: 1 });
  });

  it('returns a sorted, empty-safe result', () => {
    assert.deepEqual(combineSeries([]), []);
    assert.deepEqual(combineSeries([[]]), []);
  });
});

describe('wowText', () => {
  it('renders a percentage when there is a prior week', () => {
    const s = summarizeTickets(series([...Array(7).fill(100), ...Array(7).fill(120)]));
    assert.equal(wowText(s), '↑ 20% wk/wk');
  });

  it('falls back to a direction word with no prior week', () => {
    const s = summarizeTickets(series([10, 20, 30, 40, 50]));
    assert.equal(wowText(s), 'backlog rising');
  });
});
