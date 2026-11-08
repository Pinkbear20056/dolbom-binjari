import sprout from '../assets/sprout-hero.svg';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { School } from '../../../shared/types';
import { api, errorMessage } from '../lib/api';
import { LIVE_EVENTS, useLive } from '../lib/live';
import { storage } from '../lib/storage';
import { useLang } from '../lib/LangContext';
import { schoolName } from '../lib/i18n';

const SCHOOL_EVENTS = [LIVE_EVENTS.schools, LIVE_EVENTS.reset];

export default function HomePage() {
  const navigate = useNavigate();
  const { lang, t } = useLang();
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
      setMessage(t.resetDone);
    } catch (err) {
      setMessage(errorMessage(err, lang));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="page home">
      <section className="hero">
        <div>
          <h1>{t.heroTitle}</h1>
          <p className="muted">
            {t.heroLine1}
            <br />
            {t.heroLine2}
          </p>
        </div>
        <img className="hero-sprout" src={sprout} width={176} height={176} alt="" />
      </section>

      <div className="role-grid">
        <section className="card role-card">
          <h2>{t.roleParent}</h2>
          <p className="muted small">{t.parentCardText}</p>
          <Link className="btn btn-primary" to="/parent">
            {t.parentCardButton}
          </Link>
        </section>

        <section className="card role-card">
          <h2>{t.roleTeacher}</h2>
          <p className="muted small">{t.teacherCardText}</p>
          <div className="role-row">
            <label className="field">
              <span className="sr-only">{t.teacherSchoolSr}</span>
              <select value={teacherSchool} onChange={(e) => setTeacherSchool(e.target.value)}>
                <option value="">{t.chooseSchool}</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {schoolName(s, lang)}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="btn btn-secondary" disabled={!teacherSchool} onClick={() => navigate(`/teacher/${teacherSchool}`)}>
              {t.openTeacher}
            </button>
          </div>
        </section>
      </div>

      <p className="home-note muted">{t.homeNote}</p>

      {schoolsLive.error != null && (
        <p className="form-error" role="alert">
          {errorMessage(schoolsLive.error, lang)}
        </p>
      )}

      <section className="reset-area">
        <button type="button" className="btn btn-ghost" onClick={resetData} disabled={busy}>
          {busy ? t.resetting : t.resetButton}
        </button>
        {message && (
          <p className="muted small" role="status">
            {message}
          </p>
        )}
        <p className="muted small">{t.demoNote}</p>
      </section>
    </main>
  );
}
