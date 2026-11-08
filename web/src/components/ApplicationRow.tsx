import { useState } from 'react';
import type { Application, School } from '../../../shared/types';

interface ApplicationRowProps {
  application: Application;
  homeSchool: School | null;
  seatsLeft: number;
  busy: boolean;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

const STATUS_TEXT: Record<Application['status'], string> = {
  pending: '접수 중',
  approved: '승인',
  rejected: '반려',
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ApplicationRow({ application: a, homeSchool, seatsLeft, busy, onApprove, onReject }: ApplicationRowProps) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const canApprove = a.status === 'pending' && seatsLeft > 0;

  return (
    <li className={`app-row app-${a.status}`}>
      <div className="app-row-main">
        <div>
          <strong className="app-name">
            {a.childName} <span className="muted">{a.grade}학년</span>
          </strong>
          <p className="muted small">
            소속: {homeSchool?.name ?? a.homeSchoolId} · {a.kind === 'apply' ? '신청' : '이용 가능 여부 문의'} · {formatTime(a.createdAt)}
          </p>
          <p className="muted small">보호자 {a.guardianPhone}</p>
        </div>
        <span className={`app-status-chip chip-${a.status}`}>{STATUS_TEXT[a.status]}</span>
      </div>

      {a.status === 'rejected' && a.rejectReason && <p className="my-app-reason">반려 사유: {a.rejectReason}</p>}

      {a.status === 'pending' && !rejecting && (
        <div className="btn-row">
          <button type="button" className="btn btn-primary" disabled={busy || !canApprove} onClick={onApprove}>
            승인 {canApprove ? '' : '(빈자리 없음)'}
          </button>
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setRejecting(true)}>
            반려
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
            <span>반려 사유 (학부모에게 그대로 보입니다)</span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              required
              placeholder="예: 거주지 기준 미충족, 학년 제한 등"
            />
          </label>
          <div className="btn-row">
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setRejecting(false)}>
              취소
            </button>
            <button type="submit" className="btn btn-danger" disabled={busy || reason.trim().length === 0}>
              반려 확정
            </button>
          </div>
        </form>
      )}
    </li>
  );
}
