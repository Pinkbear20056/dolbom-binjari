import { useParams } from 'react-router-dom';

export default function TeacherPage() {
  const { schoolId } = useParams();
  return (
    <main className="page">
      <h1>선생님 화면</h1>
      <p>학교: {schoolId}</p>
    </main>
  );
}
