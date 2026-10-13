import { describe, expect, it } from "vitest";
import { flushPromises } from "@vue/test-utils";
import App from "./App.vue";
import { putAccessToken } from "./helpers/apiHelper";
import { renderWithProviders, StubPage } from "./test-utils";

const routes = [
  { path: "/", component: StubPage, meta: { requiresAuth: true } },
  { path: "/auth/login", component: StubPage, meta: { guestOnly: true } },
  { path: "/public", component: StubPage },
];

describe("App", () => {
  it("mengarahkan tamu dari halaman terproteksi ke login", async () => {
    const { router } = await renderWithProviders(App, { route: "/", routes });
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/auth/login");
  });

  it("mengarahkan pengguna yang sudah login dari halaman auth ke beranda", async () => {
    putAccessToken("token");

    const { router } = await renderWithProviders(App, { route: "/auth/login", routes });
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/");
  });

  it("membiarkan pengguna login tetap di halaman terproteksi", async () => {
    putAccessToken("token");

    const { router } = await renderWithProviders(App, { route: "/", routes });
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/");
  });

  it("membiarkan tamu tetap di halaman auth", async () => {
    const { router } = await renderWithProviders(App, { route: "/auth/login", routes });
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/auth/login");
  });

  it("tidak mengganggu halaman publik", async () => {
    const { router } = await renderWithProviders(App, { route: "/public", routes });
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/public");
  });
});
