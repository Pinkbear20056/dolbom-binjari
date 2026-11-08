import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <main className="page">
      <h1>돌봄빈자리</h1>
      <p>돌봄 시설을 새로 짓지 않고, 이미 있는 돌봄교실 자리를 연결합니다.</p>
      <Link className="btn btn-primary" to="/parent">
        학부모로 보기
      </Link>
    </main>
  );
}
