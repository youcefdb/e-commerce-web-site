import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizePostalCode, MAX_POSTAL_CODE_LENGTH } from './postal-code.mjs';

test('normalizes postal codes as strings without losing leading zeroes or internal spaces', () => {
  assert.equal(normalizePostalCode('01234'), '01234');
  assert.equal(normalizePostalCode('94107'), '94107');
  assert.equal(normalizePostalCode('  SW1A 1AA  '), 'SW1A 1AA');
});

test('rejects non-strings, blank values, and values over the shared length limit', () => {
  for (const value of [{}, [], true, 94107, '   ', 'A'.repeat(MAX_POSTAL_CODE_LENGTH + 1)]) {
    assert.equal(normalizePostalCode(value), null);
  }
});
