import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { errorMessage } from './api';

/** Event names emitted by the server (see server/app.ts EVENTS). */
export const LIVE_EVENTS = {
  schools: 'schools:changed',
  applications: 'applications:changed',
  reset: 'db:reset',
} as const;

let socket: Socket | null = null;

/** One shared Socket.IO connection per page. Same origin; Vite proxies /socket.io in dev. */
export function getSocket(): Socket {
  if (!socket) socket = io({ path: '/socket.io', transports: ['websocket', 'polling'] });
  return socket;
}

export interface LiveState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

/**
 * Fetches once, then refetches whenever the server emits any of `events`
 * or when `cacheKey` changes. Refetching (instead of patching from the payload)
 * keeps every screen consistent with one source of truth.
 */
export function useLive<T>(fetcher: () => Promise<T>, events: readonly string[], cacheKey = ''): LiveState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  const fetcherRef = useRef(fetcher);
  const eventsKey = events.join('|');

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    fetcherRef
      .current()
      .then((d) => {
        if (cancelled) return;
        setData(d);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(errorMessage(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [version, cacheKey]);

  useEffect(() => {
    const s = getSocket();
    const handler = () => reload();
    const names = eventsKey.split('|').filter(Boolean);
    for (const ev of names) s.on(ev, handler);
    s.on('connect', handler);
    return () => {
      for (const ev of names) s.off(ev, handler);
      s.off('connect', handler);
    };
  }, [reload, eventsKey]);

  return { data, error, loading, reload };
}

/** Re-renders every `intervalMs` so "stale after 24h" flips without a reload. */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
