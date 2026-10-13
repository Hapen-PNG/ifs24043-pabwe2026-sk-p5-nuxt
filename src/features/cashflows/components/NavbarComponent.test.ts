import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";

vi.mock("../../../helpers/toolsHelper", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../helpers/toolsHelper")>();
  return { ...actual, showConfirmDialog: vi.fn() };
});

import { showConfirmDialog } from "../../../helpers/toolsHelper";
import { createMockPinia, renderWithProviders } from "../../../test-utils";
import { useAuthStore } from "../../auth/states/authStore";
import { useUsersStore } from "../../users/states/usersStore";
import type { User } from "../../users/api/userApi";
import NavbarComponent from "./NavbarComponent.vue";

const profile: User = {
  id: 1,
  name: "Abdullah Ubaid",
  email: "ifs18005@del.ac.id",
  email_verified_at: null,
  photo: null,
  created_at: "2024-10-05T02:53:38.000000Z",
  updated_at: "2024-10-05T02:53:38.000000Z",
};

async function setup(user: User | null) {
  const pinia = createMockPinia();
  useUsersStore(pinia).$patch({ profile: user });
  const auth = useAuthStore(pinia);
  const logout = vi.spyOn(auth, "asyncLogout").mockResolvedValue(undefined);
  const result = await renderWithProviders(NavbarComponent, { pinia, route: "/" });
  return { logout, ...result };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("NavbarComponent", () => {
  it("menampilkan nama, username, dan inisial dari profil tanpa foto", async () => {
    const { wrapper } = await setup(profile);

    expect(wrapper.find("[data-testid=display-name]").text()).toBe("Abdullah Ubaid");
    expect(wrapper.text()).toContain("@ifs18005");
    expect(wrapper.text()).toContain("Sesi aktif");
    expect(wrapper.find("[data-testid=avatar-initial]").text()).toBe("A");
    expect(wrapper.find("img").exists()).toBe(false);
  });

  it("menampilkan foto profil bila tersedia", async () => {
    const { wrapper } = await setup({ ...profile, photo: "http://127.0.0.1/img/a.png" });

    expect(wrapper.find("img").attributes("src")).toBe("http://127.0.0.1/img/a.png");
    expect(wrapper.find("[data-testid=avatar-initial]").exists()).toBe(false);
  });

  it("memakai nilai cadangan saat profil belum dimuat", async () => {
    const { wrapper } = await setup(null);

    expect(wrapper.find("[data-testid=display-name]").text()).toBe("Pengguna");
    expect(wrapper.text()).toContain("@guest");
    expect(wrapper.find("[data-testid=avatar-initial]").text()).toBe("P");
  });

  it("memancarkan event toggle dari tombol menu", async () => {
    const { wrapper } = await setup(profile);

    await wrapper.find("[data-testid=toggle-sidebar]").trigger("click");

    expect(wrapper.emitted("toggle")).toHaveLength(1);
  });

  it("tidak keluar bila konfirmasi dibatalkan", async () => {
    vi.mocked(showConfirmDialog).mockResolvedValue(false);
    const { wrapper, logout, router } = await setup(profile);

    await wrapper.find("[data-testid=logout-button]").trigger("click");
    await flushPromises();

    expect(logout).not.toHaveBeenCalled();
    expect(router.currentRoute.value.path).toBe("/");
  });

  it("keluar lalu pindah ke halaman login", async () => {
    vi.mocked(showConfirmDialog).mockResolvedValue(true);
    const { wrapper, logout, router } = await setup(profile);

    await wrapper.find("[data-testid=logout-button]").trigger("click");
    await flushPromises();

    expect(logout).toHaveBeenCalledTimes(1);
    expect(router.currentRoute.value.path).toBe("/auth/login");
  });
});
