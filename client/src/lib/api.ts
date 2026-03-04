const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4020/api';

interface FetchOptions extends RequestInit {
  token?: string;
}

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function fetchApi<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> || {}),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new ApiError(data.message || 'Request failed', res.status);
  }
  return res.json();
}

// Auth
export async function login(email: string, password: string) {
  return fetchApi<{ user: any; tokens: { accessToken: string; refreshToken: string } }>('/auth/login', {
    method: 'POST', body: JSON.stringify({ email, password }),
  });
}

export async function refreshToken(refreshToken: string) {
  return fetchApi<{ tokens: { accessToken: string; refreshToken: string } }>('/auth/refresh', {
    method: 'POST', body: JSON.stringify({ refreshToken }),
  });
}

export async function logout(token: string) {
  return fetchApi('/auth/logout', { method: 'POST', token });
}

export async function getMe(token: string) {
  return fetchApi<any>('/auth/me', { token });
}

export async function getTestUsers() {
  return fetchApi<{ email: string; name: string; role: string }[]>('/auth/test-users');
}

// Requests
export async function createRequest(token: string, data: any) {
  return fetchApi<any>('/requests', { method: 'POST', body: JSON.stringify(data), token });
}

export async function getRequests(token: string, params?: Record<string, string>) {
  const query = params ? '?' + new URLSearchParams(params).toString() : '';
  return fetchApi<{ data: any[]; total: number; page: number; limit: number; totalPages: number }>(`/requests${query}`, { token });
}

export async function getRequest(token: string, id: number) {
  return fetchApi<any>(`/requests/${id}`, { token });
}

export async function managerReview(token: string, id: number, data: { decision: string; notes?: string }) {
  return fetchApi<any>(`/requests/${id}/manager-review`, { method: 'POST', body: JSON.stringify(data), token });
}

export async function itReview(token: string, id: number, data: { decision: string; notes?: string }) {
  return fetchApi<any>(`/requests/${id}/it-review`, { method: 'POST', body: JSON.stringify(data), token });
}

export async function updateRequestStatus(token: string, id: number, data: { status: string; comment?: string }) {
  return fetchApi<any>(`/requests/${id}/status`, { method: 'PATCH', body: JSON.stringify(data), token });
}

export async function cancelRequest(token: string, id: number) {
  return fetchApi<any>(`/requests/${id}/cancel`, { method: 'POST', token });
}

export async function addComment(token: string, id: number, comment: string) {
  return fetchApi<any>(`/requests/${id}/comments`, { method: 'POST', body: JSON.stringify({ comment }), token });
}

// Dashboard
export async function getDashboard(token: string) {
  return fetchApi<any>('/dashboard', { token });
}

// Users
export async function getUsers(token: string) {
  return fetchApi<any[]>('/users', { token });
}

export async function getManagers() {
  return fetchApi<{ id: number; name: string; email: string }[]>('/users/managers');
}

// Departments
export async function getDepartments(token: string) {
  return fetchApi<any[]>('/departments', { token });
}

export { ApiError };
