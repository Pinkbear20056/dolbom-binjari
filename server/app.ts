import express from 'express';
import type { Store } from './store';

export type Emit = (event: string, payload: unknown) => void;

/** Builds the Express app. Socket.IO broadcasting is injected so tests can run without sockets. */
export function createApp(store: Store, emit: Emit = () => {}): express.Express {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/bundles', (_req, res) => {
    res.json(store.get().bundles);
  });

  app.get('/api/schools', (_req, res) => {
    res.json(store.get().schools);
  });

  app.post('/api/reset', (_req, res) => {
    const db = store.reset();
    emit('db:reset', { schools: db.schools, applications: db.applications });
    res.json({ ok: true });
  });

  return app;
}
