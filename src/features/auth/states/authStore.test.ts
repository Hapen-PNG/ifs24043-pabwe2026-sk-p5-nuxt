import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/authApi", () => ({
  postLogin: vi.fn(),
  postRegister: vi.fn(),
  postLogout: vi.fn(),
}));
vi.mock("../../../helpers/toolsHelper", () => ({
  showErrorDialog: vi.fn(),
  showSuccessDialog: vi.fn(),
}));

import { postLogin, postLogout, postRegister } from "../api/authApi";
import { getAccessToken, putAccessToken } from "../../../helpers/apiHelper";
import { showErrorDialog, showSuccessDialog } from "../../../helpers/toolsHelper";
import { createMockPinia } from "../../../test-utils";
import { useAuthStore } from "./authStore";

beforeEach(() => {
  vi.resetAllMocks();
  createMockPinia();
});

describe("authStore", () => {
  it("memiliki state awal tanpa token", () => {
    const store = useAuthStore();

    expect(store.token).toBeNull();
    expect(store.isAuthenticated).toBe(false);
    expect(store.isAuthLogin).toBe(false);
  });

  it("memulihkan token dari localStorage", () => {
    putAccessToken("saved-token");

    const store = useAuthStore();

    expect(store.token).toBe("saved-token");
    expect(store.isAuthenticated).toBe(true);
  });

  describe("asyncLogin", () => {
    it("menyimpan token saat berhasil", async () => {
      vi.mocked(postLogin).mockResolvedValue({
        status: "success",
        message: "Berhasil login",
        data: { user: { id: 1, name: "A", email: "a@b.c" }, token: "tok" },
      });
      const store = useAuthStore();

      await store.asyncLogin("a@b.c", "123456");

      expect(postLogin).toHaveBeenCalledWith("a@b.c", "123456");
      expect(store.token).toBe("tok");
      expect(getAccessToken()).toBe("tok");
      expect(store.isAuthLoggedIn).toBe(true);
      expect(store.isAuthLogin).toBe(false);
    });

    it("menampilkan dialog error saat gagal", async () => {
      vi.mocked(postLogin).mockResolvedValue({
        status: "fail",
        message: "Kredensial akun tidak ditemukan",
        data: null,
      });
      const store = useAuthStore();

      await store.asyncLogin("a@b.c", "salah");

      expect(showErrorDialog).toHaveBeenCalledWith("Kredensial akun tidak ditemukan");
      expect(store.token).toBeNull();
      expect(store.isAuthLoggedIn).toBe(false);
      expect(store.isAuthLogin).toBe(false);
    });
  });

  describe("asyncRegister", () => {
    it("menandai pendaftaran berhasil dan menampilkan dialog sukses", async () => {
      vi.mocked(postRegister).mockResolvedValue({
        status: "success",
        message: "Berhasil melakukan pendaftaran",
        data: null,
      });
      const store = useAuthStore();

      await store.asyncRegister("Nama", "a@b.c", "123456");

      expect(postRegister).toHaveBeenCalledWith("Nama", "a@b.c", "123456");
      expect(store.isAuthRegistered).toBe(true);
      expect(store.isAuthRegister).toBe(false);
      expect(showSuccessDialog).toHaveBeenCalledWith("Berhasil melakukan pendaftaran");
    });

    it("menampilkan detail validasi saat gagal", async () => {
      vi.mocked(postRegister).mockResolvedValue({
        status: "fail",
        message: "Data tidak valid",
        data: { email: ["Email sudah digunakan"] },
      });
      const store = useAuthStore();

      await store.asyncRegister("Nama", "a@b.c", "123456");

      expect(showErrorDialog).toHaveBeenCalledWith("Data tidak valid: Email sudah digunakan");
      expect(store.isAuthRegistered).toBe(false);
    });
  });

  describe("asyncLogout", () => {
    it("menghapus token lokal", async () => {
      putAccessToken("tok");
      vi.mocked(postLogout).mockResolvedValue({
        status: "success",
        message: "Berhasil logout",
        data: null,
      });
      const store = useAuthStore();

      await store.asyncLogout();

      expect(postLogout).toHaveBeenCalled();
      expect(store.token).toBeNull();
      expect(getAccessToken()).toBeNull();
      expect(store.isAuthLoggedOut).toBe(true);
      expect(store.isAuthLogout).toBe(false);
    });
  });
});
