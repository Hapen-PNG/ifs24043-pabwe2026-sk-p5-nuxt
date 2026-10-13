import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test-utils";
import SidebarComponent from "./SidebarComponent.vue";

describe("SidebarComponent", () => {
  it("menampilkan tiga menu navigasi", async () => {
    const { wrapper } = await renderWithProviders(SidebarComponent, { props: { open: false } });

    const links = wrapper.findAll("a");
    expect(links.map((link) => link.text())).toEqual([
      "Ringkasan Arus Kas",
      "Direktori Pengguna",
      "Profil Saya",
    ]);
    expect(links.map((link) => link.attributes("href"))).toEqual(["/", "/users", "/profile"]);
  });

  it("tersembunyi dan tanpa overlay saat ditutup", async () => {
    const { wrapper } = await renderWithProviders(SidebarComponent, { props: { open: false } });

    expect(wrapper.find("[data-testid=sidebar-overlay]").exists()).toBe(false);
    expect(wrapper.find("[data-testid=sidebar]").classes()).toContain("-translate-x-full");
  });

  it("tampil dengan overlay saat dibuka", async () => {
    const { wrapper } = await renderWithProviders(SidebarComponent, { props: { open: true } });

    expect(wrapper.find("[data-testid=sidebar-overlay]").exists()).toBe(true);
    expect(wrapper.find("[data-testid=sidebar]").classes()).toContain("translate-x-0");
  });

  it("memancarkan close dari overlay, tombol tutup, dan tautan menu", async () => {
    const { wrapper } = await renderWithProviders(SidebarComponent, { props: { open: true } });

    await wrapper.find("[data-testid=sidebar-overlay]").trigger("click");
    await wrapper.find("[data-testid=close-sidebar]").trigger("click");
    await wrapper.find("a").trigger("click");

    expect(wrapper.emitted("close")).toHaveLength(3);
  });
});
