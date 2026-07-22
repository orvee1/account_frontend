import { responseData, server } from "@/services/server";

export async function fetchIncomeStatement(params = {}) {
  const res = await server.get("/reports/income-statement", { params });
  return responseData(res);
}

export async function fetchBalanceSheet(params = {}) {
  const res = await server.get("/reports/balance-sheet", { params });
  return responseData(res);
}

export async function fetchTrialBalance(params = {}) {
  const res = await server.get("/reports/trial-balance", { params });
  return responseData(res);
}

export async function fetchOwnersEquity(params = {}) {
  const res = await server.get("/reports/owners-equity", { params });
  return responseData(res);
}

export async function fetchStockReport(params = {}) {
  const res = await server.get("/reports/stock-report", { params });
  return responseData(res);
}

export async function fetchCashFlow(params = {}) {
  const res = await server.get("/reports/cash-flow", { params });
  return responseData(res);
}

export async function fetchVendorLedger(params = {}) {
  const res = await server.get("/reports/vendor-ledger", { params });
  return responseData(res);
}
