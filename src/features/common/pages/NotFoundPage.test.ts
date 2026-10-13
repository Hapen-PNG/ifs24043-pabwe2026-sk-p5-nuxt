import { describe, expect, it } from "vitest";
import NotFoundPage from "./NotFoundPage.vue";
import { renderWithProviders } from "../../../test-utils";

describe("NotFoundPage", () => {
  it("menampilkan pesan 404 dan tautan kembali", async () => {
    const { wrapper } = await renderWithProviders(NotFoundPage, { route: "/tidak-ada" });

    expect(wrapper.text()).toContain("404");
    expect(wrapper.text()).toContain("Halaman tidak ditemukan");
    expect(wrapper.find("a").attributes("href")).toBe("/");
  });
});
