/**
 * Unit tests for the shared password-reuse guard.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import bcrypt from 'bcryptjs';

import {
  isPasswordReused,
  pushPasswordHistory,
  PASSWORD_HISTORY_LENGTH,
} from '../../src/lib/passwordHistory';

const hash = (s: string) => bcrypt.hashSync(s, 4); // low cost for tests

describe('isPasswordReused', () => {
  it('rejects the current password (not just history)', () => {
    const current = hash('Default@123');
    assert.equal(isPasswordReused('Default@123', current, []), true);
  });

  it('rejects a password matching any history entry', () => {
    const current = hash('NewOne!1');
    const history = [hash('OldA!1'), hash('OldB!1')];
    assert.equal(isPasswordReused('OldB!1', current, history), true);
  });

  it('allows a genuinely new password', () => {
    const current = hash('NewOne!1');
    const history = [hash('OldA!1')];
    assert.equal(isPasswordReused('FreshPick!9', current, history), false);
  });

  it('tolerates a null current hash and empty history', () => {
    assert.equal(isPasswordReused('whatever', null, []), false);
  });
});

describe('pushPasswordHistory', () => {
  it('prepends the current hash and keeps the most recent N', () => {
    const next = pushPasswordHistory('c', ['b', 'a', 'z']);
    assert.equal(next.length, PASSWORD_HISTORY_LENGTH);
    assert.deepEqual(next, ['c', 'b', 'a']);
  });
});
