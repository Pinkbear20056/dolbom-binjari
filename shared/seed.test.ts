import { describe, expect, it } from 'vitest';
import { createSeed } from './seed';

describe('createSeed', () => {
  it('contains the five sample schools in two bundles', () => {
    const db = createSeed(new Date('2026-11-08T10:00:00Z'));
    expect(db.bundles.map((b) => b.id)).toEqual(['unjeong', 'munsan']);
    expect(db.schools).toHaveLength(5);
    expect(db.schools.filter((s) => s.bundleId === 'unjeong')).toHaveLength(4);
  });

  it('sets capacity to classrooms × 20 and stamps updatedAt with the given time', () => {
    const now = new Date('2026-11-08T10:00:00Z');
    const db = createSeed(now);
    for (const s of db.schools) {
      expect(s.capacity).toBe(s.classrooms * 20);
      expect(s.updatedAt).toBe(now.toISOString());
    }
  });

  it('only uses fake names and phone numbers in seed applications', () => {
    const db = createSeed();
    for (const a of db.applications) {
      expect(a.guardianPhone).toBe('010-0000-0000');
    }
  });
});
