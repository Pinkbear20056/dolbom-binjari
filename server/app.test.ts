import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createSeed } from '../shared/seed';
import { createStore } from './store';
import { createApp } from './app';

const NOW = new Date('2026-11-08T10:00:00Z');

function setup() {
  const store = createStore({ seed: () => createSeed(NOW) });
  const events: Array<{ event: string; payload: unknown }> = [];
  const app = createApp(store, (event, payload) => events.push({ event, payload }), () => NOW);
  return { store, events, api: request(app) };
}

let ctx: ReturnType<typeof setup>;
beforeEach(() => {
  ctx = setup();
});

const validBody = { schoolId: 'wadong', homeSchoolId: 'cheongam', childName: '이바다', grade: 3, guardianPhone: '010-1234-5678' };

describe('GET /api/bundle', () => {
  it('returns only the schools in the same bundle', async () => {
    const res = await ctx.api.get('/api/bundle?schoolId=cheongam');
    expect(res.status).toBe(200);
    expect(res.body.bundle.id).toBe('unjeong');
    expect(res.body.schools.map((s: { id: string }) => s.id)).toEqual(['cheongam', 'gaon', 'wadong', 'jisan']);
  });
  it('404s for an unknown school', async () => {
    const res = await ctx.api.get('/api/bundle?schoolId=nope');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/applications', () => {
  it('creates a pending application and broadcasts it', async () => {
    const res = await ctx.api.post('/api/applications').send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('pending');
    expect(res.body.kind).toBe('apply');
    expect(ctx.store.get().applications.some((a) => a.id === res.body.id)).toBe(true);
    expect(ctx.events.map((e) => e.event)).toContain('applications:changed');
  });
  it('creates an inquiry for a "check" school', async () => {
    const res = await ctx.api.post('/api/applications').send({ ...validBody, schoolId: 'gaon' });
    expect(res.status).toBe(201);
    expect(res.body.kind).toBe('inquiry');
  });
  it('rejects a school outside the bundle with 400 and a reason', async () => {
    const res = await ctx.api.post('/api/applications').send({ ...validBody, schoolId: 'munsan' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('OUT_OF_BUNDLE');
    expect(typeof res.body.message).toBe('string');
  });
  it('rejects duplicates (seed already has 김하늘 / 010-0000-0000 pending)', async () => {
    const res = await ctx.api
      .post('/api/applications')
      .send({ ...validBody, childName: '김하늘', guardianPhone: '010-0000-0000' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('DUPLICATE');
  });
  it('rejects a malformed body', async () => {
    const res = await ctx.api.post('/api/applications').send({ schoolId: 'wadong' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/applications?ids=', () => {
  it('returns the requested applications only', async () => {
    const created = await ctx.api.post('/api/applications').send(validBody);
    const res = await ctx.api.get(`/api/applications?ids=${created.body.id},seed-app-1,missing`);
    expect(res.status).toBe(200);
    expect(res.body.map((a: { id: string }) => a.id).sort()).toEqual([created.body.id, 'seed-app-1'].sort());
  });
  it('returns an empty list without ids', async () => {
    const res = await ctx.api.get('/api/applications');
    expect(res.body).toEqual([]);
  });
});

describe('GET /api/schools/:id/applications', () => {
  it('lists the applications for a school', async () => {
    const res = await ctx.api.get('/api/schools/wadong/applications');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe('seed-app-1');
  });
});

describe('PATCH /api/schools/:id', () => {
  it('updates current and status, refreshes updatedAt, and broadcasts', async () => {
    const res = await ctx.api.patch('/api/schools/gaon').send({ current: 75, status: 'open' });
    expect(res.status).toBe(200);
    expect(res.body.current).toBe(75);
    expect(res.body.status).toBe('open');
    expect(res.body.updatedAt).toBe(NOW.toISOString());
    expect(ctx.events.map((e) => e.event)).toContain('schools:changed');
  });
  it('rejects an invalid status', async () => {
    const res = await ctx.api.patch('/api/schools/gaon').send({ status: 'maybe' });
    expect(res.status).toBe(400);
  });
  it('404s for an unknown school', async () => {
    const res = await ctx.api.patch('/api/schools/none').send({ current: 1 });
    expect(res.status).toBe(404);
  });
});

describe('approve / reject', () => {
  it('approve adds one to current and marks approved', async () => {
    const created = await ctx.api.post('/api/applications').send({ ...validBody, schoolId: 'gaon' });
    const res = await ctx.api.post(`/api/applications/${created.body.id}/approve`);
    expect(res.status).toBe(200);
    expect(res.body.application.status).toBe('approved');
    expect(res.body.school.current).toBe(78);
    const events = ctx.events.map((e) => e.event);
    expect(events).toContain('schools:changed');
    expect(events).toContain('applications:changed');
  });
  it('approve refuses when the school is full', async () => {
    await ctx.api.patch('/api/schools/wadong').send({ current: 80 });
    const res = await ctx.api.post('/api/applications/seed-app-1/approve');
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('FULL');
  });
  it('reject requires a reason', async () => {
    const res = await ctx.api.post('/api/applications/seed-app-1/reject').send({ reason: '' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('REASON_REQUIRED');
  });
  it('reject stores the reason', async () => {
    const res = await ctx.api.post('/api/applications/seed-app-1/reject').send({ reason: '거주지 기준 미충족' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('rejected');
    expect(res.body.rejectReason).toBe('거주지 기준 미충족');
  });
  it('404s for an unknown application', async () => {
    const res = await ctx.api.post('/api/applications/none/approve');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/reset', () => {
  it('restores the seed and broadcasts', async () => {
    await ctx.api.patch('/api/schools/gaon').send({ current: 10 });
    const res = await ctx.api.post('/api/reset');
    expect(res.status).toBe(200);
    expect(ctx.store.get().schools.find((s) => s.id === 'gaon')?.current).toBe(77);
    expect(ctx.events.map((e) => e.event)).toContain('db:reset');
  });
});
