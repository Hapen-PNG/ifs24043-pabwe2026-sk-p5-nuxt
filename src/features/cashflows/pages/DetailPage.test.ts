import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";

vi.mock("../../../helpers/toolsHelper", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../helpers/toolsHelper")>();
  return { ...actual, showConfirmDialog: vi.fn(), showErrorDialog: vi.fn(), showSuccessDialog: vi.fn() };
});

import { showConfirmDialog } from "../../../helpers/toolsHelper";
import { createMockPinia, renderWithProviders, StubPage } from "../../../test-utils";
import { useCashFlowsStore } from "../states/cashFlowsStore";
import type { CashFlow } from "../api/cashFlowApi";
import ChangeModal from "../modals/ChangeModal.vue";
import DetailPage from "./DetailPage.vue";

const item: CashFlow = {
  id: 4,
  user_id: 1,
  type: "outflow",
  source: "savings",
  label: "alat-elektronik",
  description: "Membeli keyboard dan mouse",
  nominal: 400000,
  created_at: "2024-10-05T12:09:16.000000Z",
  updated_at: "2024-10-05T12:09:16.000000Z",
};

const routes = [
  { path: "/cash-flows/:cashFlowId", component: StubPage },
  { path: "/", component: StubPage },
];

const normalize = (text: string) => text.replace(/\s/g, " ");

async function setup(patch: Record<string, unknown> = {}) {
  const pinia = createMockPinia();
  const store = useCashFlowsStore(pinia);
  const spies = {
    get: vi.spyOn(store, "asyncGetCashFlow").mockResolvedValue(undefined),
    del: vi.spyOn(store, "asyncDeleteCashFlow").mockResolvedValue(undefined),
  };
  store.$patch(patch);
  const result = await renderWithProviders(DetailPage, {
    pinia,
    routes,
    route: "/cash-flows/4",
  });
  await flushPromises();
  return { store, spies, ...result };
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("DetailPage", () => {
  it("memuat transaksi berdasarkan ID pada rute", async () => {
    const { spies } = await setup();

    expect(spies.get).toHaveBeenCalledWith("4");
  });

  it("menampilkan status memuat", async () => {
    const { wrapper } = await setup({ isCashFlow: true });

    expect(wrapper.text()).toContain("Memuat rincian transaksi");
  });

  it("menampilkan pesan bila transaksi tidak ditemukan", async () => {
    const { wrapper } = await setup();

    expect(wrapper.text()).toContain("Transaksi tidak ditemukan");
    expect(wrapper.find("[data-testid=detail-card]").exists()).toBe(false);
  });

  it("menampilkan rincian lengkap transaksi", async () => {
    const { wrapper } = await setup({ cashFlow: item });

    const text = normalize(wrapper.text());
    expect(text).toContain("alat-elektronik");
    expect(text).toContain("Pengeluaran");
    expect(text).toContain("Tabungan");
    expect(text).toContain("Membeli keyboard dan mouse");
    expect(text).toContain("2024");
    expect(normalize(wrapper.find("[data-testid=detail-nominal]").text())).toBe("Rp 400.000");
  });

  it("menampilkan strip bila keterangan kosong", async () => {
    const { wrapper } = await setup({ cashFlow: { ...item, description: "" } });

    expect(wrapper.find("[data-testid=detail-description]").text()).toBe("-");
  });

  it("membuka modal ubah, menutupnya, dan memuat ulang setelah disimpan", async () => {
    const { wrapper, spies } = await setup({ cashFlow: item });
    expect(wrapper.find("[data-testid=change-modal]").exists()).toBe(false);

    await wrapper.find("[data-testid=edit-button]").trigger("click");
    expect(wrapper.find("[data-testid=change-modal]").exists()).toBe(true);

    wrapper.findComponent(ChangeModal).vm.$emit("saved");
    await flushPromises();
    expect(spies.get).toHaveBeenCalledTimes(2);

    wrapper.findComponent(ChangeModal).vm.$emit("close");
    await flushPromises();
    expect(wrapper.find("[data-testid=change-modal]").exists()).toBe(false);
  });

  it("tidak menghapus bila konfirmasi dibatalkan", async () => {
    vi.mocked(showConfirmDialog).mockResolvedValue(false);
    const { wrapper, spies } = await setup({ cashFlow: item });

    await wrapper.find("[data-testid=delete-button]").trigger("click");
    await flushPromises();

    expect(spies.del).not.toHaveBeenCalled();
  });

  it("menghapus transaksi lalu kembali ke beranda", async () => {
    vi.mocked(showConfirmDialog).mockResolvedValue(true);
    const { wrapper, store, spies, router } = await setup({ cashFlow: item });
    spies.del.mockImplementation(async () => {
      store.isCashFlowDeleted = true;
    });

    await wrapper.find("[data-testid=delete-button]").trigger("click");
    await flushPromises();

    expect(spies.del).toHaveBeenCalledWith("4");
    expect(router.currentRoute.value.path).toBe("/");
  });

  it("tetap di halaman bila penghapusan gagal", async () => {
    vi.mocked(showConfirmDialog).mockResolvedValue(true);
    const { wrapper, router } = await setup({ cashFlow: item });

    await wrapper.find("[data-testid=delete-button]").trigger("click");
    await flushPromises();

    expect(router.currentRoute.value.path).toBe("/cash-flows/4");
  });
});
