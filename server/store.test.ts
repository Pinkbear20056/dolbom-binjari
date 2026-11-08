import { afterEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createStore } from './store';
import { createSeed } from '../shared/seed';

const tmpFiles: string[] = [];
function tmpPath(): string {
  const p = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'dolbom-store-')), 'db.json');
  tmpFiles.push(p);
  return p;
}

afterEach(() => {
  for (const p of tmpFiles.splice(0)) fs.rmSync(path.dirname(p), { recursive: true, force: true });
});

describe('store', () => {
  it('keeps a saved db.json that has the current school shape', () => {
    const file = tmpPath();
    const first = createStore({ filePath: file, seed: () => createSeed() });
    const edited = { ...first.get(), schools: first.get().schools.map((s) => (s.id === 'gaon' ? { ...s, current: 10 } : s)) };
    first.set(edited);

    const second = createStore({ filePath: file, seed: () => createSeed() });
    expect(second.get().schools.find((s) => s.id === 'gaon')?.current).toBe(10);
  });

  it('re-seeds when db.json was written by an older seed without the English fields', () => {
    const file = tmpPath();
    const seed = createSeed();
    const old = {
      ...seed,
      schools: seed.schools.map((s) => {
        const copy: Record<string, unknown> = { ...s, current: 1, status: 'closed' };
        delete copy.addressEn;
        delete copy.waitlistNoteEn;
        return copy;
      }),
    };
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify(old), 'utf8');

    const store = createStore({ filePath: file, seed: () => createSeed() });
    const gaon = store.get().schools.find((s) => s.id === 'gaon');
    expect(gaon?.current).toBe(77);
    expect(gaon?.status).toBe('check');
    expect(gaon?.addressEn).toContain('Gaon-ro');
  });
});
