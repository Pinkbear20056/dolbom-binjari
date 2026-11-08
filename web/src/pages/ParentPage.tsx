import { useEffect, useState } from 'react';
import type { School } from '../../../shared/types';

export default function ParentPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/schools')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: School[]) => setSchools(data))
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <main className="page">
      <h1>학부모 화면</h1>
      {error && <p role="alert">서버에 연결할 수 없습니다: {error}</p>}
      <ul>
        {schools.map((s) => (
          <li key={s.id}>
            {s.name} · 정원 {s.capacity} · 현재 {s.current} · {s.status}
          </li>
        ))}
      </ul>
    </main>
  );
}
