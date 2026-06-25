/**
 * Unit tests for the shared default-password convention: FirstName@employeeId.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { defaultPassword, canUseDefaultPassword } from '../../src/lib/defaultPassword';

describe('defaultPassword', () => {
  it('builds FirstName@employeeId from a full name', () => {
    assert.equal(defaultPassword('Abhi Patel', '29218'), 'Abhi@29218');
  });

  it('uses only the first whitespace-delimited token of the name', () => {
    assert.equal(defaultPassword('  Mary Jane Watson ', 'E7'), 'Mary@E7');
  });

  it('trims the employee ID', () => {
    assert.equal(defaultPassword('Sam', '  42  '), 'Sam@42');
  });

  it('falls back to "User" when the name is empty', () => {
    assert.equal(defaultPassword('', '100'), 'User@100');
    assert.equal(defaultPassword('   ', '100'), 'User@100');
  });
});

describe('canUseDefaultPassword', () => {
  it('is true only when an employee ID is present', () => {
    assert.equal(canUseDefaultPassword('29218'), true);
    assert.equal(canUseDefaultPassword(' x '), true);
  });

  it('is false for empty / missing employee IDs', () => {
    assert.equal(canUseDefaultPassword(''), false);
    assert.equal(canUseDefaultPassword('   '), false);
    assert.equal(canUseDefaultPassword(null), false);
    assert.equal(canUseDefaultPassword(undefined), false);
  });
});
