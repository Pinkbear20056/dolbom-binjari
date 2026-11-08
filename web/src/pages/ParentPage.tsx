import { useEffect, useMemo, useState } from 'react';
import type { School } from '../../../shared/types';
import { schoolsInBundle } from '../../../shared/rules';
import { api, errorMessage } from '../lib/api';
import { LIVE_EVENTS, useLive, useNow } from '../lib/live';
import { storage } from '../lib/storage';
import { useLang } from '../lib/LangContext';
import { schoolName } from '../lib/i18n';
import SchoolMap from '../components/SchoolMap';
import SchoolCard from '../components/SchoolCard';
import SchoolDetail from '../components/SchoolDetail';
import MyApplications from '../components/MyApplications';

const SCHOOL_EVENTS = [LIVE_EVENTS.schools, LIVE_EVENTS.reset];
const APP_EVENTS = [LIVE_EVENTS.applications, LIVE_EVENTS.reset];
const GRADES = [1, 2, 3, 4, 5, 6];

export default function ParentPage() {
  const { lang, t } = useLang();
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
    setToast(t.toastSent);
  }

  return (
    <main className="page parent-page">
      <header className="page-head">
        <div>
          <h1>{t.parentTitle}</h1>
          <p className="muted">{t.parentSubtitle}</p>
        </div>
        <a className="btn btn-secondary my-app-link" href="#my-applications">
          {t.myAppsLink}
        </a>
      </header>

      <section className="card picker">
        <label className="field">
          <span>{t.mySchool}</span>
          <select value={homeSchoolId ?? ''} onChange={(e) => chooseHome(e.target.value)} disabled={schoolsLive.loading && allSchools.length === 0}>
            <option value="">{t.pickSchool}</option>
            {allSchools.map((s) => (
              <option key={s.id} value={s.id}>
                {schoolName(s, lang)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t.childGrade}</span>
          <select value={grade ?? ''} onChange={(e) => chooseGrade(e.target.value)}>
            <option value="">{t.gradePlaceholder}</option>
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {t.grade(g)}
              </option>
            ))}
          </select>
        </label>
      </section>

      {schoolsLive.error != null && (
        <p className="form-error" role="alert">
          {errorMessage(schoolsLive.error, lang)}
        </p>
      )}

      {!homeSchool && !schoolsLive.error && (
        <section className="card intro">
          <h2>{t.introTitle}</h2>
          <p>{t.introText}</p>
        </section>
      )}

      {homeSchool && (
        <>
          <h2 className="section-title">
            {t.nearTitle(schoolName(homeSchool, lang))} <span className="school-count">{t.nearbyCount(bundleSchools.length)}</span>
          </h2>
          <div className="school-results">
            <div className="school-map-panel">
              <SchoolMap schools={bundleSchools} homeSchoolId={homeSchool.id} selectedId={selectedId} now={now} onSelect={setSelectedId} />
              <ul className="legend" aria-label={t.legendAria}>
                <li className="badge-green">{t.marker.open}</li>
                <li className="badge-yellow">{t.marker.check}</li>
                <li className="badge-red">{t.marker.closed}</li>
                <li className="badge-grey">{t.marker.stale}</li>
              </ul>
            </div>
            <div className="school-list">
              {bundleSchools.map((s) => (
                <SchoolCard key={s.id} school={s} isHome={s.id === homeSchool.id} isSelected={s.id === selectedId} now={now} onSelect={setSelectedId} />
              ))}
            </div>
          </div>
          <p className="muted small">{t.seatsExplainer}</p>
        </>
      )}

      <section className="card my-section" id="my-applications">
        <h2>{t.myApplications}</h2>
        {myAppsLive.error != null && <p className="form-error">{errorMessage(myAppsLive.error, lang)}</p>}
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
