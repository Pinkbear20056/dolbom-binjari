import { useState, type FormEvent } from 'react';
import type { School } from '../../../shared/types';
import type { ApplicationKind } from '../../../shared/types';
import { api, errorMessage } from '../lib/api';

interface ApplyFormProps {
  school: School;
  homeSchool: School;
  kind: ApplicationKind;
  defaultGrade: number | null;
  onSubmitted: (applicationId: string) => void;
  onCancel: () => void;
}

const GRADES = [1, 2, 3, 4, 5, 6];

export default function ApplyForm({ school, homeSchool, kind, defaultGrade, onSubmitted, onCancel }: ApplyFormProps) {
  const [childName, setChildName] = useState('');
  const [grade, setGrade] = useState<number>(defaultGrade ?? 1);
  const [p1, setP1] = useState('010');
  const [p2, setP2] = useState('');
  const [p3, setP3] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const title = kind === 'apply' ? `${school.name}에 신청하기` : `${school.name}에 이용 가능 여부 문의`;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const created = await api.createApplication({
        schoolId: school.id,
        homeSchoolId: homeSchool.id,
        childName,
        grade,
        guardianPhone: `${p1}-${p2}-${p3}`,
      });
      onSubmitted(created.id);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="apply-form" onSubmit={handleSubmit}>
      <h3>{title}</h3>
      <p className="muted">
        {kind === 'apply'
          ? '학교 돌봄전담사가 규정을 확인한 뒤 승인하거나 반려합니다.'
          : '학교가 빈자리를 쓸 수 있는지 확인한 뒤 답합니다. 승인되면 신청과 같이 자리가 배정됩니다.'}
      </p>
      <label className="field">
        <span>아이 이름</span>
        <input
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          required
          autoComplete="off"
          placeholder="예: 김하늘"
        />
      </label>
      <label className="field">
        <span>학년</span>
        <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {g}학년
            </option>
          ))}
        </select>
      </label>
      <fieldset className="field">
        <legend>보호자 연락처</legend>
        <div className="phone-row">
          <input aria-label="연락처 앞자리" inputMode="numeric" pattern="\d{2,3}" maxLength={3} value={p1} onChange={(e) => setP1(e.target.value.replace(/\D/g, ''))} required />
          <span aria-hidden="true">-</span>
          <input aria-label="연락처 가운데" inputMode="numeric" pattern="\d{3,4}" maxLength={4} value={p2} onChange={(e) => setP2(e.target.value.replace(/\D/g, ''))} required placeholder="0000" />
          <span aria-hidden="true">-</span>
          <input aria-label="연락처 뒷자리" inputMode="numeric" pattern="\d{4}" maxLength={4} value={p3} onChange={(e) => setP3(e.target.value.replace(/\D/g, ''))} required placeholder="0000" />
        </div>
      </fieldset>
      <p className="muted small">우리 학교: {homeSchool.name} · 예시 데이터이므로 실제 아이 정보는 넣지 마세요.</p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="btn-row">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
          취소
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? '보내는 중…' : kind === 'apply' ? '신청 보내기' : '문의 보내기'}
        </button>
      </div>
    </form>
  );
}
