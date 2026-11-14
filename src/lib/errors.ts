import { en, type MessageKey } from './translations';

export class AppError extends Error {
  key: MessageKey;
  constructor(key: MessageKey, options?: ErrorOptions) { super(key, options); this.key = key; }
}
export function errorKey(error: unknown): MessageKey {
  if (error instanceof AppError) return error.key;
  if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') return 'usernameTaken';
  return 'networkError';
}
export function validationKey(message: string | undefined): MessageKey | undefined {
  return message && message in en ? message as MessageKey : undefined;
}
