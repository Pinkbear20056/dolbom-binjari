import { useState } from 'react';
import type { Application, School } from '../../../shared/types';
import { useLang } from '../lib/LangContext';
import { schoolName } from '../lib/i18n';

interface ApplicationRowProps {
  application: Application;
  homeSchool: School | null;
  seatsLeft: number;
  busy: boolean;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ApplicationRow({ application: a, homeSchool, seatsLeft, busy, onApprove, onReject }: ApplicationRowProps) {
  const { lang, t } = useLang();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const canApprove = a.status === 'pending' && seatsLeft > 0;

  return (
    <li className={`app-row app-${a.status}`}>
      <div className="app-row-main">
        <div>
          <strong className="app-name">
            {a.childName} <span className="muted">{t.grade(a.grade)}</span>
          </strong>
          <p className="muted small">
            {t.from}
            {homeSchool ? schoolName(homeSchool, lang) : a.homeSchoolId} · {a.kind === 'apply' ? t.kindApply : t.kindInquiryLong} · {formatTime(a.createdAt)}
          </p>
          <p className="muted small">
            {t.guardian}
            {a.guardianPhone}
          </p>
        </div>
        <span className={`app-status-chip chip-${a.status}`}>{t.status[a.status]}</span>
      </div>

      {a.status === 'rejected' && a.rejectReason && (
        <p className="my-app-reason">
          {t.rejectReasonPrefix}
          {a.rejectReason}
        </p>
      )}

      {a.status === 'pending' && !rejecting && (
        <div className="btn-row">
          <button type="button" className="btn btn-primary" disabled={busy || !canApprove} onClick={onApprove}>
            {t.approve} {canApprove ? '' : t.noSeats}
          </button>
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setRejecting(true)}>
            {t.reject}
          </button>
        </div>
      )}

      {a.status === 'pending' && rejecting && (
        <form
          className="reject-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (reason.trim()) onReject(reason.trim());
          }}
        >
          <label className="field">
            <span>{t.rejectReasonLabel}</span>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} required placeholder={t.rejectReasonPlaceholder} />
          </label>
          <div className="btn-row">
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setRejecting(false)}>
              {t.cancel}
            </button>
            <button type="submit" className="btn btn-danger" disabled={busy || reason.trim().length === 0}>
              {t.confirmReject}
            </button>
          </div>
        </form>
      )}
    </li>
  );
}
