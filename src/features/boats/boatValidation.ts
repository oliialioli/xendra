export const BOAT_MESSAGE_MAX_LENGTH = 200;
export const BOAT_NAME_MAX_LENGTH = 40;

const LINK_PATTERNS = [
  /https?:\/\//i,
  /www\./i,
  // A bare "word.tld" domain (e.g. "xendra.eus", "spam.com") with a common TLD --
  // catches the "no scheme, no www" case explicitly called out alongside the two above.
  /\b[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.(?:com|net|org|eus|es|io|dev|app|co|info|xyz|me|gg|tv|ai|cat|biz|shop|link|click)\b/i,
];

/** True if `text` contains anything that reads as a URL or bare domain. */
export function containsLink(text: string): boolean {
  return LINK_PATTERNS.some((pattern) => pattern.test(text));
}

export type BoatMessageValidationError = 'messageEmpty' | 'messageTooLong' | 'messageHasLink' | 'nameTooLong';

/**
 * Validates step 1's text fields. Trims before length/empty checks (so a
 * message of only spaces is rejected) but never mutates the caller's
 * strings -- the trimmed/sanitized values used for storage are produced
 * separately, once, at submit time (see boatRepository's adapters).
 */
export function validateBoatMessageInput(message: string, displayName: string): BoatMessageValidationError | null {
  const trimmedMessage = message.trim();
  if (trimmedMessage.length === 0) return 'messageEmpty';
  if (trimmedMessage.length > BOAT_MESSAGE_MAX_LENGTH) return 'messageTooLong';
  if (containsLink(trimmedMessage)) return 'messageHasLink';
  if (displayName.trim().length > BOAT_NAME_MAX_LENGTH) return 'nameTooLong';
  return null;
}

/** Strips control/markup characters; React already escapes text on render, this just keeps stored data plain. */
export function sanitizePlainText(value: string): string {
  return value.replace(/<[^>]*>/g, '').trim();
}
