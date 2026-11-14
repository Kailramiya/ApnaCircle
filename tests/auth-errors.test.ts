import test from 'node:test';
import assert from 'node:assert/strict';
import { AppError, authErrorKey, errorKey, validationKey } from '../src/lib/errors.ts';

test('auth failures distinguish email restrictions, throttling and account settings', () => {
  assert.equal(authErrorKey({ code: 'email_address_not_authorized' }, 'signUpFailed'), 'authEmailRestricted');
  for (const code of ['over_email_send_rate_limit', 'over_request_rate_limit']) {
    assert.equal(authErrorKey({ code }, 'signUpFailed'), 'authRateLimited');
    assert.equal(authErrorKey({ code }, 'networkError'), 'authRateLimited');
  }
  for (const code of ['signup_disabled', 'email_provider_disabled']) {
    assert.equal(authErrorKey({ code }, 'signUpFailed'), 'authSignUpDisabled');
  }
});

test('signup, sign-in and password recovery use the server error code, not its message', () => {
  const error = Object.assign(new Error('Untranslated server text'), { code: 'weak_password' });
  assert.equal(authErrorKey(error, 'signUpFailed'), 'authWeakPassword');
  assert.equal(authErrorKey(error, 'networkError'), 'authWeakPassword');
  assert.equal(authErrorKey({ code: 'same_password' }, 'networkError'), 'authSamePassword');
  assert.equal(authErrorKey({ code: 'email_not_confirmed' }, 'authFailed'), 'authEmailUnconfirmed');
  assert.equal(authErrorKey({ code: 'email_address_invalid' }, 'signUpFailed'), 'invalidEmail');
  assert.equal(authErrorKey(new Error('weak_password'), 'signUpFailed'), 'signUpFailed');
});

test('transport failures are distinguished without echoing raw server details', () => {
  const error = Object.assign(new Error('Request with private details'), { name: 'AuthRetryableFetchError' });
  assert.equal(authErrorKey(error, 'signUpFailed'), 'networkError');
  assert.equal(authErrorKey({ code: 'request_timeout' }, 'authFailed'), 'networkError');
  assert.equal(authErrorKey({ code: 'unexpected_failure', status: 500, message: 'Database error with private details' }, 'signUpFailed'), 'signUpFailed');
});

test('unknown and account-existence errors preserve the supplied generic fallback', () => {
  for (const error of [null, undefined, 'email_address_not_authorized', {}, { code: null }, { code: 123 },
    { code: 'new_upstream_code' }, { code: 'email_exists' }, { code: 'user_already_exists' }, { code: 'invalid_credentials' }]) {
    assert.equal(authErrorKey(error, 'signUpFailed'), 'signUpFailed');
    assert.equal(authErrorKey(error, 'authFailed'), 'authFailed');
  }
});

test('existing media, profile and field error handling remains available', () => {
  assert.equal(errorKey(new AppError('photoDenied')), 'photoDenied');
  assert.equal(errorKey({ code: '23505' }), 'usernameTaken');
  assert.equal(errorKey(new Error('Unknown failure')), 'networkError');
  assert.equal(validationKey('invalidEmail'), 'invalidEmail');
  assert.equal(validationKey(undefined), undefined);
});
