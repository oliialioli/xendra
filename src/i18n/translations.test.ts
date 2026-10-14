import { describe, expect, it } from 'vitest';
import { es } from './es';
import { ca } from './ca';
import { gl } from './gl';
import { en } from './en';
import { contentTexts } from './usedTexts';

/** The source of every .ts/.tsx file of the app itself (no tests, no dictionaries). */
const sources = Object.entries(
  import.meta.glob<string>('../**/*.{ts,tsx}', { query: '?raw', import: 'default', eager: true }),
).filter(([path]) => !/\.test\.tsx?$/.test(path) && !/i18n\/(es|en)\.ts$/.test(path));

/** The first argument of every t('...'), msg('...') and translate(lang, '...') in the code. */
function textsInCode(): string[] {
  const call = /(?<![\w.])(?:t|msg|translate\(\s*[\w.]+\s*,)\s*\(?\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
  return sources.flatMap(([, code]) => [...code.matchAll(call)].map((match) => match[2].replace(/\\(['"`\\])/g, '$1')));
}

const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort().join(' ');

describe('translations', () => {
  const used = [...new Set([...textsInCode(), ...contentTexts()])];
  const dictionaries = { es, ca, gl, en };

  it('finds the texts in the code', () => {
    expect(used).toContain('Itxi');
    expect(used).toContain('Guztiak');
    expect(used).toContain('{song}: hitzak (Xendra)');
    expect(used.length).toBeGreaterThan(200);
  });

  it('never builds a translated text with ${...} (use {name} and values instead)', () => {
    expect(used.filter((text) => text.includes('${'))).toEqual([]);
  });

  for (const [lang, dictionary] of Object.entries(dictionaries)) {
    it(`has every text in ${lang}`, () => {
      expect(used.filter((text) => !(text in dictionary))).toEqual([]);
    });

    it(`has nothing left over in ${lang}`, () => {
      expect(Object.keys(dictionary).filter((text) => !used.includes(text))).toEqual([]);
    });

    it(`keeps each text's {placeholders} in ${lang}`, () => {
      const broken = Object.entries(dictionary).filter(([text, translated]) => placeholders(text) !== placeholders(translated));
      expect(broken).toEqual([]);
    });

    it(`leaves nothing empty in ${lang}`, () => {
      expect(Object.entries(dictionary).filter(([, translated]) => translated.trim() === '')).toEqual([]);
    });
  }
});
