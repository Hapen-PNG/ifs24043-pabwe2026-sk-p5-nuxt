import { afterEach, describe, expect, it, vi } from "vitest";
import {
  apiDelete,
  apiFetch,
  apiGet,
  apiPost,
  apiPut,
  DEFAULT_API_BASE_URL,
  getAccessToken,
  getApiBaseUrl,
  getErrorMessage,
  putAccessToken,
  removeAccessToken,
} from "./apiHelper";

const mockFetch = (body: unknown, status = 200) => {
  const fn = vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fn);
  return fn;
};

const API_BASE_URL = getApiBaseUrl();
const okBody = { status: "success", message: "ok", data: {} };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("token storage", () => {
  it("menyimpan, membaca, dan menghapus token", () => {
    expect(getAccessToken()).toBeNull();
    putAccessToken("abc");
    expect(getAccessToken()).toBe("abc");
    removeAccessToken();
    expect(getAccessToken()).toBeNull();
  });
});

describe("getApiBaseUrl", () => {
  it("memakai URL default ketika base URL kosong", () => {
    vi.stubEnv("VITE_DELCOM_BASEURL", "");

    expect(getApiBaseUrl()).toBe(DEFAULT_API_BASE_URL);
  });

  it("memangkas spasi dan garis miring dari URL yang dikonfigurasi", () => {
    vi.stubEnv("VITE_DELCOM_BASEURL", " https://example.test/api/// ");

    expect(getApiBaseUrl()).toBe("https://example.test/api");
  });

  it("menolak URL absolut yang tidak valid", () => {
    vi.stubEnv("VITE_DELCOM_BASEURL", "not-a-url");

    expect(() => getApiBaseUrl()).toThrow(
      "VITE_DELCOM_BASEURL harus berupa URL absolut yang valid."
    );
  });

  it("menolak protokol selain HTTP dan HTTPS", () => {
    vi.stubEnv("VITE_DELCOM_BASEURL", "ftp://example.test/api");

    expect(() => getApiBaseUrl()).toThrow(
      "VITE_DELCOM_BASEURL harus menggunakan HTTPS di production."
    );
  });

  it("menolak HTTP di production tetapi menerima HTTPS", () => {
    vi.stubEnv("PROD", true);
    vi.stubEnv("VITE_DELCOM_BASEURL", "http://example.test/api");

    expect(() => getApiBaseUrl()).toThrow(
      "VITE_DELCOM_BASEURL harus menggunakan HTTPS di production."
    );

    vi.stubEnv("VITE_DELCOM_BASEURL", "https://example.test/api");
    expect(getApiBaseUrl()).toBe("https://example.test/api");
  });
});

describe("apiGet", () => {
  it("menyusun query string, melewati nilai kosong, dan menyertakan token", async () => {
    putAccessToken("abc");
    const fetchMock = mockFetch(okBody);

    const response = await apiGet("/cash-flows", {
      type: "inflow",
      label: "",
      a: undefined,
      b: null,
      total: 0,
    });

    expect(response).toEqual(okBody);
    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE_URL}/cash-flows?type=inflow&total=0`,
      {
        method: "GET",
        headers: { Accept: "application/json", Authorization: "Bearer abc" },
        body: undefined,
      }
    );
  });

  it("tanpa token dan tanpa params", async () => {
    const fetchMock = mockFetch(okBody);

    await apiGet("/users");

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/users`, {
      method: "GET",
      headers: { Accept: "application/json" },
      body: undefined,
    });
  });

  it("tidak menambahkan tanda tanya bila semua params kosong", async () => {
    const fetchMock = mockFetch(okBody);

    await apiGet("/users", { a: "" });

    expect(fetchMock.mock.calls[0][0]).toBe(`${API_BASE_URL}/users`);
  });
});

describe("apiPost / apiPut / apiDelete", () => {
  it("apiPost mengirim body JSON", async () => {
    const fetchMock = mockFetch(okBody);

    await apiPost("/auth/login", { email: "a@b.c" });

    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify({ email: "a@b.c" }),
    });
  });

  it("apiPost mengirim FormData tanpa Content-Type manual", async () => {
    const fetchMock = mockFetch(okBody);
    const form = new FormData();
    form.append("photo", "x");

    await apiPost("/users/me/photo", form);

    const init = fetchMock.mock.calls[0][1];
    expect(init.body).toBe(form);
    expect(init.headers["Content-Type"]).toBeUndefined();
  });

  it("apiPost tanpa body", async () => {
    const fetchMock = mockFetch(okBody);

    await apiPost("/auth/logout");

    expect(fetchMock.mock.calls[0][1].body).toBeUndefined();
  });

  it("apiPut memakai metode PUT", async () => {
    const fetchMock = mockFetch(okBody);

    await apiPut("/cash-flows/1", { label: "x" });

    expect(fetchMock.mock.calls[0][1].method).toBe("PUT");
  });

  it("apiDelete memakai metode DELETE", async () => {
    const fetchMock = mockFetch(okBody);

    await apiDelete("/cash-flows/1");

    expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
  });
});

describe("apiFetch", () => {
  it("mengembalikan error konfigurasi saat URL dasar invalid", async () => {
    vi.stubEnv("VITE_DELCOM_BASEURL", "not-a-url");

    const response = await apiFetch("/users", { method: "GET" });

    expect(response).toEqual({
      status: "fail",
      message: "VITE_DELCOM_BASEURL harus berupa URL absolut yang valid.",
      data: null,
      errorCode: "configuration",
    });
  });

  it("menggunakan pesan fallback jika kegagalan membuat URL bukan Error", async () => {
    const params = new Proxy(
      {},
      {
        ownKeys() {
          throw null;
        },
      }
    );
    const response = await apiFetch("/users", { method: "GET", params });

    expect(response.message).toBe("Konfigurasi URL API tidak valid.");
    expect(response.errorCode).toBe("configuration");
  });

  it("menghapus token ketika server membalas 401", async () => {
    putAccessToken("expired");
    mockFetch({ status: "fail", message: "Unauthenticated." }, 401);

    const response = await apiFetch("/users/me", { method: "GET" });

    expect(response.message).toBe("Unauthenticated.");
    expect(response.httpStatus).toBe(401);
    expect(getAccessToken()).toBeNull();
  });

  it("mempertahankan token untuk status selain 401", async () => {
    putAccessToken("valid");
    mockFetch(okBody, 200);

    await apiFetch("/users/me", { method: "GET" });

    expect(getAccessToken()).toBe("valid");
  });

  it("mengembalikan respons fail ketika jaringan bermasalah", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    const response = await apiFetch("/users", { method: "GET" });

    expect(response).toEqual({
      status: "fail",
      message:
        "Gagal terhubung ke server. Periksa koneksi internet dan URL API.",
      data: null,
      errorCode: "network",
    });
  });

  it("menyimpan status HTTP ketika server membalas 404", async () => {
    mockFetch({ status: "fail", message: "Not found", data: null }, 404);

    const response = await apiFetch("/auth/login", { method: "POST" });

    expect(response.httpStatus).toBe(404);
    expect(getErrorMessage(response)).toContain("Endpoint API tidak ditemukan (404)");
  });

  it("membedakan error HTTP 500", async () => {
    mockFetch({ status: "fail", message: "Internal error", data: null }, 500);

    const response = await apiFetch("/auth/login", { method: "POST" });

    expect(getErrorMessage(response)).toContain("Server API mengalami gangguan (500)");
  });

  it("tetap mengklasifikasikan halaman error non-JSON berdasarkan status HTTP", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 404,
        ok: false,
        json: async () => {
          throw new Error("Not JSON");
        },
      })
    );

    const response = await apiFetch("/auth/login", { method: "POST" });

    expect(response.httpStatus).toBe(404);
    expect(getErrorMessage(response)).toContain("Endpoint API tidak ditemukan (404)");
  });

  it("mengembalikan error ketika respons sukses bukan JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        status: 200,
        ok: true,
        json: async () => {
          throw new Error("Not JSON");
        },
      })
    );

    const response = await apiFetch("/users", { method: "GET" });

    expect(response).toEqual({
      status: "fail",
      message: "Server mengirim respons yang tidak valid (bukan JSON).",
      data: null,
      errorCode: "invalid_response",
    });
  });
});

describe("getErrorMessage", () => {
  it("memakai pesan utama bila data kosong", () => {
    expect(getErrorMessage({ status: "fail", message: "Gagal", data: null })).toBe("Gagal");
  });

  it("membedakan error HTTP 401", () => {
    expect(
      getErrorMessage({
        status: "fail",
        message: "Unauthorized",
        data: null,
        httpStatus: 401,
      })
    ).toContain("Autentikasi gagal atau akses tidak diizinkan (401)");
  });

  it("memakai pesan utama bila data bukan objek", () => {
    expect(getErrorMessage({ status: "fail", message: "Gagal", data: "x" })).toBe("Gagal");
  });

  it("memakai pesan utama bila objek tidak punya detail", () => {
    expect(getErrorMessage({ status: "fail", message: "Gagal", data: {} })).toBe("Gagal");
  });

  it("mengembalikan pesan asli untuk kegagalan jaringan dan konfigurasi", () => {
    expect(
      getErrorMessage({
        status: "fail",
        message: "Koneksi terputus",
        data: null,
        errorCode: "network",
      })
    ).toBe("Koneksi terputus");
    expect(
      getErrorMessage({
        status: "fail",
        message: "URL API tidak valid",
        data: null,
        errorCode: "configuration",
      })
    ).toBe("URL API tidak valid");
  });

  it("memformat status HTTP selain 401, 404, dan 5xx", () => {
    expect(
      getErrorMessage({
        status: "fail",
        message: "Forbidden",
        data: null,
        httpStatus: 403,
      })
    ).toBe("Permintaan gagal (HTTP 403). Forbidden");
  });

  it("menggabungkan detail validasi per-field", () => {
    expect(
      getErrorMessage({
        status: "fail",
        message: "Data tidak valid",
        data: { label: ["Label wajib diisi"], nominal: ["Harus angka", "Minimal 1"] },
      })
    ).toBe("Data tidak valid: Label wajib diisi, Harus angka, Minimal 1");
  });
});
