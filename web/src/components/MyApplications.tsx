import type { Application, School } from '../../../shared/types';
import { useLang } from '../lib/LangContext';
import { schoolName } from '../lib/i18n';

interface MyApplicationsProps {
  applications: Application[];
  schools: School[];
}

const STATUS_CLASS: Record<Application['status'], string> = {
  pending: 'app-pending',
  approved: 'app-approved',
  rejected: 'app-rejected',
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function MyApplications({ applications, schools }: MyApplicationsProps) {
  const { lang, t } = useLang();
  if (applications.length === 0) {
    return <p className="muted">{t.noMyApps}</p>;
  }
  const sorted = [...applications].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <ul className="my-apps" aria-live="polite">
      {sorted.map((a) => {
        const school = schools.find((s) => s.id === a.schoolId);
        return (
          <li key={a.id} className={`my-app ${STATUS_CLASS[a.status]}`}>
            <div className="my-app-head">
              <strong>{school ? schoolName(school, lang) : a.schoolId}</strong>
              <span className="my-app-status">{t.status[a.status]}</span>
            </div>
            <p className="muted small">
              {a.kind === 'apply' ? t.kindApply : t.kindInquiry} · {a.childName} · {t.grade(a.grade)} · {formatTime(a.createdAt)}
            </p>
            {a.status === 'rejected' && a.rejectReason && (
              <p className="my-app-reason">
                {t.rejectReasonPrefix}
                {a.rejectReason}
              </p>
            )}
            {a.status === 'approved' && <p className="my-app-ok">{t.approvedNote}</p>}
          </li>
        );
      })}
    </ul>
  );
}
