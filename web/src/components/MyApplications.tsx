import type { Application, School } from '../../../shared/types';

interface MyApplicationsProps {
  applications: Application[];
  schools: School[];
}

const STATUS_LABEL: Record<Application['status'], { text: string; cls: string }> = {
  pending: { text: '접수 중 · Pending', cls: 'app-pending' },
  approved: { text: '승인 · Approved', cls: 'app-approved' },
  rejected: { text: '반려 · Rejected', cls: 'app-rejected' },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function MyApplications({ applications, schools }: MyApplicationsProps) {
  if (applications.length === 0) {
    return <p className="muted">아직 보낸 신청이 없습니다. 학교를 골라 신청하거나 문의해 보세요.</p>;
  }
  const sorted = [...applications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <ul className="my-apps" aria-live="polite">
      {sorted.map((a) => {
        const school = schools.find((s) => s.id === a.schoolId);
        const st = STATUS_LABEL[a.status];
        return (
          <li key={a.id} className={`my-app ${st.cls}`}>
            <div className="my-app-head">
              <strong>{school?.name ?? a.schoolId}</strong>
              <span className="my-app-status">{st.text}</span>
            </div>
            <p className="muted small">
              {a.kind === 'apply' ? '신청' : '문의'} · {a.childName} · {a.grade}학년 · {formatTime(a.createdAt)}
            </p>
            {a.status === 'rejected' && a.rejectReason && <p className="my-app-reason">반려 사유: {a.rejectReason}</p>}
            {a.status === 'approved' && <p className="my-app-ok">자리가 배정되었습니다. 학교 안내에 따라 등원 준비를 해 주세요.</p>}
          </li>
        );
      })}
    </ul>
  );
}
