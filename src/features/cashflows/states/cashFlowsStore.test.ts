import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api/cashFlowApi", () => ({
  getCashFlows: vi.fn(),
  getCashFlow: vi.fn(),
  postCashFlow: vi.fn(),
  putCashFlow: vi.fn(),
  deleteCashFlow: vi.fn(),
  deleteAllCashFlows: vi.fn(),
  getLabels: vi.fn(),
  getStatsDaily: vi.fn(),
  getStatsMonthly: vi.fn(),
}));
vi.mock("../../../helpers/toolsHelper", () => ({
  showErrorDialog: vi.fn(),
  showSuccessDialog: vi.fn(),
}));

import * as api from "../api/cashFlowApi";
import type { CashFlow, CashFlowPayload } from "../api/cashFlowApi";
import { showErrorDialog, showSuccessDialog } from "../../../helpers/toolsHelper";
import { createMockPinia } from "../../../test-utils";
import { useCashFlowsStore } from "./cashFlowsStore";

const item: CashFlow = {
  id: 4,
  user_id: 1,
  type: "outflow",
  source: "savings",
  label: "alat-elektronik",
  description: "Membeli keyboard",
  nominal: 400000,
  created_at: "2024-10-05T12:09:16.000000Z",
  updated_at: "2024-10-05T12:09:16.000000Z",
};

const payload: CashFlowPayload = {
  type: "outflow",
  source: "savings",
  label: "alat-elektronik",
  description: "Membeli keyboard",
  nominal: 400000,
};

const success = (data: unknown = null, message = "Berhasil") => ({
  status: "success",
  message,
  data,
});
const fail = (message = "Gagal") => ({ status: "fail", message, data: null });

beforeEach(() => {
  vi.resetAllMocks();
  createMockPinia();
});

describe("cashFlowsStore", () => {
  it("memiliki state awal kosong", () => {
    const store = useCashFlowsStore();

    expect(store.cashFlows).toEqual([]);
    expect(store.cashFlow).toBeNull();
    expect(store.labels).toEqual([]);
    expect(store.stats).toEqual({
      cashflow: 0,
      total_inflow: 0,
      total_outflow: 0,
      cash: 0,
      savings: 0,
      loans: 0,
    });
  });

  describe("asyncGetCashFlows", () => {
    it("mengisi daftar dan menormalisasi statistik", async () => {
      vi.mocked(api.getCashFlows).mockResolvedValue(
        success({
          cash_flows: [item],
          stats: {
            cashflow: 2000000,
            total_inflow: 2500000,
            total_outflow: 500000,
            total_inflow_cash: 2500000,
            total_outflow_cash: 100000,
            total_outflow_savings: 400000,
          },
        })
      );
      const store = useCashFlowsStore();

      await store.asyncGetCashFlows({ type: "outflow" });

      expect(api.getCashFlows).toHaveBeenCalledWith({ type: "outflow" });
      expect(store.cashFlows).toEqual([item]);
      expect(store.stats).toEqual({
        cashflow: 2000000,
        total_inflow: 2500000,
        total_outflow: 500000,
        cash: 2400000,
        savings: -400000,
        loans: 0,
      });
      expect(store.isCashFlow).toBe(false);
    });

    it("menangani respons tanpa statistik", async () => {
      vi.mocked(api.getCashFlows).mockResolvedValue(success({ cash_flows: [] }));
      const store = useCashFlowsStore();

      await store.asyncGetCashFlows();

      expect(store.cashFlows).toEqual([]);
      expect(store.stats.cashflow).toBe(0);
    });

    it("menampilkan error saat gagal", async () => {
      vi.mocked(api.getCashFlows).mockResolvedValue(fail("Unauthenticated."));
      const store = useCashFlowsStore();

      await store.asyncGetCashFlows();

      expect(showErrorDialog).toHaveBeenCalledWith("Unauthenticated.");
      expect(store.isCashFlow).toBe(false);
    });
  });

  describe("asyncGetCashFlow", () => {
    it("mengisi detail", async () => {
      vi.mocked(api.getCashFlow).mockResolvedValue(success({ cash_flow: item }));
      const store = useCashFlowsStore();

      await store.asyncGetCashFlow(4);

      expect(api.getCashFlow).toHaveBeenCalledWith(4);
      expect(store.cashFlow).toEqual(item);
      expect(store.isCashFlow).toBe(false);
    });

    it("mengosongkan detail dan menampilkan error saat gagal", async () => {
      vi.mocked(api.getCashFlow).mockResolvedValue(fail("Data tidak ditemukan"));
      const store = useCashFlowsStore();
      store.$patch({ cashFlow: item });

      await store.asyncGetCashFlow(99);

      expect(store.cashFlow).toBeNull();
      expect(showErrorDialog).toHaveBeenCalledWith("Data tidak ditemukan");
    });
  });

  describe("mutasi", () => {
    it("asyncAddCashFlow berhasil", async () => {
      vi.mocked(api.postCashFlow).mockResolvedValue(success({ cash_flow_id: 5 }, "Berhasil menambahkan data"));
      const store = useCashFlowsStore();

      await store.asyncAddCashFlow(payload);

      expect(api.postCashFlow).toHaveBeenCalledWith(payload);
      expect(store.isCashFlowAdded).toBe(true);
      expect(store.isCashFlowAdd).toBe(false);
      expect(showSuccessDialog).toHaveBeenCalledWith("Berhasil menambahkan data");
    });

    it("asyncAddCashFlow gagal", async () => {
      vi.mocked(api.postCashFlow).mockResolvedValue(fail());
      const store = useCashFlowsStore();

      await store.asyncAddCashFlow(payload);

      expect(store.isCashFlowAdded).toBe(false);
      expect(showErrorDialog).toHaveBeenCalledWith("Gagal");
    });

    it("asyncChangeCashFlow berhasil", async () => {
      vi.mocked(api.putCashFlow).mockResolvedValue(success(null, "Berhasil mengubah data"));
      const store = useCashFlowsStore();

      await store.asyncChangeCashFlow(4, payload);

      expect(api.putCashFlow).toHaveBeenCalledWith(4, payload);
      expect(store.isCashFlowChanged).toBe(true);
      expect(store.isCashFlowChange).toBe(false);
      expect(showSuccessDialog).toHaveBeenCalledWith("Berhasil mengubah data");
    });

    it("asyncChangeCashFlow gagal", async () => {
      vi.mocked(api.putCashFlow).mockResolvedValue(fail());
      const store = useCashFlowsStore();

      await store.asyncChangeCashFlow(4, payload);

      expect(store.isCashFlowChanged).toBe(false);
      expect(showErrorDialog).toHaveBeenCalledWith("Gagal");
    });

    it("asyncDeleteCashFlow berhasil", async () => {
      vi.mocked(api.deleteCashFlow).mockResolvedValue(success(null, "Berhasil menghapus data"));
      const store = useCashFlowsStore();

      await store.asyncDeleteCashFlow(4);

      expect(api.deleteCashFlow).toHaveBeenCalledWith(4);
      expect(store.isCashFlowDeleted).toBe(true);
      expect(store.isCashFlowDelete).toBe(false);
      expect(showSuccessDialog).toHaveBeenCalledWith("Berhasil menghapus data");
    });

    it("asyncDeleteCashFlow gagal", async () => {
      vi.mocked(api.deleteCashFlow).mockResolvedValue(fail());
      const store = useCashFlowsStore();

      await store.asyncDeleteCashFlow(4);

      expect(store.isCashFlowDeleted).toBe(false);
      expect(showErrorDialog).toHaveBeenCalledWith("Gagal");
    });

    it("asyncDeleteAllCashFlows berhasil", async () => {
      vi.mocked(api.deleteAllCashFlows).mockResolvedValue(success(null, "Semua data dihapus"));
      const store = useCashFlowsStore();

      await store.asyncDeleteAllCashFlows();

      expect(store.isCashFlowDeletedAll).toBe(true);
      expect(store.isCashFlowDeleteAll).toBe(false);
      expect(showSuccessDialog).toHaveBeenCalledWith("Semua data dihapus");
    });

    it("asyncDeleteAllCashFlows gagal", async () => {
      vi.mocked(api.deleteAllCashFlows).mockResolvedValue(fail());
      const store = useCashFlowsStore();

      await store.asyncDeleteAllCashFlows();

      expect(store.isCashFlowDeletedAll).toBe(false);
      expect(showErrorDialog).toHaveBeenCalledWith("Gagal");
    });
  });

  describe("label & statistik", () => {
    const series = {
      stats_inflow: { "05-10-2024": 2500000 },
      stats_outflow: { "05-10-2024": 500000 },
      stats_cashflow: { "05-10-2024": 2000000 },
    };

    it("asyncGetLabels mengisi label", async () => {
      vi.mocked(api.getLabels).mockResolvedValue(success({ labels: ["gaji", "alat-mandi"] }));
      const store = useCashFlowsStore();

      await store.asyncGetLabels();

      expect(store.labels).toEqual(["gaji", "alat-mandi"]);
    });

    it("asyncGetLabels gagal", async () => {
      vi.mocked(api.getLabels).mockResolvedValue(fail());
      const store = useCashFlowsStore();

      await store.asyncGetLabels();

      expect(store.labels).toEqual([]);
      expect(showErrorDialog).toHaveBeenCalledWith("Gagal");
    });

    it("asyncGetStatsDaily berhasil dan gagal", async () => {
      const store = useCashFlowsStore();

      vi.mocked(api.getStatsDaily).mockResolvedValueOnce(success(series));
      await store.asyncGetStatsDaily({ total_data: 7 });
      expect(api.getStatsDaily).toHaveBeenCalledWith({ total_data: 7 });
      expect(store.statsDaily).toEqual(series);

      vi.mocked(api.getStatsDaily).mockResolvedValueOnce(fail());
      await store.asyncGetStatsDaily();
      expect(showErrorDialog).toHaveBeenCalledWith("Gagal");
    });

    it("asyncGetStatsMonthly berhasil dan gagal", async () => {
      const store = useCashFlowsStore();

      vi.mocked(api.getStatsMonthly).mockResolvedValueOnce(success(series));
      await store.asyncGetStatsMonthly();
      expect(store.statsMonthly).toEqual(series);

      vi.mocked(api.getStatsMonthly).mockResolvedValueOnce(fail());
      await store.asyncGetStatsMonthly();
      expect(showErrorDialog).toHaveBeenCalledWith("Gagal");
    });
  });
});
