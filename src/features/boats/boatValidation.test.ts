import { describe, expect, it } from 'vitest';
import { containsLink, validateBoatMessageInput } from './boatValidation';

describe('containsLink', () => {
  it('detects http/https URLs', () => {
    expect(containsLink('begiratu http://example.com')).toBe(true);
    expect(containsLink('begiratu https://example.com')).toBe(true);
  });

  it('detects www. prefixed text', () => {
    expect(containsLink('www.xendra.eus bisitatu')).toBe(true);
  });

  it('detects a bare domain with a common TLD', () => {
    expect(containsLink('idatzi spam.com helbidera')).toBe(true);
  });

  it('does not flag plain text with dots (e.g. an ellipsis or abbreviation)', () => {
    expect(containsLink('Kaixo... Zorte on!')).toBe(false);
    expect(containsLink('12.34 metro')).toBe(false);
  });
});

describe('validateBoatMessageInput', () => {
  it('rejects an empty or whitespace-only message', () => {
    expect(validateBoatMessageInput('', '')).toBe('messageEmpty');
    expect(validateBoatMessageInput('   ', '')).toBe('messageEmpty');
  });

  it('rejects a message over 200 characters', () => {
    expect(validateBoatMessageInput('a'.repeat(201), '')).toBe('messageTooLong');
  });

  it('accepts a message at exactly 200 characters', () => {
    expect(validateBoatMessageInput('a'.repeat(200), '')).toBeNull();
  });

  it('rejects a message containing a link', () => {
    expect(validateBoatMessageInput('ikusi hemen: https://spam.example', '')).toBe('messageHasLink');
  });

  it('rejects a name over 40 characters', () => {
    expect(validateBoatMessageInput('mezu laburra', 'a'.repeat(41))).toBe('nameTooLong');
  });

  it('accepts a valid message with no name', () => {
    expect(validateBoatMessageInput('Xendra da onena!', '')).toBeNull();
  });

  it('accepts a valid message with a name', () => {
    expect(validateBoatMessageInput('Xendra da onena!', 'Ane')).toBeNull();
  });
});
