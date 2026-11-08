import type { School } from '../../../shared/types';
import { markerState, vacancy } from '../../../shared/rules';
import { useLang } from '../lib/LangContext';
import { schoolName } from '../lib/i18n';
import StatusBadge from './StatusBadge';

interface SchoolCardProps {
  school: School;
  isHome: boolean;
  isSelected: boolean;
  now: Date;
  onSelect: (schoolId: string) => void;
}

export default function SchoolCard({ school, isHome, isSelected, now, onSelect }: SchoolCardProps) {
  const { lang, t } = useLang();
  const marker = markerState(school, now);
  const seats = vacancy(school);
  return (
    <button
      type="button"
      className={`school-card ${isSelected ? 'is-selected' : ''}`}
      onClick={() => onSelect(school.id)}
      aria-pressed={isSelected}
    >
      <div className="school-card-head">
        <h3>
          {schoolName(school, lang)}
          {isHome && <span className="chip chip-home">{t.mySchool}</span>}
        </h3>
        <StatusBadge marker={marker} />
      </div>
      <p className="school-card-address">{school.address}</p>
      <dl className="school-card-stats">
        <div>
          <dt>{t.capacity}</dt>
          <dd>{t.people(school.capacity)}</dd>
        </div>
        <div>
          <dt>{t.current}</dt>
          <dd>{t.people(school.current)}</dd>
        </div>
        <div>
          <dt>{t.seats}</dt>
          <dd className={seats > 0 ? 'num-good' : ''}>{marker.level === 'stale' ? '–' : seats}</dd>
        </div>
      </dl>
    </button>
  );
}
