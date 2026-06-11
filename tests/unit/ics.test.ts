/** Unit tests for the iCalendar agenda renderer (pure — no DB). */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { escapeIcsText, foldIcsLine, renderAgendaIcs } from '../../src/lib/ics';

describe('escapeIcsText', () => {
  it('escapes RFC 5545 specials', () => {
    assert.equal(escapeIcsText('a;b,c\\d\ne'), 'a\\;b\\,c\\\\d\\ne');
  });
});

describe('foldIcsLine', () => {
  it('folds long lines at 75 octets with continuation spaces', () => {
    const folded = foldIcsLine('X'.repeat(200));
    const lines = folded.split('\r\n');
    assert.equal(lines[0].length, 75);
    assert.ok(lines.slice(1).every((l) => l.startsWith(' ') && l.length <= 75));
    assert.equal(lines.join('').replace(/ /g, '').length, 200);
  });

  it('leaves short lines untouched', () => {
    assert.equal(foldIcsLine('SHORT:line'), 'SHORT:line');
  });
});

describe('renderAgendaIcs', () => {
  const now = new Date('2026-06-10T03:00:00Z');

  it('renders a valid calendar with all-day events and deep links', () => {
    const ics = renderAgendaIcs({
      calendarName: 'Pragati — Asha',
      appUrl: 'https://pragati.example',
      now,
      tasks: [
        {
          id: 'abc123',
          title: 'Approve URS; revision',
          projectName: 'MES Upgrade',
          due: new Date('2026-06-12T00:00:00Z'),
          status: 'in_progress',
          priority: 'high',
        },
      ],
    });

    assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
    assert.match(ics, /END:VCALENDAR\r\n$/);
    assert.match(ics, /X-WR-CALNAME:Pragati — Asha/);
    assert.match(ics, /UID:task-abc123@pragati/);
    assert.match(ics, /DTSTART;VALUE=DATE:20260612/);
    assert.match(ics, /DTEND;VALUE=DATE:20260613/);
    assert.match(ics, /SUMMARY:Approve URS\\; revision · MES Upgrade/);
    assert.match(ics, /URL:https:\/\/pragati.example\/tasks\/abc123/);
    assert.match(ics, /TRANSP:TRANSPARENT/);
  });

  it('omits links when no app URL is configured and handles empty feeds', () => {
    const ics = renderAgendaIcs({ calendarName: 'Empty', tasks: [], now });
    assert.match(ics, /BEGIN:VCALENDAR/);
    assert.doesNotMatch(ics, /BEGIN:VEVENT/);
  });
});
