import { defineStore } from "pinia";
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
  type CashFlow,
  type CashFlowPayload,
  type CashFlowQueryParams,
  type CashFlowStats,
  type RawCashFlowStats,
  type StatsQueryParams,
  type StatsSeries,
} from "../api/cashFlowApi";
import { getErrorMessage } from "../../../helpers/apiHelper";
import { showErrorDialog, showSuccessDialog } from "../../../helpers/toolsHelper";

export type { CashFlow, CashFlowStats, CashFlowQueryParams };

export interface CashFlowsState {
  cashFlows: CashFlow[];
  cashFlow: CashFlow | null;
  stats: CashFlowStats;
  labels: string[];
  statsDaily: StatsSeries | null;
  statsMonthly: StatsSeries | null;
  isCashFlow: boolean;
  isCashFlowAdd: boolean;
  isCashFlowAdded: boolean;
  isCashFlowChange: boolean;
  isCashFlowChanged: boolean;
  isCashFlowDelete: boolean;
  isCashFlowDeleted: boolean;
  isCashFlowDeleteAll: boolean;
  isCashFlowDeletedAll: boolean;
}

const emptyStats = (): CashFlowStats => ({
  cashflow: 0,
  total_inflow: 0,
  total_outflow: 0,
  cash: 0,
  savings: 0,
  loans: 0,
});

const num = (raw: RawCashFlowStats, key: string): number => Number(raw[key]) || 0;

/** Mengubah statistik mentah API menjadi saldo per sumber dana (pemasukan - pengeluaran). */
function normalizeStats(raw: RawCashFlowStats): CashFlowStats {
  return {
    cashflow: num(raw, "cashflow"),
    total_inflow: num(raw, "total_inflow"),
    total_outflow: num(raw, "total_outflow"),
    cash: num(raw, "total_inflow_cash") - num(raw, "total_outflow_cash"),
    savings: num(raw, "total_inflow_savings") - num(raw, "total_outflow_savings"),
    loans: num(raw, "total_inflow_loans") - num(raw, "total_outflow_loans"),
  };
}

export const useCashFlowsStore = defineStore("cashFlows", {
  state: (): CashFlowsState => ({
    cashFlows: [],
    cashFlow: null,
    stats: emptyStats(),
    labels: [],
    statsDaily: null,
    statsMonthly: null,
    isCashFlow: false,
    isCashFlowAdd: false,
    isCashFlowAdded: false,
    isCashFlowChange: false,
    isCashFlowChanged: false,
    isCashFlowDelete: false,
    isCashFlowDeleted: false,
    isCashFlowDeleteAll: false,
    isCashFlowDeletedAll: false,
  }),
  actions: {
    async asyncGetCashFlows(params?: CashFlowQueryParams) {
      this.isCashFlow = true;
      const response = await getCashFlows(params);
      this.isCashFlow = false;

      if (response.status !== "success") {
        showErrorDialog(getErrorMessage(response));
        return;
      }

      this.cashFlows = response.data.cash_flows;
      this.stats = normalizeStats(response.data.stats ?? {});
    },

    async asyncGetCashFlow(id: number | string) {
      this.isCashFlow = true;
      this.cashFlow = null;
      const response = await getCashFlow(id);
      this.isCashFlow = false;

      if (response.status !== "success") {
        showErrorDialog(getErrorMessage(response));
        return;
      }

      this.cashFlow = response.data.cash_flow;
    },

    async asyncAddCashFlow(payload: CashFlowPayload) {
      this.isCashFlowAdd = true;
      this.isCashFlowAdded = false;

      const response = await postCashFlow(payload);
      this.isCashFlowAdd = false;

      if (response.status !== "success") {
        showErrorDialog(getErrorMessage(response));
        return;
      }

      this.isCashFlowAdded = true;
      showSuccessDialog(response.message);
    },

    async asyncChangeCashFlow(id: number | string, payload: CashFlowPayload) {
      this.isCashFlowChange = true;
      this.isCashFlowChanged = false;

      const response = await putCashFlow(id, payload);
      this.isCashFlowChange = false;

      if (response.status !== "success") {
        showErrorDialog(getErrorMessage(response));
        return;
      }

      this.isCashFlowChanged = true;
      showSuccessDialog(response.message);
    },

    async asyncDeleteCashFlow(id: number | string) {
      this.isCashFlowDelete = true;
      this.isCashFlowDeleted = false;

      const response = await deleteCashFlow(id);
      this.isCashFlowDelete = false;

      if (response.status !== "success") {
        showErrorDialog(getErrorMessage(response));
        return;
      }

      this.isCashFlowDeleted = true;
      showSuccessDialog(response.message);
    },

    async asyncDeleteAllCashFlows() {
      this.isCashFlowDeleteAll = true;
      this.isCashFlowDeletedAll = false;

      const response = await deleteAllCashFlows();
      this.isCashFlowDeleteAll = false;

      if (response.status !== "success") {
        showErrorDialog(getErrorMessage(response));
        return;
      }

      this.isCashFlowDeletedAll = true;
      showSuccessDialog(response.message);
    },

    async asyncGetLabels() {
      const response = await getLabels();

      if (response.status !== "success") {
        showErrorDialog(getErrorMessage(response));
        return;
      }

      this.labels = response.data.labels;
    },

    async asyncGetStatsDaily(params?: StatsQueryParams) {
      const response = await getStatsDaily(params);

      if (response.status !== "success") {
        showErrorDialog(getErrorMessage(response));
        return;
      }

      this.statsDaily = response.data;
    },

    async asyncGetStatsMonthly(params?: StatsQueryParams) {
      const response = await getStatsMonthly(params);

      if (response.status !== "success") {
        showErrorDialog(getErrorMessage(response));
        return;
      }

      this.statsMonthly = response.data;
    },
  },
});
