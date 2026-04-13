const BASE_URL = '/api/v1';

interface RequestOptions {
  method?: string;
  body?: unknown;
  signal?: AbortSignal;
}

class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const token = localStorage.getItem('accessToken');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  if (response.status === 401 && path !== '/auth/login' && path !== '/auth/register') {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;
      const retried = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal,
      });
      if (!retried.ok) {
        const err = await retried.json().catch(() => ({ error: 'Request failed' }));
        throw new ApiError(retried.status, (err as { error: string }).error ?? 'Request failed');
      }
      if (retried.status === 204) return undefined as T;
      const json = await retried.json() as { data: T };
      return json.data;
    } else {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/auth/login';
      throw new ApiError(401, 'Session expired');
    }
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new ApiError(response.status, (err as { error: string }).error ?? 'Request failed');
  }

  if (response.status === 204) return undefined as T;

  const json = await response.json() as { data: T };
  return json.data;
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const json = await response.json() as { data: { accessToken: string; refreshToken: string } };
    localStorage.setItem('accessToken', json.data.accessToken);
    localStorage.setItem('refreshToken', json.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function requestForm<T>(path: string, formData: FormData): Promise<T> {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem('accessToken');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new ApiError(response.status, (err as { error: string }).error ?? 'Upload failed');
  }

  const json = await response.json() as { data: T };
  return json.data;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  postForm: <T>(path: string, formData: FormData) => requestForm<T>(path, formData),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T = void>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export { ApiError };
