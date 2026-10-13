import {
  apiDelete,
  apiGet,
  apiPost,
  apiPut,
} from "../../../helpers/apiHelper";

export type CashFlowType = "inflow" | "outflow";
export type CashFlowSource = "cash" | "savings" | "loans";

export interface CashFlow {
  id: number;
  user_id: number;
  type: CashFlowType;
  source: CashFlowSource;
  label: string;
  description: string;
  nominal: number;
  created_at: string;
  updated_at: string;
}

export interface CashFlowPayload {
  type: CashFlowType;
  source: CashFlowSource;
  label: string;
  description: string;
  nominal: number;
}

export interface CashFlowQueryParams {
  type?: CashFlowType | "";
  source?: CashFlowSource | "";
  label?: string;
  start_date?: string;
  end_date?: string;
}

export interface StatsQueryParams {
  end_date?: string;
  total_data?: number;
}

/** Bentuk statistik mentah dari API (kunci dinamis, mis. `total_inflow_cash`). */
export type RawCashFlowStats = Record<string, number | undefined>;

/** Statistik yang sudah dinormalisasi untuk ditampilkan di dashboard. */
export interface CashFlowStats {
  cashflow: number;
  total_inflow: number;
  total_outflow: number;
  cash: number;
  savings: number;
  loans: number;
}

export interface StatsSeries {
  stats_inflow: Record<string, number>;
  stats_outflow: Record<string, number>;
  stats_cashflow: Record<string, number>;
}

export const getCashFlows = (params?: CashFlowQueryParams) =>
  apiGet<{ cash_flows: CashFlow[]; stats: RawCashFlowStats }>(
    "/cash-flows",
    params
  );

export const getCashFlow = (id: number | string) =>
  apiGet<{ cash_flow: CashFlow }>(`/cash-flows/${id}`);

export const postCashFlow = (payload: CashFlowPayload) =>
  apiPost<{ cash_flow_id: number }>("/cash-flows", payload);

export const putCashFlow = (id: number | string, payload: CashFlowPayload) =>
  apiPut<null>(`/cash-flows/${id}`, payload);

export const deleteCashFlow = (id: number | string) =>
  apiDelete<null>(`/cash-flows/${id}`);

export const getLabels = () =>
  apiGet<{ labels: string[] }>("/cash-flows/labels");

export const getStatsDaily = (params?: StatsQueryParams) =>
  apiGet<StatsSeries>("/cash-flows/stats/daily", params);

export const getStatsMonthly = (params?: StatsQueryParams) =>
  apiGet<StatsSeries>("/cash-flows/stats/monthly", params);

export const deleteAllCashFlows = () => apiDelete<null>("/cash-flows");
