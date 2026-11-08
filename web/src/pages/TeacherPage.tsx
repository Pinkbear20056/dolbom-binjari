import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Application, School, SchoolStatus } from '../../../shared/types';
import { markerState, vacancy } from '../../../shared/rules';
import { api, errorMessage } from '../lib/api';
import { LIVE_EVENTS, useLive, useNow } from '../lib/live';
import StatusBadge from '../components/StatusBadge';
import ApplicationRow from '../components/ApplicationRow';

const SCHOOL_EVENTS = [LIVE_EVENTS.schools, LIVE_EVENTS.reset];
const APP_EVENTS = [LIVE_EVENTS.applications, LIVE_EVENTS.reset];

const STATUS_OPTIONS: Array<{ value: SchoolStatus; label: string; labelEn: string; cls: string }> = [
  { value: 'closed', label: '마감', labelEn: 'Closed', cls: 'seg-red' },
  { value: 'check', label: '학교 확인 필요', labelEn: 'Check needed', cls: 'seg-yellow' },
  { value: 'open', label: '신청 가능', labelEn: 'Open', cls: 'seg-green' },
];

export default function TeacherPage() {
  const { schoolId = '' } = useParams();
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
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (schoolsLive.error) {
    return (
      <main className="page">
        <p className="form-error" role="alert">
          {schoolsLive.error}
        </p>
      </main>
    );
  }
  if (!school) {
    return (
      <main className="page">
        <Link to="/" className="back-link">
          ← 홈
        </Link>
        <p>{schoolsLive.loading ? '불러오는 중…' : `학교 "${schoolId}"를 찾을 수 없습니다.`}</p>
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
        <Link to="/" className="back-link">
          ← 홈
        </Link>
        <div>
          <h1>
            {school.name} <span className="muted small">돌봄전담사 화면</span>
          </h1>
          <p className="muted small" style={{ margin: 0 }}>
            {school.address} · 오후돌봄 교실 {school.classrooms}개
          </p>
        </div>
      </header>

      <section className="stat-grid" aria-label="현황 숫자">
        <div className="stat">
          <span className="stat-label">정원</span>
          <strong>{school.capacity}</strong>
        </div>
        <div className="stat">
          <span className="stat-label">현재 인원</span>
          <strong>{school.current}</strong>
        </div>
        <div className={`stat ${seats > 0 ? 'stat-good' : ''}`}>
          <span className="stat-label">정원상 빈자리</span>
          <strong>{seats}</strong>
        </div>
        <div className={`stat ${pending.length > 0 ? 'stat-attn' : ''}`}>
          <span className="stat-label">접수 중 신청</span>
          <strong>{pending.length}</strong>
        </div>
      </section>

      <section className="card">
        <div className="teacher-row">
          <div>
            <h2>학부모에게 보이는 상태</h2>
            <StatusBadge marker={marker} size="lg" />
          </div>
        </div>
        <p className="muted small">
          정원상 빈자리는 자동 계산됩니다. 신청 가능 여부는 아래에서 학교가 직접 정합니다. 빈자리가 있어도 "신청 가능"으로 바꾸기 전에는
          학부모에게 "학교 확인 필요"로 보입니다.
        </p>

        <h3>현재 인원</h3>
        <div className="counter">
          <button
            type="button"
            className="btn btn-ghost counter-btn"
            aria-label="현재 인원 1 줄이기"
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
            aria-label="현재 인원 1 늘리기"
            disabled={busy || school.current >= school.capacity}
            onClick={() => run(() => api.updateSchool(school.id, { current: school.current + 1 }))}
          >
            +
          </button>
        </div>

        <h3>신청 가능 여부</h3>
        <div className="segmented" role="radiogroup" aria-label="신청 가능 여부">
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
              <span>{opt.label}</span>
              <span className="seg-en">{opt.labelEn}</span>
            </button>
          ))}
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </section>

      <section className="card">
        <h2>
          신청 목록 <span className="muted small">접수 중 {pending.length} · 전체 {applications.length}</span>
        </h2>
        {appsLive.error && <p className="form-error">{appsLive.error}</p>}
        {sortedApps.length === 0 && <p className="muted">아직 들어온 신청이 없습니다.</p>}
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
