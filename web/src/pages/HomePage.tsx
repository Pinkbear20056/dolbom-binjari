import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { School } from '../../../shared/types';
import { api, errorMessage } from '../lib/api';
import { LIVE_EVENTS, useLive } from '../lib/live';
import { storage } from '../lib/storage';

const SCHOOL_EVENTS = [LIVE_EVENTS.schools, LIVE_EVENTS.reset];

export default function HomePage() {
  const navigate = useNavigate();
  const schoolsLive = useLive(() => api.schools(), SCHOOL_EVENTS);
  const schools: School[] = schoolsLive.data ?? [];
  const [teacherSchool, setTeacherSchool] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function resetData() {
    setBusy(true);
    setMessage(null);
    try {
      await api.reset();
      storage.clearMyApplicationIds();
      setMessage('예시 데이터를 처음 상태로 되돌렸습니다. 이 기기의 "내 신청" 기록도 지웠습니다.');
    } catch (err) {
      setMessage(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page home">
      <section className="hero">
        <p className="eyebrow">돌봄빈자리 · Dolbom Binjari</p>
        <h1>돌봄 시설을 새로 짓지 않고, 이미 있는 돌봄교실 자리를 연결합니다.</h1>
        <p className="muted">
          우리 학교 돌봄교실이 마감이어도, 가까운 학교 묶음 안에 빈자리가 있으면 바로 보고 신청할 수 있습니다. 학교는 규정을 확인한 뒤
          승인하거나 반려합니다.
        </p>
      </section>

      <section className="card role-card">
        <h2>학부모로 보기</h2>
        <p className="muted small">폰에서 보세요. 우리 학교를 고르면 같은 묶음 학교의 현황이 지도와 목록으로 나옵니다.</p>
        <Link className="btn btn-primary btn-wide" to="/parent">
          학부모 화면 열기
        </Link>
      </section>

      <section className="card role-card">
        <h2>선생님으로 보기</h2>
        <p className="muted small">돌봄전담사 화면입니다. 학교를 고르세요. PC·태블릿에 맞춰져 있고 폰에서도 됩니다.</p>
        <div className="role-row">
          <label className="field" style={{ flex: 1, marginBottom: 0 }}>
            <span>학교 선택</span>
            <select value={teacherSchool} onChange={(e) => setTeacherSchool(e.target.value)} aria-label="선생님 화면 학교 선택">
              <option value="">학교를 고르세요</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={!teacherSchool}
            onClick={() => navigate(`/teacher/${teacherSchool}`)}
          >
            선생님 화면 열기
          </button>
        </div>
      </section>

      <section className="card how">
        <h2>어떻게 다른가요?</h2>
        <ul>
          <li>
            <strong>정원상 빈자리</strong>는 정원에서 현재 인원을 뺀 숫자입니다. 자동으로 계산됩니다.
          </li>
          <li>
            <strong>신청 가능 여부</strong>는 학교가 정합니다. 빈자리가 있어도 학교가 "신청 가능"으로 바꾸기 전에는{' '}
            <em>학교 확인 필요</em>로 보입니다.
          </li>
          <li>학부모는 같은 묶음 안 학교에만 신청할 수 있고, 학교는 승인하거나 사유를 적어 반려합니다.</li>
        </ul>
      </section>

      {schoolsLive.error && (
        <p className="form-error" role="alert">
          {schoolsLive.error}
        </p>
      )}

      <section className="reset-area">
        <button type="button" className="btn btn-ghost" onClick={resetData} disabled={busy}>
          {busy ? '되돌리는 중…' : '데이터 초기화 (예시 데이터로 되돌리기)'}
        </button>
        {message && (
          <p className="muted small" role="status">
            {message}
          </p>
        )}
        <p className="muted small">
          예시 데이터입니다. 학교 이름·주소·교실 수는 경기도교육청 「2026 온동네 돌봄·교육 자원지도」(파주) 기준이고, 현재 인원과 상태는
          데모용으로 만든 값입니다.
        </p>
      </section>
    </main>
  );
}
