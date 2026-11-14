import { en, type MessageKey } from './translations.ts';

export class AppError extends Error {
  key: MessageKey;
  constructor(key: MessageKey, options?: ErrorOptions) { super(key, options); this.key = key; }
}
export function errorKey(error: unknown): MessageKey {
  if (error instanceof AppError) return error.key;
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') return 'usernameTaken';
  return 'networkError';
}
export function authErrorKey(error: unknown, fallback: MessageKey): MessageKey {
  if (typeof error !== 'object' || error === null) return fallback;
  const code = 'code' in error ? error.code : undefined;
  switch (code) {
    case 'email_address_not_authorized': return 'authEmailRestricted';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit': return 'authRateLimited';
    case 'signup_disabled':
    case 'email_provider_disabled': return 'authSignUpDisabled';
    case 'weak_password': return 'authWeakPassword';
    case 'same_password': return 'authSamePassword';
    case 'email_address_invalid': return 'invalidEmail';
    case 'email_not_confirmed': return 'authEmailUnconfirmed';
    case 'request_timeout': return 'networkError';
  }
  if ('name' in error && error.name === 'AuthRetryableFetchError') return 'networkError';
  return fallback;
}
export function validationKey(message: string | undefined): MessageKey | undefined {
  return message && message in en ? message as MessageKey : undefined;
}
