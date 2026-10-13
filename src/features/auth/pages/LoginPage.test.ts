import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";

vi.mock("../../../helpers/toolsHelper", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../helpers/toolsHelper")>();
  return { ...actual, showErrorDialog: vi.fn(), showSuccessDialog: vi.fn() };
});

import { showErrorDialog } from "../../../helpers/toolsHelper";
import { createMockPinia, renderWithProviders } from "../../../test-utils";
import { useAuthStore } from "../states/authStore";
import LoginPage from "./LoginPage.vue";

beforeEach(() => {
  vi.resetAllMocks();
});

async function setup() {
  const pinia = createMockPinia();
  const store = useAuthStore(pinia);
  const result = await renderWithProviders(LoginPage, { pinia, route: "/auth/login" });
  return { store, ...result };
}

describe("LoginPage", () => {
  it("menampilkan formulir login", async () => {
    const { wrapper } = await setup();

    expect(wrapper.find("#login-email-input").exists()).toBe(true);
    expect(wrapper.find("#login-password-input").exists()).toBe(true);
    expect(wrapper.find("button[type=submit]").text()).toContain("Masuk Sekarang");
  });

  it("menolak submit bila formulir kosong", async () => {
    const { wrapper, store } = await setup();
    const spy = vi.spyOn(store, "asyncLogin").mockResolvedValue(undefined);

    await wrapper.find("form").trigger("submit");

    expect(showErrorDialog).toHaveBeenCalledWith("Email dan kata sandi wajib diisi");
    expect(spy).not.toHaveBeenCalled();
  });

  it("menolak submit bila hanya email yang diisi", async () => {
    const { wrapper, store } = await setup();
    const spy = vi.spyOn(store, "asyncLogin").mockResolvedValue(undefined);

    await wrapper.find("#login-email-input").setValue("a@b.c");
    await wrapper.find("form").trigger("submit");

    expect(showErrorDialog).toHaveBeenCalled();
    expect(spy).not.toHaveBeenCalled();
  });

  it("login berhasil lalu pindah ke beranda", async () => {
    const { wrapper, store, router } = await setup();
    const spy = vi.spyOn(store, "asyncLogin").mockImplementation(async () => {
      store.isAuthLoggedIn = true;
    });

    await wrapper.find("#login-email-input").setValue(" a@b.c ");
    await wrapper.find("#login-password-input").setValue("123456");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(spy).toHaveBeenCalledWith("a@b.c", "123456");
    expect(router.currentRoute.value.path).toBe("/");
  });

  it("tetap di halaman login bila login gagal", async () => {
    const { wrapper, store, router } = await setup();
    vi.spyOn(store, "asyncLogin").mockResolvedValue(undefined);

    await wrapper.find("#login-email-input").setValue("a@b.c");
    await wrapper.find("#login-password-input").setValue("salah");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/auth/login");
  });

  it("menonaktifkan tombol saat proses login berjalan", async () => {
    const { wrapper, store } = await setup();

    store.isAuthLogin = true;
    await wrapper.vm.$nextTick();

    const button = wrapper.find("button[type=submit]");
    expect(button.text()).toContain("Memproses...");
    expect(button.attributes("disabled")).toBeDefined();
  });
});
