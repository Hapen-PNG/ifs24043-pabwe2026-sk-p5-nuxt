import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../helpers/apiHelper", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  apiPut: vi.fn(),
  apiDelete: vi.fn(),
}));

import { apiDelete, apiGet, apiPost, apiPut } from "../../../helpers/apiHelper";
import {
  deleteAllCashFlows,
  deleteCashFlow,
  getCashFlow,
  getCashFlows,
  getLabels,
  getStatsDaily,
  getStatsMonthly,
  postCashFlow,
  putCashFlow,
  type CashFlowPayload,
} from "./cashFlowApi";

const payload: CashFlowPayload = {
  type: "inflow",
  source: "cash",
  label: "gaji",
  description: "Gaji bulanan",
  nominal: 2500000,
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("cashFlowApi", () => {
  it("getCashFlows meneruskan parameter filter", async () => {
    const response = { status: "success", message: "ok", data: { cash_flows: [], stats: {} } };
    vi.mocked(apiGet).mockResolvedValue(response);

    await expect(getCashFlows({ type: "inflow", label: "gaji" })).resolves.toBe(response);
    expect(apiGet).toHaveBeenCalledWith("/cash-flows", { type: "inflow", label: "gaji" });
  });

  it("getCashFlows tanpa filter", async () => {
    await getCashFlows();

    expect(apiGet).toHaveBeenCalledWith("/cash-flows", undefined);
  });

  it("getCashFlow memanggil detail berdasarkan ID", async () => {
    await getCashFlow(4);

    expect(apiGet).toHaveBeenCalledWith("/cash-flows/4");
  });

  it("postCashFlow mengirim payload", async () => {
    await postCashFlow(payload);

    expect(apiPost).toHaveBeenCalledWith("/cash-flows", payload);
  });

  it("putCashFlow memperbarui berdasarkan ID", async () => {
    await putCashFlow(4, payload);

    expect(apiPut).toHaveBeenCalledWith("/cash-flows/4", payload);
  });

  it("deleteCashFlow menghapus berdasarkan ID", async () => {
    await deleteCashFlow("4");

    expect(apiDelete).toHaveBeenCalledWith("/cash-flows/4");
  });

  it("getLabels memanggil /cash-flows/labels", async () => {
    await getLabels();

    expect(apiGet).toHaveBeenCalledWith("/cash-flows/labels");
  });

  it("getStatsDaily dan getStatsMonthly meneruskan parameter", async () => {
    await getStatsDaily({ total_data: 7 });
    await getStatsMonthly({ end_date: "2024-10-05 23:59:59" });

    expect(apiGet).toHaveBeenNthCalledWith(1, "/cash-flows/stats/daily", { total_data: 7 });
    expect(apiGet).toHaveBeenNthCalledWith(2, "/cash-flows/stats/monthly", {
      end_date: "2024-10-05 23:59:59",
    });
  });

  it("deleteAllCashFlows memanggil DELETE /cash-flows", async () => {
    await deleteAllCashFlows();

    expect(apiDelete).toHaveBeenCalledWith("/cash-flows");
  });
});
