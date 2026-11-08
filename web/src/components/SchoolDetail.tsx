import { useState } from 'react';
import type { School } from '../../../shared/types';
import { markerState, vacancy } from '../../../shared/rules';
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
  const [mode, setMode] = useState<Mode>('summary');
  const marker = markerState(school, now);
  const isHome = school.id === homeSchool.id;
  const seats = vacancy(school);

  return (
    <div className="sheet-backdrop" onClick={onClose} role="presentation">
      <section className={`sheet sheet-${marker.color}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <button type="button" className="sheet-close" onClick={onClose} aria-label="닫기">
          ×
        </button>
        <h2 id="sheet-title">
          {school.name}
          {isHome && <span className="chip chip-home">우리 학교</span>}
        </h2>
        <p className="muted">{school.address}</p>
        <StatusBadge marker={marker} size="lg" />

        <dl className="detail-stats">
          <div>
            <dt>정원</dt>
            <dd>{school.capacity}</dd>
          </div>
          <div>
            <dt>현재 인원</dt>
            <dd>{school.current}</dd>
          </div>
          <div>
            <dt>정원상 빈자리</dt>
            <dd className={seats > 0 ? 'num-good' : ''}>{marker.level === 'stale' ? '–' : seats}</dd>
          </div>
        </dl>

        {marker.level === 'check' && seats > 0 && (
          <p className="hint">
            정원상 빈자리는 {seats}자리지만, 학교가 아직 "신청 가능"으로 바꾸지 않았습니다. 문의하면 학교가 확인한 뒤 답합니다.
          </p>
        )}
        {marker.level === 'stale' && <p className="hint">학교가 24시간 넘게 현황을 갱신하지 않았습니다. 학교에 직접 확인해 주세요.</p>}

        {mode === 'summary' && (
          <div className="btn-row">
            {(marker.action === 'apply' || marker.action === 'inquire') && (
              <button type="button" className="btn btn-primary btn-wide" onClick={() => setMode('form')}>
                {marker.actionLabel}
              </button>
            )}
            {marker.action === 'waitlist' && isHome && (
              <button type="button" className="btn btn-secondary btn-wide" onClick={() => setMode('waitlist')}>
                {marker.actionLabel}
              </button>
            )}
            {marker.action === 'waitlist' && !isHome && <p className="muted">이 학교는 지금 마감입니다. 묶음 안 다른 학교를 확인해 보세요.</p>}
          </div>
        )}

        {mode === 'waitlist' && (
          <div className="waitlist-note">
            <h3>우리 학교 대기 안내</h3>
            <p>{school.waitlistNote}</p>
            <button type="button" className="btn btn-ghost" onClick={() => setMode('summary')}>
              돌아가기
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
