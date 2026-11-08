/** Shared domain types for 돌봄빈자리. Used by server, web, and rule tests. */

/** Whether a school accepts applications. Decided by the school, never computed. */
export type SchoolStatus = 'closed' | 'check' | 'open';

export interface Bundle {
  id: string;
  /** Korean display name, e.g. "운정 가까운 학교 묶음" */
  name: string;
  nameEn: string;
}

export interface School {
  id: string;
  bundleId: string;
  name: string;
  nameEn: string;
  address: string;
  /** Number of afternoon-care classrooms (public data). */
  classrooms: number;
  /** capacity = classrooms × 20 (sample assumption). */
  capacity: number;
  /** Current enrolled children (SAMPLE DATA, not real). */
  current: number;
  status: SchoolStatus;
  lat: number | null;
  lng: number | null;
  /** ISO timestamp of the last update by the school. */
  updatedAt: string;
  /** Shown to parents of this school when it is full (Korean / English). */
  waitlistNote: string;
  waitlistNoteEn: string;
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected';

/** 'apply' from an open school, 'inquiry' from a school that still needs to check. */
export type ApplicationKind = 'apply' | 'inquiry';

export interface Application {
  id: string;
  /** School the parent applies to. */
  schoolId: string;
  /** The child's own school (must be in the same bundle). */
  homeSchoolId: string;
  kind: ApplicationKind;
  childName: string;
  grade: number;
  guardianPhone: string;
  status: ApplicationStatus;
  rejectReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Db {
  bundles: Bundle[];
  schools: School[];
  applications: Application[];
}

export interface NewApplicationInput {
  schoolId: string;
  homeSchoolId: string;
  childName: string;
  grade: number;
  guardianPhone: string;
}
