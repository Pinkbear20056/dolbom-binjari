import { describe, expect, it } from 'vitest';
import { createSeed } from './seed';
import type { Application, School } from './types';
import {
  approveApplication,
  isDuplicateApplication,
  isStale,
  markerState,
  rejectApplication,
  schoolsInBundle,
  vacancy,
  validateNewApplication,
} from './rules';

const NOW = new Date('2026-11-08T10:00:00Z');
const seed = createSeed(NOW);
const byId = (id: string): School => {
  const s = seed.schools.find((x) => x.id === id);
  if (!s) throw new Error(`no school ${id}`);
  return s;
};

const pendingApp: Application = {
  id: 'a1',
  schoolId: 'gaon',
  homeSchoolId: 'cheongam',
  kind: 'inquiry',
  childName: '김하늘',
  grade: 2,
  guardianPhone: '010-0000-0000',
  status: 'pending',
  rejectReason: null,
  createdAt: NOW.toISOString(),
  updatedAt: NOW.toISOString(),
};

describe('vacancy (정원상 빈자리)', () => {
  it('is capacity minus current', () => {
    expect(vacancy(byId('gaon'))).toBe(3);
    expect(vacancy(byId('wadong'))).toBe(1);
  });
  it('never goes below zero', () => {
    expect(vacancy({ ...byId('gaon'), current: 99 })).toBe(0);
  });
});

describe('markerState priority', () => {
  it('1. stale (updatedAt older than 24h) wins over everything, no parent button', () => {
    const old = new Date(NOW.getTime() - 25 * 60 * 60 * 1000).toISOString();
    const m = markerState({ ...byId('wadong'), updatedAt: old }, NOW);
    expect(m.level).toBe('stale');
    expect(m.color).toBe('grey');
    expect(m.label).toBe('정보 갱신 안 됨');
    expect(m.action).toBe('none');
    expect(isStale({ ...byId('wadong'), updatedAt: old }, NOW)).toBe(true);
  });
  it('is not stale at exactly 23h59m', () => {
    const recent = new Date(NOW.getTime() - (24 * 60 - 1) * 60 * 1000).toISOString();
    expect(isStale({ ...byId('wadong'), updatedAt: recent }, NOW)).toBe(false);
  });
  it('2. closed status → red 마감 with 대기 안내 button', () => {
    const m = markerState(byId('cheongam'), NOW);
    expect(m.level).toBe('closed');
    expect(m.color).toBe('red');
    expect(m.label).toBe('마감');
    expect(m.action).toBe('waitlist');
    expect(m.actionLabel).toBe('대기 안내');
  });
  it('2. zero vacancy → 마감 even when the school says open', () => {
    const m = markerState({ ...byId('wadong'), current: 80, status: 'open' }, NOW);
    expect(m.level).toBe('closed');
    expect(m.action).toBe('waitlist');
  });
  it('3. check status → yellow 학교 확인 필요 with 문의 button', () => {
    const m = markerState(byId('gaon'), NOW);
    expect(m.level).toBe('check');
    expect(m.color).toBe('yellow');
    expect(m.label).toBe('학교 확인 필요');
    expect(m.action).toBe('inquire');
    expect(m.actionLabel).toBe('이용 가능 여부 문의');
  });
  it('4. open status with seats → green 신청 가능 with 신청하기 button', () => {
    const m = markerState(byId('wadong'), NOW);
    expect(m.level).toBe('open');
    expect(m.color).toBe('green');
    expect(m.label).toBe('신청 가능');
    expect(m.action).toBe('apply');
    expect(m.actionLabel).toBe('신청하기');
  });
  it('always carries an English label too (colour is never the only cue)', () => {
    for (const s of seed.schools) {
      const m = markerState(s, NOW);
      expect(m.labelEn.length).toBeGreaterThan(0);
    }
  });
});

describe('schoolsInBundle (묶음 필터)', () => {
  it('returns only schools in the same bundle, including the home school', () => {
    const ids = schoolsInBundle(seed.schools, 'cheongam').map((s) => s.id);
    expect(ids).toEqual(['cheongam', 'gaon', 'wadong', 'jisan']);
    expect(ids).not.toContain('munsan');
  });
  it('returns an empty list for an unknown school', () => {
    expect(schoolsInBundle(seed.schools, 'nope')).toEqual([]);
  });
  it('does not mutate the input', () => {
    const copy = [...seed.schools];
    schoolsInBundle(seed.schools, 'gaon');
    expect(seed.schools).toEqual(copy);
  });
});

describe('approveApplication (승인)', () => {
  it('adds one to current and marks the application approved', () => {
    const r = approveApplication(byId('gaon'), pendingApp, NOW);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.school.current).toBe(78);
    expect(r.value.school.updatedAt).toBe(NOW.toISOString());
    expect(r.value.application.status).toBe('approved');
    expect(vacancy(r.value.school)).toBe(2);
  });
  it('refuses when the school is already at capacity', () => {
    const r = approveApplication(byId('cheongam'), { ...pendingApp, schoolId: 'cheongam' }, NOW);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe('FULL');
  });
  it('refuses when the application is not pending', () => {
    const r = approveApplication(byId('gaon'), { ...pendingApp, status: 'rejected' }, NOW);
    expect(r.ok).toBe(false);
  });
  it('refuses when the application belongs to another school', () => {
    const r = approveApplication(byId('wadong'), pendingApp, NOW);
    expect(r.ok).toBe(false);
  });
  it('does not mutate its inputs', () => {
    const school = byId('gaon');
    const before = { ...school };
    approveApplication(school, pendingApp, NOW);
    expect(school).toEqual(before);
    expect(pendingApp.status).toBe('pending');
  });
});

describe('rejectApplication (반려)', () => {
  it('requires a non-empty reason', () => {
    expect(rejectApplication(pendingApp, '', NOW).ok).toBe(false);
    expect(rejectApplication(pendingApp, '   ', NOW).ok).toBe(false);
  });
  it('marks the application rejected with the trimmed reason', () => {
    const r = rejectApplication(pendingApp, ' 거주지 기준 미충족 ', NOW);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.status).toBe('rejected');
    expect(r.value.rejectReason).toBe('거주지 기준 미충족');
  });
  it('refuses when the application is not pending', () => {
    expect(rejectApplication({ ...pendingApp, status: 'approved' }, '사유', NOW).ok).toBe(false);
  });
});

describe('isDuplicateApplication (중복 신청 방지)', () => {
  it('is true when a pending application has the same child name and guardian phone', () => {
    expect(isDuplicateApplication([pendingApp], '김하늘', '010-0000-0000')).toBe(true);
    expect(isDuplicateApplication([pendingApp], ' 김하늘 ', '010-0000-0000')).toBe(true);
  });
  it('is false when the earlier application is already decided', () => {
    expect(isDuplicateApplication([{ ...pendingApp, status: 'approved' }], '김하늘', '010-0000-0000')).toBe(false);
  });
  it('is false for a different child or phone', () => {
    expect(isDuplicateApplication([pendingApp], '김하늘', '010-1111-2222')).toBe(false);
    expect(isDuplicateApplication([pendingApp], '이바다', '010-0000-0000')).toBe(false);
  });
});

describe('validateNewApplication', () => {
  const base = { schoolId: 'wadong', homeSchoolId: 'cheongam', childName: '이바다', grade: 3, guardianPhone: '010-1234-5678' };

  it('accepts an application to an open school in the same bundle', () => {
    const r = validateNewApplication(seed, base, NOW);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.kind).toBe('apply');
  });
  it('turns an application to a "check" school into an inquiry', () => {
    const r = validateNewApplication(seed, { ...base, schoolId: 'gaon' }, NOW);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.kind).toBe('inquiry');
  });
  it('rejects a school outside the home school bundle', () => {
    const r = validateNewApplication(seed, { ...base, schoolId: 'munsan' }, NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('OUT_OF_BUNDLE');
  });
  it('rejects a closed school', () => {
    const r = validateNewApplication(seed, { ...base, schoolId: 'jisan' }, NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('NOT_ACCEPTING');
  });
  it('rejects a duplicate pending application', () => {
    const r = validateNewApplication(seed, { ...base, childName: '김하늘', guardianPhone: '010-0000-0000' }, NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe('DUPLICATE');
  });
  it('rejects unknown schools and bad input', () => {
    expect(validateNewApplication(seed, { ...base, schoolId: 'x' }, NOW).ok).toBe(false);
    expect(validateNewApplication(seed, { ...base, homeSchoolId: 'x' }, NOW).ok).toBe(false);
    expect(validateNewApplication(seed, { ...base, childName: ' ' }, NOW).ok).toBe(false);
    expect(validateNewApplication(seed, { ...base, grade: 7 }, NOW).ok).toBe(false);
    expect(validateNewApplication(seed, { ...base, guardianPhone: '12' }, NOW).ok).toBe(false);
  });
});
