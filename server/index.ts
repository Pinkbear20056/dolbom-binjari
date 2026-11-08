import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { Server as SocketServer } from 'socket.io';
import { createSeed } from '../shared/seed';
import { createStore } from './store';
import { createApp } from './app';

const PORT = Number(process.env.PORT ?? 3001);
const here = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.join(here, 'data', 'db.json');
const webDist = path.resolve(here, '..', 'web', 'dist');

// Seed timestamps are set at server start so the demo never turns grey ("stale") mid-session.
const store = createStore({ filePath: dataFile, seed: () => createSeed(new Date()) });

const httpServer = http.createServer();
const io = new SocketServer(httpServer, { cors: { origin: true } });
const app = createApp(store, (event, payload) => io.emit(event, payload));

if (fs.existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get(/^\/(?!api\/|socket\.io\/).*/, (_req, res) => {
    res.sendFile(path.join(webDist, 'index.html'));
  });
}

httpServer.on('request', app);
httpServer.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT} (data: ${dataFile})`);
});
