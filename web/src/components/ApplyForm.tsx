import { useState, type FormEvent } from 'react';
import type { School } from '../../../shared/types';
import type { ApplicationKind } from '../../../shared/types';
import { api, errorMessage } from '../lib/api';
import { useLang } from '../lib/LangContext';
import { schoolName } from '../lib/i18n';

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
  const { lang, t } = useLang();
  const [childName, setChildName] = useState('');
  const [grade, setGrade] = useState<number>(defaultGrade ?? 1);
  const [p1, setP1] = useState('010');
  const [p2, setP2] = useState('');
  const [p3, setP3] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const title = kind === 'apply' ? t.formTitleApply : t.formTitleInquiry;

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
      setError(errorMessage(err, lang));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="apply-form" onSubmit={handleSubmit}>
      <h3>{title}</h3>
      <p className="muted">{kind === 'apply' ? t.formIntroApply : t.formIntroInquiry}</p>
      <label className="field">
        <span>{t.childName}</span>
        <input value={childName} onChange={(e) => setChildName(e.target.value)} required autoComplete="off" placeholder={t.childNamePlaceholder} />
      </label>
      <label className="field">
        <span>{t.childGrade}</span>
        <select value={grade} onChange={(e) => setGrade(Number(e.target.value))}>
          {GRADES.map((g) => (
            <option key={g} value={g}>
              {t.grade(g)}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="field">
        <legend>{t.guardianPhone}</legend>
        <div className="phone-row">
          <input aria-label={t.phonePart1} inputMode="numeric" pattern="\d{2,3}" maxLength={3} value={p1} onChange={(e) => setP1(e.target.value.replace(/\D/g, ''))} required />
          <span aria-hidden="true">-</span>
          <input aria-label={t.phonePart2} inputMode="numeric" pattern="\d{3,4}" maxLength={4} value={p2} onChange={(e) => setP2(e.target.value.replace(/\D/g, ''))} required placeholder="0000" />
          <span aria-hidden="true">-</span>
          <input aria-label={t.phonePart3} inputMode="numeric" pattern="\d{4}" maxLength={4} value={p3} onChange={(e) => setP3(e.target.value.replace(/\D/g, ''))} required placeholder="0000" />
        </div>
      </fieldset>
      <p className="muted small">{t.formSampleNote(schoolName(homeSchool, lang))}</p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="btn-row">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
          {t.cancel}
        </button>
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? t.sending : kind === 'apply' ? t.sendApply : t.sendInquiry}
        </button>
      </div>
    </form>
  );
}
