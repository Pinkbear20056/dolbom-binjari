import fs from 'node:fs';
import path from 'node:path';
import type { Db } from '../shared/types';

export interface Store {
  /** Current snapshot. Treat as immutable; use set() to replace it. */
  get(): Db;
  /** Replace the snapshot and persist it (when a file path is configured). */
  set(next: Db): void;
  /** Restore the seed and persist it. */
  reset(): Db;
}

export interface StoreOptions {
  /** JSON file to persist to. Omit for an in-memory store (tests). */
  filePath?: string;
  seed: () => Db;
}

/** Fields added after the first release. A db.json without them is from an older seed and is replaced. */
const REQUIRED_SCHOOL_FIELDS = ['nameEn', 'addressEn', 'waitlistNoteEn'] as const;

function hasCurrentSchoolShape(school: unknown): boolean {
  if (school === null || typeof school !== 'object') return false;
  const record = school as Record<string, unknown>;
  return REQUIRED_SCHOOL_FIELDS.every((field) => typeof record[field] === 'string');
}

function readFile(filePath: string): Db | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<Db>;
    if (!Array.isArray(parsed.schools) || !Array.isArray(parsed.applications) || !Array.isArray(parsed.bundles)) {
      return null;
    }
    if (!parsed.schools.every(hasCurrentSchoolShape)) {
      console.warn(`[store] ${filePath} was written by an older seed; re-seeding`);
      return null;
    }
    return parsed as Db;
  } catch (err) {
    console.error(`[store] could not read ${filePath}, falling back to seed:`, err);
    return null;
  }
}

function writeFile(filePath: string, db: Db): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmp, filePath);
}

export function createStore(options: StoreOptions): Store {
  const { filePath, seed } = options;
  let db: Db = (filePath ? readFile(filePath) : null) ?? seed();
  if (filePath) writeFile(filePath, db);

  return {
    get: () => db,
    set: (next) => {
      db = next;
      if (filePath) writeFile(filePath, db);
    },
    reset: () => {
      db = seed();
      if (filePath) writeFile(filePath, db);
      return db;
    },
  };
}
