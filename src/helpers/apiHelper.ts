const ACCESS_TOKEN_KEY = "delcom_access_token";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export interface ApiOptions {
  method: HttpMethod;
  params?: object;
  body?: unknown;
}

export interface ApiResponse<T = any> {
  status: string;
  message: string;
  data: T;
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function putAccessToken(token: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function removeAccessToken(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

function buildUrl(path: string, params?: object): string {
  const url = `${DELCOM_BASEURL}${path}`;
  if (!params) {
    return url;
  }

  const search = new URLSearchParams();
  Object.entries(params as Record<string, unknown>).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `${url}?${query}` : url;
}

/**
 * Wrapper fetch ke REST API Delcom.
 * - Menyisipkan header `Authorization: Bearer <token>` bila token tersedia.
 * - Body berupa FormData dikirim apa adanya, selain itu di-serialize sebagai JSON.
 * - Tidak pernah melempar error: kegagalan jaringan dikembalikan sebagai respons `fail`.
 */
export async function apiFetch<T = any>(
  path: string,
  options: ApiOptions
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { Accept: "application/json" };

  const token = getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(buildUrl(path, options.params), {
      method: options.method,
      headers,
      body,
    });

    if (response.status === 401) {
      removeAccessToken();
    }

    return (await response.json()) as ApiResponse<T>;
  } catch {
    return {
      status: "fail",
      message: "Gagal terhubung ke server",
      data: null as T,
    };
  }
}

export const apiGet = <T = any>(path: string, params?: object) =>
  apiFetch<T>(path, { method: "GET", params });

export const apiPost = <T = any>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: "POST", body });

export const apiPut = <T = any>(path: string, body?: unknown) =>
  apiFetch<T>(path, { method: "PUT", body });

export const apiDelete = <T = any>(path: string) =>
  apiFetch<T>(path, { method: "DELETE" });

/**
 * Menggabungkan pesan utama dengan detail validasi per-field (bila ada).
 */
export function getErrorMessage(response: ApiResponse): string {
  const details =
    response.data && typeof response.data === "object"
      ? Object.values(response.data).flat().join(", ")
      : "";

  return details ? `${response.message}: ${details}` : response.message;
}
    