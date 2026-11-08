import { isLang, type Lang } from './i18n';

/** localStorage helpers. Everything is per device; there is no login in this demo. */

const KEYS = {
  myApplicationIds: 'dolbom.myApplicationIds',
  homeSchoolId: 'dolbom.homeSchoolId',
  grade: 'dolbom.grade',
  lang: 'dolbom.lang',
} as const;

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* private mode or blocked storage: the app still works for this session */
  }
}

export const storage = {
  getMyApplicationIds(): string[] {
    try {
      const parsed = JSON.parse(read(KEYS.myApplicationIds) ?? '[]') as unknown;
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
    } catch {
      return [];
    }
  },
  addMyApplicationId(id: string): string[] {
    const next = [...new Set([...storage.getMyApplicationIds(), id])];
    write(KEYS.myApplicationIds, JSON.stringify(next));
    return next;
  },
  clearMyApplicationIds(): void {
    write(KEYS.myApplicationIds, null);
  },
  getHomeSchoolId: () => read(KEYS.homeSchoolId),
  setHomeSchoolId: (id: string | null) => write(KEYS.homeSchoolId, id),
  getGrade(): number | null {
    const g = Number(read(KEYS.grade));
    return Number.isInteger(g) && g >= 1 && g <= 6 ? g : null;
  },
  setGrade: (grade: number | null) => write(KEYS.grade, grade === null ? null : String(grade)),
  getLang(): Lang | null {
    const v = read(KEYS.lang);
    return isLang(v) ? v : null;
  },
  setLang: (lang: Lang) => write(KEYS.lang, lang),
};
