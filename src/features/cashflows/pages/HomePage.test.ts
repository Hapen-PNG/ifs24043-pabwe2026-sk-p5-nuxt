import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises } from "@vue/test-utils";

vi.mock("../../../helpers/toolsHelper", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../../helpers/toolsHelper")>();
  return { ...actual, showConfirmDialog: vi.fn(), showErrorDialog: vi.fn(), showSuccessDialog: vi.fn() };
});

import { showConfirmDialog } from "../../../helpers/toolsHelper";
import { createMockPinia, renderWithProviders } from "../../../test-utils";
import { useCashFlowsStore } from "../states/cashFlowsStore";
import type { CashFlow } from "../api/cashFlowApi";
import AddModal from "../modals/AddModal.vue";
import ChangeModal from "../modals/ChangeModal.vue";
import HomePage from "./HomePage.vue";

const items: CashFlow[] = [
  {
    id: 2,
    user_id: 1,
    type: "inflow",
    source: "cash",
    label: "gaji",
    description: "Gaji bulanan",
    nominal: 2500000,
    created_at: "2024-10-05T11:26:45.000000Z",
    updated_at: "2024-10-05T11:26:48.000000Z",
  },
  {
    id: 4,
    user_id: 1,
    type: "outflow",
    source: "savings",
    label: "alat-elektronik",
    description: "Membeli keyboard",
    nominal: 400000,
    created_at: "2024-10-05T12:09:16.000000Z",
    updated_at: "2024-10-05T12:09:16.000000Z",
  },
];

const normalize = (text: string) => text.replace(/\s/g, " ");

async function setup(patch: Record<string, unknown> = {}) {
  const pinia = createMockPinia();
  const store = useCashFlowsStore(pinia);
  const spies = {
    list: vi.spyOn(store, "asyncGetCashFlows").mockResolvedValue(undefined),
    labels: vi.spyOn(store, "asyncGetLabels").mockResolvedValue(undefined),
    del: vi.spyOn(store, "asyncDeleteCashFlow").mockResolvedValue(undefined),
    delAll: vi.spyOn(store, "asyncDeleteAllCashFlows").mockResolvedValue(undefined),
  };
  store.$patch(patch);
  const result = await renderWithProviders(HomePage, { pinia });
  await flushPromises();
  return { store, spies, ...result };
}

const lastQuery = (spy: ReturnType<typeof vi.fn>) => spy.mock.calls.at(-1)![0];

beforeEach(() => {
  vi.resetAllMocks();
});

describe("HomePage", () => {
  it("memuat transaksi dan label saat dibuka", async () => {
    const { spies } = await setup();

    expect(spies.list).toHaveBeenCalledTimes(1);
    expect(spies.list).toHaveBeenCalledWith({
      type: "",
      source: "",
      label: "",
      start_date: "",
      end_date: "",
    });
    expect(spies.labels).toHaveBeenCalledTimes(1);
  });

  it("menampilkan enam kartu ringkasan finansial", async () => {
    const { wrapper } = await setup({
      stats: {
        cashflow: 2000000,
        total_inflow: 2500000,
        total_outflow: 500000,
        cash: 2400000,
        savings: -400000,
        loans: 0,
      },
    });

    const cards = wrapper.findAll("[data-testid=stat-card]");
    expect(cards).toHaveLength(6);
    expect(normalize(cards[0].text())).toContain("Total Saldo Kas Bersih");
    expect(normalize(cards[0].text())).toContain("Rp 2.000.000");
    expect(normalize(cards[1].text())).toContain("Rp 2.500.000");
    expect(cards[5].text()).toContain("Saldo Pinjaman");
  });

  it("menampilkan status memuat", async () => {
    const { wrapper } = await setup({ isCashFlow: true });

    expect(wrapper.text()).toContain("Memuat data arus kas");
  });

  it("menampilkan pesan kosong", async () => {
    const { wrapper } = await setup();

    expect(wrapper.text()).toContain("Belum ada transaksi arus kas");
  });

  it("menampilkan daftar transaksi sebagai tabel dan kartu", async () => {
    const { wrapper } = await setup({ cashFlows: items });

    const rows = wrapper.findAll("[data-testid=cash-flow-row]");
    expect(rows).toHaveLength(2);
    expect(normalize(rows[0].text())).toContain("+Rp 2.500.000");
    expect(rows[0].text()).toContain("Pemasukan");
    expect(rows[0].text()).toContain("Tunai");
    expect(normalize(rows[1].text())).toContain("-Rp 400.000");
    expect(rows[1].text()).toContain("Pengeluaran");
    expect(rows[1].text()).toContain("Tabungan");
    expect(rows[0].find("[data-testid=detail-link]").attributes("href")).toBe("/cash-flows/2");
    expect(wrapper.findAll("[data-testid=cash-flow-card]")).toHaveLength(2);
  });

  it("memuat ulang data ketika filter berubah", async () => {
    const { wrapper, spies } = await setup({ labels: ["gaji"] });

    await wrapper.find("[data-testid=filter-type]").setValue("outflow");
    await flushPromises();
    expect(lastQuery(spies.list)).toMatchObject({ type: "outflow" });

    await wrapper.find("[data-testid=filter-source]").setValue("savings");
    await flushPromises();
    expect(lastQuery(spies.list)).toMatchObject({ type: "outflow", source: "savings" });

    await wrapper.find("[data-testid=filter-label]").setValue("gaji");
    await flushPromises();
    expect(lastQuery(spies.list)).toMatchObject({ label: "gaji" });

    await wrapper.find("[data-testid=filter-start]").setValue("2026-10-01");
    await flushPromises();
    expect(lastQuery(spies.list)).toMatchObject({ start_date: "2026-10-01 00:00:00" });

    await wrapper.find("[data-testid=filter-end]").setValue("2026-10-07");
    await flushPromises();
    expect(lastQuery(spies.list)).toMatchObject({
      start_date: "2026-10-01 00:00:00",
      end_date: "2026-10-07 23:59:59",
    });
  });

  it("mengatur ulang filter", async () => {
    const { wrapper, spies } = await setup();

    await wrapper.find("[data-testid=filter-type]").setValue("inflow");
    await flushPromises();
    await wrapper.find("[data-testid=reset-filter-button]").trigger("click");
    await flushPromises();

    expect(lastQuery(spies.list)).toMatchObject({ type: "", start_date: "", end_date: "" });
    expect((wrapper.find("[data-testid=filter-type]").element as HTMLSelectElement).value).toBe("");
  });

  it("membuka, menutup, dan memuat ulang setelah modal tambah", async () => {
    const { wrapper, spies } = await setup();
    expect(wrapper.find("[data-testid=add-modal]").exists()).toBe(false);

    await wrapper.find("[data-testid=add-button]").trigger("click");
    expect(wrapper.find("[data-testid=add-modal]").exists()).toBe(true);

    wrapper.findComponent(AddModal).vm.$emit("saved");
    await flushPromises();
    expect(spies.list).toHaveBeenCalledTimes(2);

    wrapper.findComponent(AddModal).vm.$emit("close");
    await flushPromises();
    expect(wrapper.find("[data-testid=add-modal]").exists()).toBe(false);
  });

  it("membuka modal ubah dari tabel dan memuat ulang setelah disimpan", async () => {
    const { wrapper, spies } = await setup({ cashFlows: items });

    await wrapper.findAll("[data-testid=edit-button]")[1].trigger("click");

    expect(wrapper.find("[data-testid=change-modal]").exists()).toBe(true);
    expect((wrapper.find("#cf-label").element as HTMLInputElement).value).toBe("alat-elektronik");

    wrapper.findComponent(ChangeModal).vm.$emit("saved");
    await flushPromises();
    expect(spies.list).toHaveBeenCalledTimes(2);

    wrapper.findComponent(ChangeModal).vm.$emit("close");
    await flushPromises();
    expect(wrapper.find("[data-testid=change-modal]").exists()).toBe(false);
  });

  it("membuka modal ubah dari kartu", async () => {
    const { wrapper } = await setup({ cashFlows: items });

    const card = wrapper.findAll("[data-testid=cash-flow-card]")[0];
    await card.findAll("button")[0].trigger("click");

    expect(wrapper.find("[data-testid=change-modal]").exists()).toBe(true);
    expect((wrapper.find("#cf-label").element as HTMLInputElement).value).toBe("gaji");
  });

  it("tidak menghapus bila konfirmasi dibatalkan", async () => {
    vi.mocked(showConfirmDialog).mockResolvedValue(false);
    const { wrapper, spies } = await setup({ cashFlows: items });

    await wrapper.findAll("[data-testid=delete-button]")[0].trigger("click");
    await flushPromises();

    expect(spies.del).not.toHaveBeenCalled();
  });

  it("menghapus dari tabel lalu memuat ulang data", async () => {
    vi.mocked(showConfirmDialog).mockResolvedValue(true);
    const { wrapper, store, spies } = await setup({ cashFlows: items });
    spies.del.mockImplementation(async () => {
      store.isCashFlowDeleted = true;
    });

    await wrapper.findAll("[data-testid=delete-button]")[0].trigger("click");
    await flushPromises();

    expect(spies.del).toHaveBeenCalledWith(2);
    expect(spies.list).toHaveBeenCalledTimes(2);
  });

  it("menghapus dari kartu tanpa memuat ulang bila gagal", async () => {
    vi.mocked(showConfirmDialog).mockResolvedValue(true);
    const { wrapper, spies } = await setup({ cashFlows: items });

    const card = wrapper.findAll("[data-testid=cash-flow-card]")[1];
    await card.findAll("button")[1].trigger("click");
    await flushPromises();

    expect(spies.del).toHaveBeenCalledWith(4);
    expect(spies.list).toHaveBeenCalledTimes(1);
  });

  it("tidak mereset semua bila konfirmasi dibatalkan", async () => {
    vi.mocked(showConfirmDialog).mockResolvedValue(false);
    const { wrapper, spies } = await setup();

    await wrapper.find("[data-testid=reset-all-button]").trigger("click");
    await flushPromises();

    expect(spies.delAll).not.toHaveBeenCalled();
  });

  it("mereset semua transaksi lalu memuat ulang data", async () => {
    vi.mocked(showConfirmDialog).mockResolvedValue(true);
    const { wrapper, store, spies } = await setup();
    spies.delAll.mockImplementation(async () => {
      store.isCashFlowDeletedAll = true;
    });

    await wrapper.find("[data-testid=reset-all-button]").trigger("click");
    await flushPromises();

    expect(spies.delAll).toHaveBeenCalledTimes(1);
    expect(spies.list).toHaveBeenCalledTimes(2);
  });

  it("tidak memuat ulang bila reset semua gagal", async () => {
    vi.mocked(showConfirmDialog).mockResolvedValue(true);
    const { wrapper, spies } = await setup();

    await wrapper.find("[data-testid=reset-all-button]").trigger("click");
    await flushPromises();

    expect(spies.delAll).toHaveBeenCalledTimes(1);
    expect(spies.list).toHaveBeenCalledTimes(1);
  });
});
