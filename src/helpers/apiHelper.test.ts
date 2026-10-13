import { afterEach, describe, expect, it, vi } from "vitest";
import {
  apiDelete,
  apiFetch,
  apiGet,
  apiPost,
  apiPut,
  getAccessToken,
  getErrorMessage,
  putAccessToken,
  removeAccessToken,
} from "./apiHelper";

const mockFetch = (body: unknown, status = 200) => {
  const fn = vi.fn().mockResolvedValue({ status, json: async () => body });
  vi.stubGlobal("fetch", fn);
  return fn;
};

const okBody = { status: "success", message: "ok", data: {} };

afterEach(() => {
  vi.unstubAllGlobals();
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
      `${DELCOM_BASEURL}/cash-flows?type=inflow&total=0`,
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

    expect(fetchMock).toHaveBeenCalledWith(`${DELCOM_BASEURL}/users`, {
      method: "GET",
      headers: { Accept: "application/json" },
      body: undefined,
    });
  });

  it("tidak menambahkan tanda tanya bila semua params kosong", async () => {
    const fetchMock = mockFetch(okBody);

    await apiGet("/users", { a: "" });

    expect(fetchMock.mock.calls[0][0]).toBe(`${DELCOM_BASEURL}/users`);
  });
});

describe("apiPost / apiPut / apiDelete", () => {
  it("apiPost mengirim body JSON", async () => {
    const fetchMock = mockFetch(okBody);

    await apiPost("/auth/login", { email: "a@b.c" });

    expect(fetchMock).toHaveBeenCalledWith(`${DELCOM_BASEURL}/auth/login`, {
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
  it("menghapus token ketika server membalas 401", async () => {
    putAccessToken("expired");
    mockFetch({ status: "fail", message: "Unauthenticated." }, 401);

    const response = await apiFetch("/users/me", { method: "GET" });

    expect(response.message).toBe("Unauthenticated.");
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
      message: "Gagal terhubung ke server",
      data: null,
    });
  });
});

describe("getErrorMessage", () => {
  it("memakai pesan utama bila data kosong", () => {
    expect(getErrorMessage({ status: "fail", message: "Gagal", data: null })).toBe("Gagal");
  });

  it("memakai pesan utama bila data bukan objek", () => {
    expect(getErrorMessage({ status: "fail", message: "Gagal", data: "x" })).toBe("Gagal");
  });

  it("memakai pesan utama bila objek tidak punya detail", () => {
    expect(getErrorMessage({ status: "fail", message: "Gagal", data: {} })).toBe("Gagal");
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
