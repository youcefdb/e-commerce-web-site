import assert from 'node:assert/strict';
import test from 'node:test';
import { getGoogleErrorMessage } from './google-error-message.mjs';

test('explains when an existing account must be authenticated before Google linking', () => {
  const message = getGoogleErrorMessage('linkRequired');
  assert.match(message, /Sign in with that account’s password first/);
  assert.match(message, /No session was created/);
});

test('explains that an older unmapped Google account needs recovery', () => {
  assert.match(getGoogleErrorMessage('legacyRecovery'), /account recovery/);
});

test('uses a safe generic message for other Google failures', () => {
  assert.equal(getGoogleErrorMessage('unknown'), 'Google sign-in could not be completed. Please try again.');
});
