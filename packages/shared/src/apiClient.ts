// Minimal fetch-based API client shared by the Writer and Reader apps.
// Both apps talk to the same WordVrs backend, so auth/session handling lives here once.

export interface ApiClientOptions {
  baseUrl: string;
  getToken?: () => string | null;
  onUnauthorized?: () => void;
}

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export class ApiClient {
  private baseUrl: string;
  private getToken?: () => string | null;
  private onUnauthorized?: () => void;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.getToken = options.getToken;
    this.onUnauthorized = options.onUnauthorized;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    let url = `${this.baseUrl}${path}`;
    if (query) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(query)) {
        if (v !== undefined) params.set(k, String(v));
      }
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const token = this.getToken?.();
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      this.onUnauthorized?.();
    }

    const contentType = res.headers.get("content-type") ?? "";
    const data = contentType.includes("application/json") ? await res.json() : undefined;

    if (!res.ok) {
      throw new ApiError(res.status, (data && (data as any).error) || res.statusText, data);
    }
    return data as T;
  }

  get<T>(path: string, query?: Record<string, string | number | boolean | undefined>) {
    return this.request<T>("GET", path, undefined, query);
  }
  post<T>(path: string, body?: unknown) {
    return this.request<T>("POST", path, body);
  }
  put<T>(path: string, body?: unknown) {
    return this.request<T>("PUT", path, body);
  }
  patch<T>(path: string, body?: unknown) {
    return this.request<T>("PATCH", path, body);
  }
  delete<T>(path: string) {
    return this.request<T>("DELETE", path);
  }
}
