import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ParentPage from './pages/ParentPage';
import TeacherPage from './pages/TeacherPage';
import SampleBanner from './components/SampleBanner';

export default function App() {
  return (
    <div className="app">
      <SampleBanner />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/parent" element={<ParentPage />} />
        <Route path="/teacher/:schoolId" element={<TeacherPage />} />
      </Routes>
    </div>
  );
}
