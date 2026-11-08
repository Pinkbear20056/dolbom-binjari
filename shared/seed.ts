import type { Db } from './types';

/**
 * SAMPLE DATA. School names, addresses and classroom counts come from the
 * Gyeonggi Office of Education "2026 온동네 돌봄·교육 자원지도" (Paju edition).
 * Capacity = afternoon-care classrooms × 20. Current headcounts, statuses and
 * every application are invented for the demo and are NOT real school status.
 * Coordinates: OpenStreetMap Nominatim (null = not found, see docs/TODO.md).
 */
export function createSeed(now: Date = new Date()): Db {
  const updatedAt = now.toISOString();
  return {
    bundles: [
      { id: 'unjeong', name: '운정 가까운 학교 묶음', nameEn: 'Unjeong nearby-schools bundle' },
      { id: 'munsan', name: '문산 묶음', nameEn: 'Munsan bundle' },
    ],
    schools: [
      {
        id: 'cheongam', bundleId: 'unjeong', name: '청암초등학교', nameEn: 'Cheongam Elementary',
        address: '경기 파주시 청암로 16', addressEn: '16 Cheongam-ro, Paju-si, Gyeonggi-do', classrooms: 6, capacity: 120, current: 120, status: 'closed',
        lat: 37.7308241, lng: 126.7378655, updatedAt,
        waitlistNote: '우리 학교 돌봄교실은 현재 정원이 찼습니다. 대기 신청은 학교 돌봄교실로 문의해 주세요. 묶음 안 다른 학교의 빈자리도 확인해 보세요.',
        waitlistNoteEn: 'Our daycare is full right now. Ask the school daycare office about the waitlist, and check the spare seats at other schools in the bundle.',
      },
      {
        id: 'gaon', bundleId: 'unjeong', name: '가온초등학교', nameEn: 'Gaon Elementary',
        address: '경기 파주시 가온로 134', addressEn: '134 Gaon-ro, Paju-si, Gyeonggi-do', classrooms: 4, capacity: 80, current: 77, status: 'check',
        lat: 37.7203155, lng: 126.7469856, updatedAt,
        waitlistNote: '정원이 찼을 때는 학교 돌봄교실에 대기 신청을 문의해 주세요.',
        waitlistNoteEn: 'When the daycare is full, ask the school daycare office about the waitlist.',
      },
      {
        id: 'wadong', bundleId: 'unjeong', name: '파주와동초등학교', nameEn: 'Paju Wadong Elementary',
        address: '경기 파주시 금바위로 17', addressEn: '17 Geumbawi-ro, Paju-si, Gyeonggi-do', classrooms: 4, capacity: 80, current: 79, status: 'open',
        lat: 37.726425, lng: 126.7570207, updatedAt,
        waitlistNote: '정원이 찼을 때는 학교 돌봄교실에 대기 신청을 문의해 주세요.',
        waitlistNoteEn: 'When the daycare is full, ask the school daycare office about the waitlist.',
      },
      {
        id: 'jisan', bundleId: 'unjeong', name: '지산초등학교', nameEn: 'Jisan Elementary',
        address: '경기 파주시 경의로 1274', addressEn: '1274 Gyeongui-ro, Paju-si, Gyeonggi-do', classrooms: 3, capacity: 60, current: 60, status: 'closed',
        lat: 37.7307979, lng: 126.7616671, updatedAt,
        waitlistNote: '우리 학교 돌봄교실은 현재 정원이 찼습니다. 대기 신청은 학교 돌봄교실로 문의해 주세요. 묶음 안 다른 학교의 빈자리도 확인해 보세요.',
        waitlistNoteEn: 'Our daycare is full right now. Ask the school daycare office about the waitlist, and check the spare seats at other schools in the bundle.',
      },
      {
        id: 'munsan', bundleId: 'munsan', name: '문산초등학교', nameEn: 'Munsan Elementary',
        address: '경기 파주시 문산읍 문향로67번길 58', addressEn: '58 Munhyang-ro 67beon-gil, Munsan-eup, Paju-si, Gyeonggi-do', classrooms: 3, capacity: 60, current: 55, status: 'open',
        lat: 37.86054, lng: 126.7831785, updatedAt,
        waitlistNote: '정원이 찼을 때는 학교 돌봄교실에 대기 신청을 문의해 주세요.',
        waitlistNoteEn: 'When the daycare is full, ask the school daycare office about the waitlist.',
      },
    ],
    applications: [
      {
        id: 'seed-app-1', schoolId: 'wadong', homeSchoolId: 'cheongam', kind: 'apply',
        childName: '김하늘', grade: 2, guardianPhone: '010-0000-0000', status: 'pending',
        rejectReason: null, createdAt: updatedAt, updatedAt,
      },
    ],
  };
}
