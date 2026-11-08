import { describe, expect, it } from 'vitest';
import { DEFAULT_LANG, LANGS, apiErrorText, isLang, messages, otherLang, schoolName, shortSchoolName } from './i18n';
import { createSeed } from '../../../shared/seed';

function keysOf(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v !== null && typeof v === 'object' ? keysOf(v as Record<string, unknown>, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

function stringsOf(obj: Record<string, unknown>): string[] {
  return Object.values(obj).flatMap((v) => {
    if (typeof v === 'string') return [v];
    if (typeof v === 'function') return [];
    if (v !== null && typeof v === 'object') return stringsOf(v as Record<string, unknown>);
    return [];
  });
}

describe('i18n dictionaries', () => {
  it('defaults to English and knows both languages', () => {
    expect(DEFAULT_LANG).toBe('en');
    expect(LANGS).toEqual(['en', 'ko']);
    expect(isLang('ko')).toBe(true);
    expect(isLang('fr')).toBe(false);
    expect(otherLang('en')).toBe('ko');
    expect(otherLang('ko')).toBe('en');
  });

  it('has the same UI keys in English and Korean (error codes differ by design: the server speaks Korean)', () => {
    const uiKeys = (lang: 'en' | 'ko') => keysOf(messages[lang]).filter((k) => !k.startsWith('errors.')).sort();
    expect(uiKeys('ko')).toEqual(uiKeys('en'));
    for (const code of ['NETWORK', 'HTTP_ERROR', 'UNKNOWN']) {
      expect(messages.ko.errors[code]).toBeTruthy();
      expect(messages.en.errors[code]).toBeTruthy();
    }
  });

  it('uses "돌봄교실" / "daycare" for the school side, never "돌봄전담사" / "coordinator"', () => {
    const ko = stringsOf(messages.ko).join('\n');
    const en = stringsOf(messages.en).join('\n');
    expect(ko).not.toContain('돌봄전담사');
    expect(ko).toContain('돌봄교실');
    expect(en.toLowerCase()).not.toContain('coordinator');
    expect(en.toLowerCase()).toContain('daycare');
    expect(messages.ko.roleTeacher).toBe('돌봄교실');
    expect(messages.en.roleTeacher).toBe('Daycare');
  });

  it('picks the school name for the language', () => {
    const [cheongam] = createSeed().schools;
    expect(schoolName(cheongam, 'ko')).toBe('청암초등학교');
    expect(schoolName(cheongam, 'en')).toBe('Cheongam Elementary');
    expect(shortSchoolName(cheongam, 'ko')).toBe('청암초');
    expect(shortSchoolName(cheongam, 'en')).toBe('Cheongam');
  });

  it('translates known API error codes in English and keeps the server message in Korean', () => {
    expect(apiErrorText('FULL', '정원이 가득 차서 승인할 수 없습니다.', 'ko')).toBe('정원이 가득 차서 승인할 수 없습니다.');
    expect(apiErrorText('FULL', '정원이 가득 차서 승인할 수 없습니다.', 'en')).toMatch(/full/i);
    expect(apiErrorText('SOMETHING_NEW', 'server text', 'en')).toBe('server text');
  });

  it('seed data carries an English waitlist note without the old role name', () => {
    for (const s of createSeed().schools) {
      expect(s.waitlistNoteEn.length).toBeGreaterThan(0);
      expect(s.waitlistNote).not.toContain('돌봄전담사');
      expect(s.waitlistNoteEn.toLowerCase()).not.toContain('coordinator');
    }
  });
});
