// ─── Foodzie API Utility ───────────────────────────────────────────────────────
// A thin fetch wrapper that automatically attaches the stored JWT to every request.
// Usage:
//   import { api } from '@/lib/api';
//   const data = await api.get<{ categories: Category[] }>('/api/vendor/categories');
//   await api.post('/api/auth/login', { email, password });

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
const TOKEN_KEY = 'foodzie_token';

// ─── Token helpers (client-side only) ────────────────────────────────────────
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

/** Decode a JWT payload without verifying the signature (client-side only). */
export function decodeToken<T = Record<string, unknown>>(token: string): T | null {
  try {
    const payloadB64 = token.split('.')[1];
    const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

/** Returns true if a stored token exists and is not yet expired. */
export function isTokenValid(): boolean {
  const token = getToken();
  if (!token) return false;
  const payload = decodeToken<{ exp: number; role: string }>(token);
  if (!payload) return false;
  return payload.exp > Date.now() / 1000;
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isRaw = false,
): Promise<T> {
  let token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: 'include',
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  // Intercept 401 Unauthorized errors and attempt to refresh
  if (res.status === 401 && !['/api/auth/login', '/api/auth/register', '/api/auth/refresh', '/api/auth/me'].includes(path)) {
    try {
      const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh`, {
        method: 'GET',
        credentials: 'include',
      });

      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const newToken = refreshData.token;
        setToken(newToken);

        // Retry the original request with the new access token
        headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(`${BASE_URL}${path}`, {
          method,
          headers,
          credentials: 'include',
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        });
      } else {
        removeToken();
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    } catch (e) {
      removeToken();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
  }

  if (isRaw) return res as unknown as T;

  let data: any = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch (e) {
      console.warn("[API] Failed to parse JSON response");
    }
  }

  if (!res.ok) {
    const errorMsg = data?.message || data?.error || `Request failed with status ${res.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

// ─── Public API surface ───────────────────────────────────────────────────────
export const api = {
  get:    <T>(path: string)                  => request<T>('GET',    path),
  post:   <T>(path: string, body: unknown)   => request<T>('POST',   path, body),
  patch:  <T>(path: string, body: unknown)   => request<T>('PATCH',  path, body),
  delete: <T>(path: string)                  => request<T>('DELETE', path),
};
