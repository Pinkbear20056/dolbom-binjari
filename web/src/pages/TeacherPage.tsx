import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Application, School, SchoolStatus } from '../../../shared/types';
import { markerState, vacancy } from '../../../shared/rules';
import { api, errorMessage } from '../lib/api';
import { LIVE_EVENTS, useLive, useNow } from '../lib/live';
import { useLang } from '../lib/LangContext';
import { schoolName } from '../lib/i18n';
import StatusBadge from '../components/StatusBadge';
import ApplicationRow from '../components/ApplicationRow';

const SCHOOL_EVENTS = [LIVE_EVENTS.schools, LIVE_EVENTS.reset];
const APP_EVENTS = [LIVE_EVENTS.applications, LIVE_EVENTS.reset];

const STATUS_OPTIONS: Array<{ value: SchoolStatus; cls: string }> = [
  { value: 'closed', cls: 'seg-red' },
  { value: 'check', cls: 'seg-yellow' },
  { value: 'open', cls: 'seg-green' },
];

export default function TeacherPage() {
  const { schoolId = '' } = useParams();
  const { lang, t } = useLang();
  const now = useNow();
  const schoolsLive = useLive(() => api.schools(), SCHOOL_EVENTS);
  const appsLive = useLive(() => api.schoolApplications(schoolId), APP_EVENTS, schoolId);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const schools: School[] = schoolsLive.data ?? [];
  const school = schools.find((s) => s.id === schoolId) ?? null;
  const applications: Application[] = appsLive.data ?? [];
  const pending = applications.filter((a) => a.status === 'pending');

  async function run(action: () => Promise<unknown>) {
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError(errorMessage(err, lang));
    } finally {
      setBusy(false);
    }
  }

  if (schoolsLive.error) {
    return (
      <main className="page">
        <p className="form-error" role="alert">
          {errorMessage(schoolsLive.error, lang)}
        </p>
      </main>
    );
  }
  if (!school) {
    return (
      <main className="page">
        <Link to="/" className="back-link">
          {t.backHome}
        </Link>
        <p>{schoolsLive.loading ? t.loading : t.schoolNotFound(schoolId)}</p>
      </main>
    );
  }

  const marker = markerState(school, now);
  const seats = vacancy(school);
  const sortedApps = [...applications].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <main className="page teacher-page">
      <header className="page-head">
        <div>
          <h1>{schoolName(school, lang)}</h1>
          <p className="muted small">
            {school.address} · {t.classrooms(school.classrooms)}
          </p>
        </div>
        <StatusBadge marker={marker} />
      </header>

      <section className="stat-grid" aria-label={t.statsAria}>
        <div className="stat">
          <span className="stat-label">{t.capacity}</span>
          <strong>{t.people(school.capacity)}</strong>
        </div>
        <div className="stat">
          <span className="stat-label">{t.current}</span>
          <strong>{t.people(school.current)}</strong>
        </div>
        <div className={`stat ${seats > 0 ? 'stat-good' : ''}`}>
          <span className="stat-label">{t.seats}</span>
          <strong>{t.people(seats)}</strong>
        </div>
        <div className={`stat ${pending.length > 0 ? 'stat-attn' : ''}`}>
          <span className="stat-label">{t.toReview}</span>
          <strong>{t.cases(pending.length)}</strong>
        </div>
      </section>

      <section className="card teacher-settings">
        <h2>{t.settingsTitle}</h2>
        <p className="muted small">{t.settingsText}</p>

        <div className="teacher-controls">
          <div>
            <h3>{t.enrolledTitle}</h3>
            <div className="counter">
              <button
                type="button"
                className="btn btn-ghost counter-btn"
                aria-label={t.decAria}
                disabled={busy || school.current <= 0}
                onClick={() => run(() => api.updateSchool(school.id, { current: school.current - 1 }))}
              >
                −
              </button>
              <output className="counter-value" aria-live="polite">
                {school.current} <span className="muted small">/ {school.capacity}</span>
              </output>
              <button
                type="button"
                className="btn btn-ghost counter-btn"
                aria-label={t.incAria}
                disabled={busy || school.current >= school.capacity}
                onClick={() => run(() => api.updateSchool(school.id, { current: school.current + 1 }))}
              >
                +
              </button>
            </div>
          </div>
          <div>
            <h3>{t.acceptingTitle}</h3>
            <div className="segmented" role="radiogroup" aria-label={t.acceptingAria}>
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={school.status === opt.value}
                  className={`seg ${opt.cls} ${school.status === opt.value ? 'is-active' : ''}`}
                  disabled={busy}
                  onClick={() => run(() => api.updateSchool(school.id, { status: opt.value }))}
                >
                  <span>{t.marker[opt.value]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </section>

      <section className="card">
        <h2>
          {t.listTitle} <span className="muted small">{t.listSummary(pending.length, applications.length)}</span>
        </h2>
        {appsLive.error != null && <p className="form-error">{errorMessage(appsLive.error, lang)}</p>}
        {sortedApps.length === 0 && <p className="muted">{t.noApps}</p>}
        <ul className="app-list">
          {sortedApps.map((a) => (
            <ApplicationRow
              key={a.id}
              application={a}
              homeSchool={schools.find((s) => s.id === a.homeSchoolId) ?? null}
              seatsLeft={seats}
              busy={busy}
              onApprove={() => run(() => api.approve(a.id))}
              onReject={(reason) => run(() => api.reject(a.id, reason))}
            />
          ))}
        </ul>
      </section>
    </main>
  );
}
