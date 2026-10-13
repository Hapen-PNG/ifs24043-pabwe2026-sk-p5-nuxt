import { describe, expect, it } from "vitest";
import AuthLayout from "./AuthLayout.vue";
import { renderWithProviders } from "../../../test-utils";

describe("AuthLayout", () => {
  it("menandai tab Masuk Akun aktif pada /auth/login", async () => {
    const { wrapper } = await renderWithProviders(AuthLayout, { route: "/auth/login" });

    expect(wrapper.text()).toContain("Delcom Cash Flow");
    expect(wrapper.find("[data-testid=tab-login]").classes()).toContain("text-indigo-600");
    expect(wrapper.find("[data-testid=tab-register]").classes()).toContain("text-slate-600");
  });

  it("menandai tab Daftar Baru aktif pada /auth/register", async () => {
    const { wrapper } = await renderWithProviders(AuthLayout, { route: "/auth/register" });

    expect(wrapper.find("[data-testid=tab-register]").classes()).toContain("text-indigo-600");
    expect(wrapper.find("[data-testid=tab-login]").classes()).toContain("text-slate-600");
  });
});
