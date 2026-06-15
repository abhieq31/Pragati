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
          updatedAt: new Date('2026-06-11T09:30:00Z'),
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
    // SEQUENCE + LAST-MODIFIED let clients (Outlook) update a moved event.
    assert.match(ics, /SEQUENCE:\d+/);
    assert.match(ics, /LAST-MODIFIED:20260611T093000Z/);
  });

  it('includes the task description and project reference in the body', () => {
    const ics = renderAgendaIcs({
      calendarName: 'X',
      appUrl: 'https://pragati.example',
      now,
      tasks: [
        {
          id: 't9',
          title: 'Department head approval',
          projectName: 'SOP Revision',
          projectRef: 'CC-2026-042',
          description: 'Route the revised SOP to the department head for sign-off before the effective date.',
          due: new Date('2026-06-23T00:00:00Z'),
          status: 'in_progress',
          priority: 'medium',
        },
      ],
    });
    // The DESCRIPTION is a single (folded) line — unfold before matching.
    const unfolded = ics.replace(/\r\n /g, '');
    // Description text leads the body…
    assert.match(unfolded, /DESCRIPTION:Route the revised SOP/);
    // …and the project line carries name + reference (\n is escaped in iCal).
    assert.match(unfolded, /Project: SOP Revision \(CC-2026-042\)/);
    assert.match(unfolded, /Status: in progress/);
  });

  it('truncates an over-long description to a preview', () => {
    const long = 'word '.repeat(200).trim();
    const ics = renderAgendaIcs({
      calendarName: 'X',
      tasks: [{ id: 't10', title: 'Long', description: long, due: new Date('2026-06-12T00:00:00Z') }],
    });
    // Unfold continuation lines, then confirm the ellipsis marks a trimmed body.
    assert.match(ics.replace(/\r\n /g, ''), /…/);
  });

  it('emits SEQUENCE 0 when the task has no updatedAt', () => {
    const ics = renderAgendaIcs({
      calendarName: 'X',
      tasks: [{ id: 'n1', title: 'No stamp', due: new Date('2026-06-12T00:00:00Z') }],
    });
    assert.match(ics, /SEQUENCE:0/);
  });

  it('omits links when no app URL is configured and handles empty feeds', () => {
    const ics = renderAgendaIcs({ calendarName: 'Empty', tasks: [], now });
    assert.match(ics, /BEGIN:VCALENDAR/);
    assert.doesNotMatch(ics, /BEGIN:VEVENT/);
  });
});
