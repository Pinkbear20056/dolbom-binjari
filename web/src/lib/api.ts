import type { Application, Bundle, School, SchoolStatus } from '../../../shared/types';

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    });
  } catch {
    throw new ApiError(0, 'NETWORK', '서버에 연결할 수 없습니다. 개발 서버가 켜져 있는지 확인해 주세요.');
  }
  if (!res.ok) {
    let code = 'HTTP_ERROR';
    let message = `요청에 실패했습니다 (HTTP ${res.status}).`;
    try {
      const body = (await res.json()) as { code?: string; message?: string };
      if (body.code) code = body.code;
      if (body.message) message = body.message;
    } catch {
      /* body was not JSON; keep defaults */
    }
    throw new ApiError(res.status, code, message);
  }
  return (await res.json()) as T;
}

export const api = {
  schools: () => call<School[]>('/api/schools'),
  bundles: () => call<Bundle[]>('/api/bundles'),
  bundle: (schoolId: string) => call<{ bundle: Bundle | null; schools: School[] }>(`/api/bundle?schoolId=${encodeURIComponent(schoolId)}`),
  applicationsByIds: (ids: string[]) =>
    ids.length === 0 ? Promise.resolve<Application[]>([]) : call<Application[]>(`/api/applications?ids=${encodeURIComponent(ids.join(','))}`),
  schoolApplications: (schoolId: string) => call<Application[]>(`/api/schools/${encodeURIComponent(schoolId)}/applications`),
  createApplication: (body: { schoolId: string; homeSchoolId: string; childName: string; grade: number; guardianPhone: string }) =>
    call<Application>('/api/applications', { method: 'POST', body: JSON.stringify(body) }),
  updateSchool: (schoolId: string, patch: { current?: number; status?: SchoolStatus }) =>
    call<School>(`/api/schools/${encodeURIComponent(schoolId)}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  approve: (id: string) => call<{ school: School; application: Application }>(`/api/applications/${encodeURIComponent(id)}/approve`, { method: 'POST' }),
  reject: (id: string, reason: string) =>
    call<Application>(`/api/applications/${encodeURIComponent(id)}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  reset: () => call<{ ok: boolean }>('/api/reset', { method: 'POST' }),
};

export function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return '알 수 없는 오류가 났습니다.';
}
