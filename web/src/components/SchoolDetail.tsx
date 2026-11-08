import { useState } from 'react';
import type { School } from '../../../shared/types';
import { markerState, vacancy } from '../../../shared/rules';
import { useLang } from '../lib/LangContext';
import { actionLabel, schoolAddress, schoolName } from '../lib/i18n';
import StatusBadge from './StatusBadge';
import ApplyForm from './ApplyForm';

interface SchoolDetailProps {
  school: School;
  homeSchool: School;
  defaultGrade: number | null;
  now: Date;
  onClose: () => void;
  onSubmitted: (applicationId: string) => void;
}

type Mode = 'summary' | 'form' | 'waitlist';

export default function SchoolDetail({ school, homeSchool, defaultGrade, now, onClose, onSubmitted }: SchoolDetailProps) {
  const { lang, t } = useLang();
  const [mode, setMode] = useState<Mode>('summary');
  const marker = markerState(school, now);
  const isHome = school.id === homeSchool.id;
  const seats = vacancy(school);

  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <section className={`sheet sheet-${marker.color}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <button type="button" className="sheet-close" onClick={onClose} aria-label={t.close}>
          <span className="sheet-close-icon" aria-hidden="true">×</span>
          <span className="sheet-back-label">{t.backToList}</span>
        </button>
        <div className="school-summary">
          <h2 id="sheet-title">
            {schoolName(school, lang)}
            {isHome && <span className="chip chip-home">{t.mySchool}</span>}
          </h2>
          <p className="muted">{schoolAddress(school, lang)}</p>
          <StatusBadge marker={marker} size="lg" />

          <dl className="detail-stats">
            <div>
              <dt>{t.capacity}</dt>
              <dd>{school.capacity}</dd>
            </div>
            <div>
              <dt>{t.current}</dt>
              <dd>{school.current}</dd>
            </div>
            <div>
              <dt>{t.seats}</dt>
              <dd className={seats > 0 ? 'num-good' : ''}>{marker.level === 'stale' ? '–' : seats}</dd>
            </div>
          </dl>
        </div>

        {marker.level === 'check' && seats > 0 && <p className="hint">{t.checkHint(seats)}</p>}
        {marker.level === 'stale' && <p className="hint">{t.staleHint}</p>}

        {mode === 'summary' && (
          <div className="btn-row">
            {(marker.action === 'apply' || marker.action === 'inquire') && (
              <button type="button" className="btn btn-primary btn-wide" onClick={() => setMode('form')}>
                {actionLabel(marker, lang)}
              </button>
            )}
            {marker.action === 'waitlist' && isHome && (
              <button type="button" className="btn btn-secondary btn-wide" onClick={() => setMode('waitlist')}>
                {actionLabel(marker, lang)}
              </button>
            )}
            {marker.action === 'waitlist' && !isHome && <p className="muted">{t.closedOther}</p>}
          </div>
        )}

        {mode === 'waitlist' && (
          <div className="waitlist-note">
            <h3>{t.waitlistTitle}</h3>
            <p>{lang === 'en' ? school.waitlistNoteEn : school.waitlistNote}</p>
            <button type="button" className="btn btn-ghost" onClick={() => setMode('summary')}>
              {t.back}
            </button>
          </div>
        )}

        {mode === 'form' && (
          <ApplyForm
            school={school}
            homeSchool={homeSchool}
            kind={marker.action === 'apply' ? 'apply' : 'inquiry'}
            defaultGrade={defaultGrade}
            onCancel={() => setMode('summary')}
            onSubmitted={onSubmitted}
          />
        )}
      </section>
    </div>
  );
}
