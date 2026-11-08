/**
 * Pure business rules for 돌봄. No I/O, no framework imports.
 * Every function returns new objects and never mutates its inputs.
 */
import type { Application, ApplicationKind, Db, NewApplicationInput, School } from './types';

export const STALE_AFTER_MS = 24 * 60 * 60 * 1000;
export const MIN_GRADE = 1;
export const MAX_GRADE = 6;
const PHONE_PATTERN = /^\d{2,3}-\d{3,4}-\d{4}$/;

export type Result<T> = { ok: true; value: T } | { ok: false; code: string; message: string };

const fail = <T>(code: string, message: string): Result<T> => ({ ok: false, code, message });
const succeed = <T>(value: T): Result<T> => ({ ok: true, value });

/** 정원상 빈자리: capacity − current, floored at 0. Automatic; says nothing about whether the school accepts anyone. */
export function vacancy(school: Pick<School, 'capacity' | 'current'>): number {
  return Math.max(0, school.capacity - school.current);
}

export function isStale(school: Pick<School, 'updatedAt'>, now: Date): boolean {
  const updated = Date.parse(school.updatedAt);
  if (Number.isNaN(updated)) return true;
  return now.getTime() - updated > STALE_AFTER_MS;
}

export type MarkerLevel = 'stale' | 'closed' | 'check' | 'open';
export type MarkerColor = 'grey' | 'red' | 'yellow' | 'green';
export type ParentAction = 'none' | 'waitlist' | 'inquire' | 'apply';

export interface MarkerState {
  level: MarkerLevel;
  color: MarkerColor;
  /** Always shown next to the colour (never colour alone). */
  label: string;
  labelEn: string;
  action: ParentAction;
  actionLabel: string | null;
  actionLabelEn: string | null;
}

const MARKERS: Record<MarkerLevel, MarkerState> = {
  stale: {
    level: 'stale', color: 'grey', label: '정보 갱신 안 됨', labelEn: 'Not updated',
    action: 'none', actionLabel: null, actionLabelEn: null,
  },
  closed: {
    level: 'closed', color: 'red', label: '마감', labelEn: 'Full / closed',
    action: 'waitlist', actionLabel: '대기 안내', actionLabelEn: 'Waitlist info',
  },
  check: {
    level: 'check', color: 'yellow', label: '학교 확인 필요', labelEn: 'School check needed',
    action: 'inquire', actionLabel: '이용 가능 여부 문의', actionLabelEn: 'Ask about availability',
  },
  open: {
    level: 'open', color: 'green', label: '신청 가능', labelEn: 'Open to apply',
    action: 'apply', actionLabel: '신청하기', actionLabelEn: 'Apply',
  },
};

/**
 * Marker rules, applied top to bottom:
 * 1. updatedAt older than 24h → stale (grey, no parent button)
 * 2. vacancy 0 or status closed → closed (red, "대기 안내")
 * 3. status check → check (yellow, "이용 가능 여부 문의")
 * 4. status open → open (green, "신청하기")
 */
export function markerState(school: School, now: Date): MarkerState {
  if (isStale(school, now)) return MARKERS.stale;
  if (vacancy(school) === 0 || school.status === 'closed') return MARKERS.closed;
  if (school.status === 'check') return MARKERS.check;
  return MARKERS.open;
}

/** Schools in the same bundle as `schoolId` (including itself), in input order. */
export function schoolsInBundle(schools: readonly School[], schoolId: string): School[] {
  const home = schools.find((s) => s.id === schoolId);
  if (!home) return [];
  return schools.filter((s) => s.bundleId === home.bundleId);
}

const normalizeName = (name: string): string => name.trim().replace(/\s+/g, '');
const normalizePhone = (phone: string): string => phone.replace(/\D/g, '');

/** A pending application with the same child name and guardian phone already exists. */
export function isDuplicateApplication(
  applications: readonly Application[],
  childName: string,
  guardianPhone: string,
): boolean {
  const name = normalizeName(childName);
  const phone = normalizePhone(guardianPhone);
  return applications.some(
    (a) => a.status === 'pending' && normalizeName(a.childName) === name && normalizePhone(a.guardianPhone) === phone,
  );
}

export interface ValidatedApplication {
  school: School;
  homeSchool: School;
  kind: ApplicationKind;
  childName: string;
  grade: number;
  guardianPhone: string;
}

/** Validates a parent's request. Returns the application kind ('apply' for open, 'inquiry' for check). */
export function validateNewApplication(
  db: Pick<Db, 'schools' | 'applications'>,
  input: NewApplicationInput,
  now: Date,
): Result<ValidatedApplication> {
  const school = db.schools.find((s) => s.id === input.schoolId);
  if (!school) return fail('UNKNOWN_SCHOOL', '신청할 학교를 찾을 수 없습니다.');
  const homeSchool = db.schools.find((s) => s.id === input.homeSchoolId);
  if (!homeSchool) return fail('UNKNOWN_HOME_SCHOOL', '우리 학교를 찾을 수 없습니다.');
  if (school.bundleId !== homeSchool.bundleId) {
    return fail('OUT_OF_BUNDLE', '같은 묶음 안의 학교에만 신청할 수 있습니다.');
  }

  const childName = input.childName?.trim() ?? '';
  if (childName.length === 0) return fail('INVALID_NAME', '아이 이름을 입력해 주세요.');
  if (!Number.isInteger(input.grade) || input.grade < MIN_GRADE || input.grade > MAX_GRADE) {
    return fail('INVALID_GRADE', `학년은 ${MIN_GRADE}~${MAX_GRADE} 사이여야 합니다.`);
  }
  const guardianPhone = input.guardianPhone?.trim() ?? '';
  if (!PHONE_PATTERN.test(guardianPhone)) {
    return fail('INVALID_PHONE', '보호자 연락처 형식이 올바르지 않습니다 (예: 010-1234-5678).');
  }

  const marker = markerState(school, now);
  if (marker.action !== 'apply' && marker.action !== 'inquire') {
    return fail('NOT_ACCEPTING', `${school.name}은(는) 지금 신청을 받지 않습니다 (${marker.label}).`);
  }
  if (isDuplicateApplication(db.applications, childName, guardianPhone)) {
    return fail('DUPLICATE', '같은 아이 이름과 보호자 연락처로 접수 중인 신청이 이미 있습니다.');
  }

  return succeed({
    school,
    homeSchool,
    kind: marker.action === 'apply' ? 'apply' : 'inquiry',
    childName,
    grade: input.grade,
    guardianPhone,
  });
}

export function createApplication(validated: ValidatedApplication, id: string, now: Date): Application {
  const ts = now.toISOString();
  return {
    id,
    schoolId: validated.school.id,
    homeSchoolId: validated.homeSchool.id,
    kind: validated.kind,
    childName: validated.childName,
    grade: validated.grade,
    guardianPhone: validated.guardianPhone,
    status: 'pending',
    rejectReason: null,
    createdAt: ts,
    updatedAt: ts,
  };
}

/** 승인: current + 1 (refused at capacity), application → approved. */
export function approveApplication(
  school: School,
  application: Application,
  now: Date,
): Result<{ school: School; application: Application }> {
  if (application.schoolId !== school.id) return fail('WRONG_SCHOOL', '이 학교의 신청이 아닙니다.');
  if (application.status !== 'pending') return fail('NOT_PENDING', '이미 처리된 신청입니다.');
  if (school.current >= school.capacity) return fail('FULL', '정원이 가득 차서 승인할 수 없습니다.');
  const ts = now.toISOString();
  return succeed({
    school: { ...school, current: school.current + 1, updatedAt: ts },
    application: { ...application, status: 'approved', updatedAt: ts },
  });
}

/** 반려: reason is required. */
export function rejectApplication(application: Application, reason: string, now: Date): Result<Application> {
  const trimmed = reason?.trim() ?? '';
  if (trimmed.length === 0) return fail('REASON_REQUIRED', '반려 사유를 입력해 주세요.');
  if (application.status !== 'pending') return fail('NOT_PENDING', '이미 처리된 신청입니다.');
  return succeed({ ...application, status: 'rejected', rejectReason: trimmed, updatedAt: now.toISOString() });
}

/** Teacher updates to a school. Clamps current to [0, capacity] and refreshes updatedAt. */
export function updateSchool(
  school: School,
  patch: Partial<Pick<School, 'current' | 'status'>>,
  now: Date,
): Result<School> {
  const next: School = { ...school, updatedAt: now.toISOString() };
  if (patch.current !== undefined) {
    if (!Number.isInteger(patch.current)) return fail('INVALID_CURRENT', '현재 인원은 정수여야 합니다.');
    next.current = Math.min(school.capacity, Math.max(0, patch.current));
  }
  if (patch.status !== undefined) {
    if (patch.status !== 'closed' && patch.status !== 'check' && patch.status !== 'open') {
      return fail('INVALID_STATUS', '상태는 closed, check, open 중 하나여야 합니다.');
    }
    next.status = patch.status;
  }
  return succeed(next);
}
