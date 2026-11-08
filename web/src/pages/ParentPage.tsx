import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { School } from '../../../shared/types';
import { schoolsInBundle } from '../../../shared/rules';
import { api } from '../lib/api';
import { LIVE_EVENTS, useLive, useNow } from '../lib/live';
import { storage } from '../lib/storage';
import SchoolMap from '../components/SchoolMap';
import SchoolCard from '../components/SchoolCard';
import SchoolDetail from '../components/SchoolDetail';
import MyApplications from '../components/MyApplications';

const SCHOOL_EVENTS = [LIVE_EVENTS.schools, LIVE_EVENTS.reset];
const APP_EVENTS = [LIVE_EVENTS.applications, LIVE_EVENTS.reset];
const GRADES = [1, 2, 3, 4, 5, 6];

export default function ParentPage() {
  const now = useNow();
  const schoolsLive = useLive(() => api.schools(), SCHOOL_EVENTS);
  const [homeSchoolId, setHomeSchoolId] = useState<string | null>(() => storage.getHomeSchoolId());
  const [grade, setGrade] = useState<number | null>(() => storage.getGrade());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [myIds, setMyIds] = useState<string[]>(() => storage.getMyApplicationIds());
  const [toast, setToast] = useState<string | null>(null);

  const myAppsLive = useLive(() => api.applicationsByIds(myIds), APP_EVENTS, myIds.join(','));

  const allSchools: School[] = useMemo(() => schoolsLive.data ?? [], [schoolsLive.data]);
  const homeSchool = allSchools.find((s) => s.id === homeSchoolId) ?? null;
  const bundleSchools = useMemo(
    () => (homeSchoolId ? schoolsInBundle(allSchools, homeSchoolId) : []),
    [allSchools, homeSchoolId],
  );
  const selected = bundleSchools.find((s) => s.id === selectedId) ?? null;

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(id);
  }, [toast]);

  function chooseHome(id: string) {
    const next = id || null;
    setHomeSchoolId(next);
    storage.setHomeSchoolId(next);
    setSelectedId(null);
  }

  function chooseGrade(value: string) {
    const g = value ? Number(value) : null;
    setGrade(g);
    storage.setGrade(g);
  }

  function handleSubmitted(applicationId: string) {
    setMyIds(storage.addMyApplicationId(applicationId));
    setSelectedId(null);
    setToast('보냈습니다. 학교가 확인하면 아래 "내 신청"에 바로 표시됩니다.');
  }

  return (
    <main className="page parent-page">
      <header className="page-head">
        <Link to="/" className="back-link">
          ← 홈
        </Link>
        <h1>학부모 화면</h1>
      </header>

      <section className="card picker">
        <label className="field">
          <span>우리 학교</span>
          <select value={homeSchoolId ?? ''} onChange={(e) => chooseHome(e.target.value)} disabled={schoolsLive.loading && allSchools.length === 0}>
            <option value="">학교를 고르세요</option>
            {allSchools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>아이 학년</span>
          <select value={grade ?? ''} onChange={(e) => chooseGrade(e.target.value)}>
            <option value="">학년</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}학년
              </option>
            ))}
          </select>
        </label>
      </section>

      {schoolsLive.error && (
        <p className="form-error" role="alert">
          {schoolsLive.error}
        </p>
      )}

      {!homeSchool && !schoolsLive.error && (
        <section className="card intro">
          <h2>우리 학교가 마감이어도, 가까운 학교에 자리가 있을 수 있어요</h2>
          <p>우리 학교를 고르면 같은 묶음 안 학교들의 돌봄교실 현황을 지도와 목록으로 보여줍니다.</p>
        </section>
      )}

      {homeSchool && (
        <>
          <h2 className="section-title">
            {homeSchool.name} 묶음 <span className="muted small">같은 묶음 {bundleSchools.length}개 학교</span>
          </h2>
          <SchoolMap schools={bundleSchools} homeSchoolId={homeSchool.id} selectedId={selectedId} now={now} onSelect={setSelectedId} />
          <ul className="legend" aria-label="상태 색 설명">
            <li><span className="dot dot-green" /> 신청 가능</li>
            <li><span className="dot dot-yellow" /> 학교 확인 필요</li>
            <li><span className="dot dot-red" /> 마감</li>
            <li><span className="dot dot-grey" /> 정보 갱신 안 됨</li>
          </ul>
          <div className="school-list">
            {bundleSchools.map((s) => (
              <SchoolCard key={s.id} school={s} isHome={s.id === homeSchool.id} isSelected={s.id === selectedId} now={now} onSelect={setSelectedId} />
            ))}
          </div>
          <p className="muted small">"정원상 빈자리"는 정원에서 현재 인원을 뺀 숫자이고, "신청 가능 여부"는 학교가 정합니다. 둘은 다를 수 있습니다.</p>
        </>
      )}

      <section className="card my-section" id="my-applications">
        <h2>내 신청</h2>
        {myAppsLive.error && <p className="form-error">{myAppsLive.error}</p>}
        <MyApplications applications={myAppsLive.data ?? []} schools={allSchools} />
      </section>

      {selected && homeSchool && (
        <SchoolDetail
          school={selected}
          homeSchool={homeSchool}
          defaultGrade={grade}
          now={now}
          onClose={() => setSelectedId(null)}
          onSubmitted={handleSubmitted}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </main>
  );
}
