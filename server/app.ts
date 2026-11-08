import express, { type Request, type Response } from 'express';
import { randomUUID } from 'node:crypto';
import type { Store } from './store';
import type { Application, Db, NewApplicationInput, School, SchoolStatus } from '../shared/types';
import {
  approveApplication,
  createApplication,
  rejectApplication,
  schoolsInBundle,
  updateSchool,
  validateNewApplication,
  type Result,
} from '../shared/rules';

export type Emit = (event: string, payload: unknown) => void;
export type Clock = () => Date;

/** Socket.IO event names. The web client listens for these. */
export const EVENTS = {
  schoolsChanged: 'schools:changed',
  applicationsChanged: 'applications:changed',
  reset: 'db:reset',
} as const;

const HTTP_BY_CODE: Record<string, number> = { FULL: 409, NOT_PENDING: 409 };

function sendFailure(res: Response, result: Extract<Result<unknown>, { ok: false }>): void {
  res.status(HTTP_BY_CODE[result.code] ?? 400).json({ code: result.code, message: result.message });
}

function parseApplicationBody(body: unknown): NewApplicationInput | null {
  if (typeof body !== 'object' || body === null) return null;
  const b = body as Record<string, unknown>;
  if (typeof b.schoolId !== 'string' || typeof b.homeSchoolId !== 'string') return null;
  if (typeof b.childName !== 'string' || typeof b.guardianPhone !== 'string') return null;
  const grade = typeof b.grade === 'number' ? b.grade : Number(b.grade);
  if (!Number.isFinite(grade)) return null;
  return { schoolId: b.schoolId, homeSchoolId: b.homeSchoolId, childName: b.childName, guardianPhone: b.guardianPhone, grade };
}

function replaceSchool(db: Db, school: School): Db {
  return { ...db, schools: db.schools.map((s) => (s.id === school.id ? school : s)) };
}

function replaceApplication(db: Db, application: Application): Db {
  return { ...db, applications: db.applications.map((a) => (a.id === application.id ? application : a)) };
}

/** Builds the Express app. Broadcasting and the clock are injected so tests run without sockets or real time. */
export function createApp(store: Store, emit: Emit = () => {}, clock: Clock = () => new Date()): express.Express {
  const app = express();
  app.use(express.json());

  const emitSchools = (db: Db) => emit(EVENTS.schoolsChanged, db.schools);
  const emitApplications = (db: Db) => emit(EVENTS.applicationsChanged, db.applications);

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, now: clock().toISOString() });
  });

  app.get('/api/bundles', (_req, res) => {
    res.json(store.get().bundles);
  });

  app.get('/api/schools', (_req, res) => {
    res.json(store.get().schools);
  });

  /** Schools in the same bundle as ?schoolId= (the caller's own school). */
  app.get('/api/bundle', (req: Request, res: Response) => {
    const schoolId = typeof req.query.schoolId === 'string' ? req.query.schoolId : '';
    const db = store.get();
    const schools = schoolsInBundle(db.schools, schoolId);
    if (schools.length === 0) {
      res.status(404).json({ code: 'UNKNOWN_SCHOOL', message: '학교를 찾을 수 없습니다.' });
      return;
    }
    const bundle = db.bundles.find((b) => b.id === schools[0].bundleId) ?? null;
    res.json({ bundle, schools });
  });

  app.get('/api/schools/:id/applications', (req, res) => {
    const db = store.get();
    if (!db.schools.some((s) => s.id === req.params.id)) {
      res.status(404).json({ code: 'UNKNOWN_SCHOOL', message: '학교를 찾을 수 없습니다.' });
      return;
    }
    res.json(db.applications.filter((a) => a.schoolId === req.params.id));
  });

  app.patch('/api/schools/:id', (req, res) => {
    const db = store.get();
    const school = db.schools.find((s) => s.id === req.params.id);
    if (!school) {
      res.status(404).json({ code: 'UNKNOWN_SCHOOL', message: '학교를 찾을 수 없습니다.' });
      return;
    }
    const body = (typeof req.body === 'object' && req.body !== null ? req.body : {}) as Record<string, unknown>;
    const patch: { current?: number; status?: SchoolStatus } = {};
    if (body.current !== undefined) patch.current = Number(body.current);
    if (body.status !== undefined) patch.status = body.status as SchoolStatus;
    const result = updateSchool(school, patch, clock());
    if (!result.ok) {
      sendFailure(res, result);
      return;
    }
    const next = replaceSchool(db, result.value);
    store.set(next);
    emitSchools(next);
    res.json(result.value);
  });

  /** Parent's "내 신청": ?ids=a,b,c (ids are stored in the phone's localStorage). */
  app.get('/api/applications', (req, res) => {
    const raw = typeof req.query.ids === 'string' ? req.query.ids : '';
    const ids = new Set(raw.split(',').map((s) => s.trim()).filter(Boolean));
    res.json(store.get().applications.filter((a) => ids.has(a.id)));
  });

  app.post('/api/applications', (req, res) => {
    const input = parseApplicationBody(req.body);
    if (!input) {
      res.status(400).json({ code: 'INVALID_BODY', message: '신청 내용이 올바르지 않습니다.' });
      return;
    }
    const db = store.get();
    const now = clock();
    const validated = validateNewApplication(db, input, now);
    if (!validated.ok) {
      sendFailure(res, validated);
      return;
    }
    const application = createApplication(validated.value, randomUUID(), now);
    const next: Db = { ...db, applications: [...db.applications, application] };
    store.set(next);
    emitApplications(next);
    res.status(201).json(application);
  });

  app.post('/api/applications/:id/approve', (req, res) => {
    const db = store.get();
    const application = db.applications.find((a) => a.id === req.params.id);
    const school = application && db.schools.find((s) => s.id === application.schoolId);
    if (!application || !school) {
      res.status(404).json({ code: 'UNKNOWN_APPLICATION', message: '신청을 찾을 수 없습니다.' });
      return;
    }
    const result = approveApplication(school, application, clock());
    if (!result.ok) {
      sendFailure(res, result);
      return;
    }
    const next = replaceApplication(replaceSchool(db, result.value.school), result.value.application);
    store.set(next);
    emitSchools(next);
    emitApplications(next);
    res.json(result.value);
  });

  app.post('/api/applications/:id/reject', (req, res) => {
    const db = store.get();
    const application = db.applications.find((a) => a.id === req.params.id);
    if (!application) {
      res.status(404).json({ code: 'UNKNOWN_APPLICATION', message: '신청을 찾을 수 없습니다.' });
      return;
    }
    const reason = typeof req.body?.reason === 'string' ? req.body.reason : '';
    const result = rejectApplication(application, reason, clock());
    if (!result.ok) {
      sendFailure(res, result);
      return;
    }
    const next = replaceApplication(db, result.value);
    store.set(next);
    emitApplications(next);
    res.json(result.value);
  });

  app.post('/api/reset', (_req, res) => {
    const db = store.reset();
    emit(EVENTS.reset, { schools: db.schools, applications: db.applications });
    res.json({ ok: true });
  });

  return app;
}
