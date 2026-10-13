import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";

vi.mock("../../../helpers/toolsHelper", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../helpers/toolsHelper")>();
  return { ...actual, showErrorDialog: vi.fn(), showSuccessDialog: vi.fn() };
});

import { showErrorDialog } from "../../../helpers/toolsHelper";
import { createMockPinia, renderWithProviders } from "../../../test-utils";
import { useAuthStore } from "../states/authStore";
import RegisterPage from "./RegisterPage.vue";

beforeEach(() => {
  vi.resetAllMocks();
});

async function setup() {
  const pinia = createMockPinia();
  const store = useAuthStore(pinia);
  const result = await renderWithProviders(RegisterPage, { pinia, route: "/auth/register" });
  return { store, ...result };
}

async function fill(wrapper: Awaited<ReturnType<typeof setup>>["wrapper"]) {
  await wrapper.find("#register-name-input").setValue(" Delcom ");
  await wrapper.find("#register-email-input").setValue("a@b.c");
  await wrapper.find("#register-password-input").setValue("123456");
}

describe("RegisterPage", () => {
  it("menampilkan formulir registrasi", async () => {
    const { wrapper } = await setup();

    expect(wrapper.find("#register-name-input").exists()).toBe(true);
    expect(wrapper.find("#register-email-input").exists()).toBe(true);
    expect(wrapper.find("#register-password-input").exists()).toBe(true);
    expect(wrapper.find("button[type=submit]").text()).toContain("Daftar Sekarang");
  });

  it("menolak submit bila ada kolom kosong", async () => {
    const { wrapper, store } = await setup();
    const spy = vi.spyOn(store, "asyncRegister").mockResolvedValue(undefined);

    await wrapper.find("form").trigger("submit");

    expect(showErrorDialog).toHaveBeenCalledWith("Nama, email, dan kata sandi wajib diisi");
    expect(spy).not.toHaveBeenCalled();
  });

  it("registrasi berhasil lalu pindah ke halaman login", async () => {
    const { wrapper, store, router } = await setup();
    const spy = vi.spyOn(store, "asyncRegister").mockImplementation(async () => {
      store.isAuthRegistered = true;
    });

    await fill(wrapper);
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(spy).toHaveBeenCalledWith("Delcom", "a@b.c", "123456");
    expect(router.currentRoute.value.path).toBe("/auth/login");
  });

  it("tetap di halaman registrasi bila gagal", async () => {
    const { wrapper, store, router } = await setup();
    vi.spyOn(store, "asyncRegister").mockResolvedValue(undefined);

    await fill(wrapper);
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/auth/register");
  });

  it("menonaktifkan tombol saat proses registrasi berjalan", async () => {
    const { wrapper, store } = await setup();

    store.isAuthRegister = true;
    await wrapper.vm.$nextTick();

    const button = wrapper.find("button[type=submit]");
    expect(button.text()).toContain("Memproses...");
    expect(button.attributes("disabled")).toBeDefined();
  });
});
