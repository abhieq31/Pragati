/**
 * Unit tests for the demo-account predicate — the shared identity used by both
 * the demo seed and the auth path to decide which accounts are exempt from the
 * brute-force lockout. The pattern must be narrow enough that a real user
 * account can never be mistaken for a public demo account.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isDemoAccount, DEMO_EMAIL_RX } from '../../src/lib/demo';

describe('isDemoAccount — matches the seeded public demo accounts', () => {
  it('matches the two headline demo accounts from the README', () => {
    assert.equal(isDemoAccount('demo.lead@pragati.local'), true);
    assert.equal(isDemoAccount('demo.ic@pragati.local'), true);
  });

  it('matches the supporting demo contributors (demo.<first>@pragati.local)', () => {
    assert.equal(isDemoAccount('demo.rahul@pragati.local'), true);
    assert.equal(isDemoAccount('demo.kavya@pragati.local'), true);
    assert.equal(isDemoAccount('demo.admin@pragati.local'), true);
  });

  it('is case-insensitive and tolerates surrounding whitespace', () => {
    assert.equal(isDemoAccount('  DEMO.Lead@Pragati.Local  '), true);
  });
});

describe('isDemoAccount — never catches a real account', () => {
  it('rejects real company emails', () => {
    assert.equal(isDemoAccount('priya.shah@company.com'), false);
    assert.equal(isDemoAccount('admin@pragati.local'), false); // no demo. prefix
    assert.equal(isDemoAccount('demonstrator@pragati.local'), false); // demo not followed by a dot
  });

  it('rejects look-alike domains and embedded-@ tricks', () => {
    assert.equal(isDemoAccount('demo.lead@pragati.local.evil.com'), false);
    assert.equal(isDemoAccount('demo.lead@evil.com'), false);
    assert.equal(isDemoAccount('demo.lead@pragati.local@evil.com'), false);
    assert.equal(isDemoAccount('attacker+demo.lead@pragati.local'), false);
  });

  it('rejects empty / nullish input', () => {
    assert.equal(isDemoAccount(''), false);
    assert.equal(isDemoAccount(null), false);
    assert.equal(isDemoAccount(undefined), false);
  });
});

describe('DEMO_EMAIL_RX — shared with the seed cleanup query', () => {
  it('is anchored at both ends so it can be used directly as a Mongo filter', () => {
    assert.equal(DEMO_EMAIL_RX.source.startsWith('^'), true);
    assert.equal(DEMO_EMAIL_RX.source.endsWith('$'), true);
  });
});
