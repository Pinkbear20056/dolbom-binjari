/**
 * UI strings. English is the default; Korean is the second language.
 * Pure module (no React) so it can be unit-tested; the hook lives in LangContext.tsx.
 */
import type { MarkerState } from '../../../shared/rules';
import type { School } from '../../../shared/types';

export type Lang = 'en' | 'ko';
export const LANGS: readonly Lang[] = ['en', 'ko'];
export const DEFAULT_LANG: Lang = 'en';

export function isLang(value: unknown): value is Lang {
  return value === 'en' || value === 'ko';
}

export function otherLang(lang: Lang): Lang {
  return lang === 'en' ? 'ko' : 'en';
}

const en = {
  title: 'Dolbom Binjari · Spare daycare seats in nearby schools',
  brand: 'Dolbom Binjari',
  sectionParent: 'Parents',
  sectionTeacher: 'Daycare',
  sampleData: 'Sample data',
  sampleDataAria: 'Sample data, not real school status',
  switchLang: '한국어',
  switchLangAria: '한국어로 보기 (switch to Korean)',

  // Marker levels (same wording as shared/rules labels)
  marker: {
    stale: 'Not updated',
    closed: 'Full / closed',
    check: 'School check needed',
    open: 'Open to apply',
  },
  legendAria: 'Colour legend',

  // Shared bits
  mySchool: 'My school',
  capacity: 'Capacity',
  current: 'Enrolled',
  seats: 'Seats by capacity',
  people: (n: number) => `${n}`,
  cases: (n: number) => `${n}`,
  grade: (g: number) => `Grade ${g}`,
  cancel: 'Cancel',
  back: 'Back',
  loading: 'Loading…',

  // Home
  roleParent: 'Parents',
  roleTeacher: 'Daycare',
  heroTitle: 'Find an after-school daycare seat',
  heroLine1: 'If your school’s daycare is full, check the spare seats at schools nearby.',
  heroLine2: 'Results show up under “My applications”.',
  parentCardText: 'See seats by school and apply for daycare.',
  parentCardButton: 'See seats by school',
  teacherCardText: 'Manage your school’s headcount and incoming applications.',
  teacherSchoolSr: 'Your school',
  chooseSchool: 'Choose a school',
  openTeacher: 'Open daycare screen',
  homeNote: 'You can apply to any school shown as “Open to apply”.',
  resetButton: 'Reset sample data',
  resetting: 'Resetting…',
  resetDone: 'Sample data restored. This device’s “My applications” list was cleared too.',
  demoNote: 'Demo only. Headcounts and applications are invented.',

  // Parent page
  parentTitle: 'Daycare seats nearby',
  parentSubtitle: 'Choose your school and your child’s grade.',
  myAppsLink: 'My applications ↓',
  pickSchool: 'Pick a school',
  childGrade: 'Child’s grade',
  gradePlaceholder: 'Grade',
  introTitle: 'Your school may be full, but a school nearby may have a seat',
  introText: 'Pick your school to see the daycare status of every school in the same bundle, on a map and as a list.',
  nearTitle: (home: string) => `Near ${home}`,
  nearbyCount: (n: number) => `${n} nearby schools`,
  seatsExplainer:
    '“Seats by capacity” is capacity minus enrolled children. Whether a school is “open to apply” is decided by the school. The two can differ.',
  myApplications: 'My applications',
  toastSent: 'Sent. When the school responds it will show under “My applications” right away.',
  mapAria: 'Map of schools in the bundle',
  mapHome: ' (my school)',
  mapSeats: (n: number) => ` · ${n} seats`,
  mapMissing: (n: number) => `${n} school(s) without coordinates are not on the map, only in the list below.`,

  // Detail sheet
  close: 'Close',
  backToList: '← School list',
  checkHint: (n: number) =>
    `There are ${n} seats by capacity, but the school has not switched to “Open to apply” yet. Send an inquiry and the school will check and reply.`,
  staleHint: 'The school has not updated its status for over 24 hours. Please check with the school directly.',
  closedOther: 'This school is full right now. Check the other schools in the bundle.',
  waitlistTitle: 'Waitlist info for my school',
  action: {
    waitlist: 'Waitlist info',
    inquire: 'Ask about availability',
    apply: 'Apply',
  },

  // Apply form
  formTitleApply: 'Apply for daycare',
  formTitleInquiry: 'Ask about availability',
  formIntroApply: 'The school reviews your application; the result appears under “My applications”.',
  formIntroInquiry: 'The school checks whether the seat can be used and replies. If approved, a seat is assigned just like an application.',
  childName: 'Child’s name',
  childNamePlaceholder: 'e.g. Kim Haneul',
  guardianPhone: 'Guardian phone',
  phonePart1: 'Phone, first part',
  phonePart2: 'Phone, middle part',
  phonePart3: 'Phone, last part',
  formSampleNote: (home: string) => `My school: ${home} · Sample data — please do not enter a real child’s details.`,
  sending: 'Sending…',
  sendApply: 'Send application',
  sendInquiry: 'Send inquiry',

  // Applications (parent + teacher)
  status: {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
  },
  kindApply: 'Application',
  kindInquiry: 'Inquiry',
  kindInquiryLong: 'Availability inquiry',
  noMyApps: 'No applications yet. Pick a school to apply or ask.',
  rejectReasonPrefix: 'Reason: ',
  approvedNote: 'A seat has been assigned. Follow the school’s instructions to start.',
  from: 'From: ',
  guardian: 'Guardian ',
  approve: 'Approve',
  noSeats: '(no seats)',
  reject: 'Reject',
  rejectReasonLabel: 'Reason for rejection (shown to the parent as written)',
  rejectReasonPlaceholder: 'e.g. residency rule not met, grade limit',
  confirmReject: 'Confirm rejection',

  // Teacher page
  backHome: '← Home',
  schoolNotFound: (id: string) => `School “${id}” was not found.`,
  classrooms: (n: number) => `${n} afternoon daycare classroom${n === 1 ? '' : 's'}`,
  statsAria: 'Status numbers',
  toReview: 'To review',
  settingsTitle: 'Public status',
  settingsText: 'Seats are capacity minus enrolled children. Whether you accept applications is set separately, by the school.',
  enrolledTitle: 'Enrolled',
  decAria: 'Decrease enrolled by 1',
  incAria: 'Increase enrolled by 1',
  acceptingTitle: 'Accepting applications',
  acceptingAria: 'Accepting applications',
  listTitle: 'Applications',
  listSummary: (pending: number, total: number) => `${pending} pending · ${total} total`,
  noApps: 'No applications yet.',

  // API errors by code (server messages are Korean)
  errors: {
    NETWORK: 'Cannot reach the server. Is the dev server running?',
    HTTP_ERROR: 'The request failed.',
    UNKNOWN: 'Something went wrong.',
    UNKNOWN_SCHOOL: 'School not found.',
    UNKNOWN_HOME_SCHOOL: 'Your school was not found.',
    UNKNOWN_APPLICATION: 'Application not found.',
    INVALID_BODY: 'The application is not valid.',
    OUT_OF_BUNDLE: 'You can only apply to schools in the same bundle.',
    INVALID_NAME: 'Please enter the child’s name.',
    INVALID_GRADE: 'Grade must be between 1 and 6.',
    INVALID_PHONE: 'Phone number format is not valid (e.g. 010-1234-5678).',
    NOT_ACCEPTING: 'This school is not accepting applications right now.',
    DUPLICATE: 'A pending application with the same child name and phone already exists.',
    WRONG_SCHOOL: 'This application belongs to another school.',
    NOT_PENDING: 'This application has already been handled.',
    FULL: 'The school is full; the application cannot be approved.',
    REASON_REQUIRED: 'Please enter a reason for the rejection.',
    INVALID_CURRENT: 'Enrolled must be a whole number.',
    INVALID_STATUS: 'Status must be closed, check or open.',
  } as Record<string, string>,
};

export type Messages = typeof en;

const ko: Messages = {
  title: '돌봄빈자리 · 이웃 학교 돌봄교실 자리 연결',
  brand: '돌봄빈자리',
  sectionParent: '학부모 화면',
  sectionTeacher: '돌봄교실 화면',
  sampleData: '샘플 데이터',
  sampleDataAria: '샘플 데이터, 실제 학교 현황이 아닙니다',
  switchLang: 'English',
  switchLangAria: 'View in English (영어로 보기)',

  marker: {
    stale: '정보 갱신 안 됨',
    closed: '마감',
    check: '학교 확인 필요',
    open: '신청 가능',
  },
  legendAria: '상태 색 설명',

  mySchool: '우리 학교',
  capacity: '정원',
  current: '현재 인원',
  seats: '정원상 빈자리',
  people: (n: number) => `${n}명`,
  cases: (n: number) => `${n}건`,
  grade: (g: number) => `${g}학년`,
  cancel: '취소',
  back: '돌아가기',
  loading: '불러오는 중…',

  roleParent: '학부모',
  roleTeacher: '돌봄교실',
  heroTitle: '방과 후 돌봄 자리 찾기',
  heroLine1: '우리 학교 돌봄교실이 꽉 찼다면, 가까운 학교의 빈자리를 확인해 보세요.',
  heroLine2: '신청 결과는 ‘내 신청’에서 확인할 수 있습니다.',
  parentCardText: '학교별 빈자리를 확인하고 돌봄을 신청합니다.',
  parentCardButton: '학교별 빈자리 보기',
  teacherCardText: '우리 학교 돌봄교실의 인원과 신청 내역을 관리합니다.',
  teacherSchoolSr: '담당 학교',
  chooseSchool: '학교를 선택하세요',
  openTeacher: '돌봄교실 화면 열기',
  homeNote: '신청 가능으로 표시된 학교에 돌봄을 신청할 수 있습니다.',
  resetButton: '샘플 데이터 초기화',
  resetting: '되돌리는 중…',
  resetDone: '예시 데이터를 처음 상태로 되돌렸습니다. 이 기기의 "내 신청" 기록도 지웠습니다.',
  demoNote: '데모용 화면입니다. 인원과 신청 내역은 예시입니다.',

  parentTitle: '주변 학교 돌봄 현황',
  parentSubtitle: '우리 학교와 아이 학년을 선택해 주세요.',
  myAppsLink: '내 신청 보기 ↓',
  pickSchool: '학교를 고르세요',
  childGrade: '아이 학년',
  gradePlaceholder: '학년',
  introTitle: '우리 학교가 마감이어도, 가까운 학교에 자리가 있을 수 있어요',
  introText: '우리 학교를 고르면 같은 묶음 안 학교들의 돌봄교실 현황을 지도와 목록으로 보여줍니다.',
  nearTitle: (home: string) => `${home} 주변`,
  nearbyCount: (n: number) => `가까운 학교 ${n}곳`,
  seatsExplainer: '"정원상 빈자리"는 정원에서 현재 인원을 뺀 숫자이고, "신청 가능 여부"는 학교가 정합니다. 둘은 다를 수 있습니다.',
  myApplications: '내 신청',
  toastSent: '보냈습니다. 학교가 확인하면 아래 "내 신청"에 바로 표시됩니다.',
  mapAria: '묶음 안 학교 지도',
  mapHome: ' 우리 학교',
  mapSeats: (n: number) => ` · 빈자리 ${n}`,
  mapMissing: (n: number) => `좌표가 없는 학교 ${n}곳은 지도에 없고 아래 목록에만 있습니다.`,

  close: '닫기',
  backToList: '← 학교 목록',
  checkHint: (n: number) => `정원상 빈자리는 ${n}자리지만, 학교가 아직 "신청 가능"으로 바꾸지 않았습니다. 문의하면 학교가 확인한 뒤 답합니다.`,
  staleHint: '학교가 24시간 넘게 현황을 갱신하지 않았습니다. 학교에 직접 확인해 주세요.',
  closedOther: '이 학교는 지금 마감입니다. 묶음 안 다른 학교를 확인해 보세요.',
  waitlistTitle: '우리 학교 대기 안내',
  action: {
    waitlist: '대기 안내',
    inquire: '이용 가능 여부 문의',
    apply: '신청하기',
  },

  formTitleApply: '돌봄 신청',
  formTitleInquiry: '이용 가능 여부 문의',
  formIntroApply: '신청 결과는 학교 검토 후 ‘내 신청’에 표시됩니다.',
  formIntroInquiry: '학교가 빈자리를 쓸 수 있는지 확인한 뒤 답합니다. 승인되면 신청과 같이 자리가 배정됩니다.',
  childName: '아이 이름',
  childNamePlaceholder: '예: 김하늘',
  guardianPhone: '보호자 연락처',
  phonePart1: '연락처 앞자리',
  phonePart2: '연락처 가운데',
  phonePart3: '연락처 뒷자리',
  formSampleNote: (home: string) => `우리 학교: ${home} · 예시 데이터이므로 실제 아이 정보는 넣지 마세요.`,
  sending: '보내는 중…',
  sendApply: '신청 보내기',
  sendInquiry: '문의 보내기',

  status: {
    pending: '접수 중',
    approved: '승인',
    rejected: '반려',
  },
  kindApply: '신청',
  kindInquiry: '문의',
  kindInquiryLong: '이용 가능 여부 문의',
  noMyApps: '아직 보낸 신청이 없습니다. 학교를 골라 신청하거나 문의해 보세요.',
  rejectReasonPrefix: '반려 사유: ',
  approvedNote: '자리가 배정되었습니다. 학교 안내에 따라 등원 준비를 해 주세요.',
  from: '소속: ',
  guardian: '보호자 ',
  approve: '승인',
  noSeats: '(빈자리 없음)',
  reject: '반려',
  rejectReasonLabel: '반려 사유 (학부모에게 그대로 보입니다)',
  rejectReasonPlaceholder: '예: 거주지 기준 미충족, 학년 제한 등',
  confirmReject: '반려 확정',

  backHome: '← 홈',
  schoolNotFound: (id: string) => `학교 "${id}"를 찾을 수 없습니다.`,
  classrooms: (n: number) => `오후돌봄 교실 ${n}실`,
  statsAria: '현황 숫자',
  toReview: '검토할 신청',
  settingsTitle: '공개 현황 설정',
  settingsText: '빈자리는 정원에서 현재 인원을 뺀 값입니다. 신청 가능 여부는 학교가 별도로 설정합니다.',
  enrolledTitle: '현재 인원',
  decAria: '현재 인원 1 줄이기',
  incAria: '현재 인원 1 늘리기',
  acceptingTitle: '신청 공개 상태',
  acceptingAria: '신청 가능 여부',
  listTitle: '신청 목록',
  listSummary: (pending: number, total: number) => `접수 중 ${pending} · 전체 ${total}`,
  noApps: '아직 들어온 신청이 없습니다.',

  // Korean: the server already answers in Korean, so only client-side codes need text.
  errors: {
    NETWORK: '서버에 연결할 수 없습니다. 개발 서버가 켜져 있는지 확인해 주세요.',
    HTTP_ERROR: '요청에 실패했습니다.',
    UNKNOWN: '알 수 없는 오류가 났습니다.',
  } as Record<string, string>,
};

export const messages: Record<Lang, Messages> = { en, ko };

export function schoolName(school: Pick<School, 'name' | 'nameEn'>, lang: Lang): string {
  return lang === 'en' ? school.nameEn : school.name;
}

/** Short form for map labels: 청암초 / Cheongam. */
export function shortSchoolName(school: Pick<School, 'name' | 'nameEn'>, lang: Lang): string {
  return lang === 'en' ? school.nameEn.replace(/\s+Elementary$/, '') : school.name.replace('초등학교', '초');
}

export function markerLabel(marker: MarkerState, lang: Lang): string {
  return lang === 'en' ? marker.labelEn : marker.label;
}

export function actionLabel(marker: MarkerState, lang: Lang): string | null {
  return lang === 'en' ? marker.actionLabelEn : marker.actionLabel;
}

/** English UI translates known server codes; Korean UI shows the server's own Korean message. */
export function apiErrorText(code: string, serverMessage: string, lang: Lang): string {
  if (lang === 'ko') return messages.ko.errors[code] ?? serverMessage;
  return messages.en.errors[code] ?? serverMessage;
}
