// services/chartAccounts.js

import { server, formattedResponse } from "./server";
import { authRequestOptions, clientAuthRequestOptions } from "./server";

// Client-side version (for client components through the same-origin proxy)
export async function getChartAccountsClient(companyId, params = {}) {
  if (!companyId) {
    throw new Error("companyId is required");
  }

  const options = clientAuthRequestOptions();
  const res = await server.get(`/companies/${companyId}/chart-accounts`, {
    ...options,
    params,
  });
  return res; // Note: Current usages might expect the raw Response object or have their own handling
}

// Server-side version (for server components using cookies)
// সবসময় server side থেকে ব্যবহার করলে ভালো (page / server action)
export async function getChartAccounts(companyId, params = {}) {
  if (!companyId) {
    throw new Error("companyId is required");
  }

  const options = await authRequestOptions();
  const res = await server.get(`/companies/${companyId}/chart-accounts`, {
    ...options,
    params,
  });
  return res;
}
// Alias for compatibility
export async function getChartOfAccounts(companyId, params = {}) {
  return getChartAccounts(companyId, params);
}
export async function addChartAccount(companyId, payload) {
  if (!companyId) {
    throw new Error("companyId is required");
  }

  const options = await authRequestOptions();
  const res = await server.post(`/companies/${companyId}/chart-accounts`, payload, options);
  return formattedResponse(res);
}

export async function updateChartAccount(companyId, chartAccountId, payload) {
  if (!companyId) {
    throw new Error("companyId is required");
  }

  const options = await authRequestOptions();
  const res = await server.put(
    `/companies/${companyId}/chart-accounts/${chartAccountId}`,
    payload,
    options
  );
  return formattedResponse(res);
}

export async function deleteChartAccount(companyId, chartAccountId) {
  if (!companyId) {
    throw new Error("companyId is required");
  }

  const options = await authRequestOptions();
  const res = await server.delete(
    `/companies/${companyId}/chart-accounts/${chartAccountId}`,
    {},
    options
  );
  return formattedResponse(res);
}
/**
 * Get account ledger details with transactions
 * @param {string} companyId - Company ID
 * @param {string} accountId - Account ID
 * @param {object} params - Query parameters (start_date, end_date)
 * @returns {Promise<object>} Account ledger data with transactions
 */
export async function getAccountLedger(companyId, accountId, params = {}) {
  if (!companyId) {
    throw new Error("companyId is required");
  }
  if (!accountId) {
    throw new Error("accountId is required");
  }

  const options = await authRequestOptions();
  const res = await server.get(`/companies/${companyId}/accounts/${accountId}/ledger`, {
    ...options,
    params,
  });
  return formattedResponse(res);
}

/**
 * Get transactions for reconciliation
 * @param {string} companyId - Company ID
 * @param {string} accountId - Account ID
 * @param {object} params - Query parameters (start_date, end_date)
 * @returns {Promise<object>} Transactions ready for reconciliation
 */
export async function getTransactionsForReconciliation(companyId, accountId, params = {}) {
  if (!companyId || !accountId) {
    throw new Error("companyId and accountId are required");
  }

  const options = await authRequestOptions();
  const res = await server.get(`/companies/${companyId}/accounts/${accountId}/transactions-to-reconcile`, {
    ...options,
    params,
  });
  return formattedResponse(res);
}

/**
 * Submit account reconciliation
 * @param {string} companyId - Company ID
 * @param {string} accountId - Account ID
 * @param {object} payload - Reconciliation data
 * @returns {Promise<object>} Reconciliation result
 */
export async function submitReconciliation(companyId, accountId, payload) {
  if (!companyId || !accountId) {
    throw new Error("companyId and accountId are required");
  }

  const options = await authRequestOptions();
  const res = await server.post(`/companies/${companyId}/accounts/${accountId}/reconcile`, payload, options);
  return formattedResponse(res);
}

/**
 * Get reconciliation history
 * @param {string} companyId - Company ID
 * @param {string} accountId - Account ID
 * @param {object} params - Query parameters (page, etc)
 * @returns {Promise<object>} List of reconciliations
 */
export async function getReconciliationHistory(companyId, accountId, params = {}) {
  if (!companyId || !accountId) {
    throw new Error("companyId and accountId are required");
  }

  const options = await authRequestOptions();
  const res = await server.get(`/companies/${companyId}/accounts/${accountId}/reconciliation-history`, {
    ...options,
    params,
  });
  return formattedResponse(res);
}

/**
 * Get reconciliation details
 * @param {string} companyId - Company ID
 * @param {string} accountId - Account ID
 * @param {string} reconciliationId - Reconciliation ID
 * @returns {Promise<object>} Reconciliation details
 */
export async function getReconciliationDetails(companyId, accountId, reconciliationId) {
  if (!companyId || !accountId || !reconciliationId) {
    throw new Error("companyId, accountId and reconciliationId are required");
  }

  const options = await authRequestOptions();
  const res = await server.get(`/companies/${companyId}/accounts/${accountId}/reconciliations/${reconciliationId}`, options);
  return formattedResponse(res);
}

/**
 * Revert/Delete reconciliation
 * @param {string} companyId - Company ID
 * @param {string} accountId - Account ID
 * @param {string} reconciliationId - Reconciliation ID
 * @returns {Promise<object>} Success response
 */
export async function revertReconciliation(companyId, accountId, reconciliationId) {
  if (!companyId || !accountId || !reconciliationId) {
    throw new Error("companyId, accountId and reconciliationId are required");
  }

  const options = await authRequestOptions();
  const res = await server.delete(`/companies/${companyId}/accounts/${accountId}/reconciliations/${reconciliationId}`, {}, options);
  return formattedResponse(res);
}

/**
 * Merge two ledger accounts
 */
export async function mergeAccounts(companyId, payload) {
  if (!companyId) throw new Error("companyId is required");
  const options = await authRequestOptions();
  const res = await server.post(`/companies/${companyId}/chart-accounts/merge`, payload, options);
  return formattedResponse(res);
}

/**
 * Export COA to Excel
 */
export function exportCOA(companyId) {
  window.location.href = `/api/backend/companies/${companyId}/chart-accounts/export`;
}

/**
 * Import COA from Excel/CSV
 */
export async function importCOA(companyId, file) {
  if (!companyId) throw new Error("companyId is required");
  const formData = new FormData();
  formData.append('file', file);
  
  const options = await authRequestOptions();
  const res = await server.post(`/companies/${companyId}/chart-accounts/import`, formData, options);
  return formattedResponse(res);
}

/**
 * Get standard COA template
 */
export async function getCOATemplate(companyId) {
  if (!companyId) throw new Error("companyId is required");
  const options = await authRequestOptions();
  const res = await server.get(`/companies/${companyId}/chart-accounts/template`, options);
  return formattedResponse(res);
}
