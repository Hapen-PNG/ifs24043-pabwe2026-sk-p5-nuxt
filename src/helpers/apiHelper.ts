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
  httpStatus?: number;
  errorCode?: "network" | "configuration" | "invalid_response";
}

export const DEFAULT_API_BASE_URL = "https://open-api.delcom.org/api/v1";

export function getApiBaseUrl(): string {
  const configuredBaseUrl = import.meta.env.VITE_DELCOM_BASEURL?.trim();
  const baseUrl = (configuredBaseUrl || DEFAULT_API_BASE_URL).replace(/\/+$/, "");

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(baseUrl);
  } catch {
    throw new Error("VITE_DELCOM_BASEURL harus berupa URL absolut yang valid.");
  }

  if (
    (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") ||
    (import.meta.env.PROD && parsedUrl.protocol !== "https:")
  ) {
    throw new Error("VITE_DELCOM_BASEURL harus menggunakan HTTPS di production.");
  }

  return baseUrl;
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
  const url = `${getApiBaseUrl()}${path}`;
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

  let url: string;
  try {
    url = buildUrl(path, options.params);
  } catch (error) {
    return {
      status: "fail",
      message:
        error instanceof Error
          ? error.message
          : "Konfigurasi URL API tidak valid.",
      data: null as T,
      errorCode: "configuration",
    };
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method,
      headers,
      body,
    });
  } catch {
    return {
      status: "fail",
      message:
        "Gagal terhubung ke server. Periksa koneksi internet dan URL API.",
      data: null as T,
      errorCode: "network",
    };
  }

  if (response.status === 401) {
    removeAccessToken();
  }

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    // The HTTP status below remains useful when a server returns a non-JSON error page.
  }

  if (!response.ok) {
    return {
      status: "fail",
      message: payload?.message || `Permintaan gagal (HTTP ${response.status}).`,
      data: payload?.data ?? (null as T),
      httpStatus: response.status,
    };
  }

  if (!payload) {
    return {
      status: "fail",
      message: "Server mengirim respons yang tidak valid (bukan JSON).",
      data: null as T,
      errorCode: "invalid_response",
    };
  }

  return payload;
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
  if (response.errorCode === "network") {
    return response.message;
  }

  if (response.errorCode === "configuration") {
    return response.message;
  }

  const httpMessage =
    response.httpStatus === 404
      ? "Endpoint API tidak ditemukan (404). Periksa URL dasar dan path endpoint."
      : response.httpStatus === 401
        ? "Autentikasi gagal atau akses tidak diizinkan (401)."
        : response.httpStatus !== undefined && response.httpStatus >= 500
          ? `Server API mengalami gangguan (${response.httpStatus}). Coba lagi beberapa saat.`
          : response.httpStatus
            ? `Permintaan gagal (HTTP ${response.httpStatus}).`
            : "";
  const details =
    response.data && typeof response.data === "object"
      ? Object.values(response.data).flat().join(", ")
      : "";
  const message =
    httpMessage && response.message
      ? `${httpMessage} ${response.message}`
      : httpMessage || response.message;

  return details ? `${message}: ${details}` : message;
}
    