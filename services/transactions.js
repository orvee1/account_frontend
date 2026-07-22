import { responseData, server } from "@/services/server";

export async function fetchReceipts(params = {}) {
  const res = await server.get("/receipts", { params });
  return responseData(res);
}

export async function createReceipt(payload) {
  const res = await server.post("/receipts", payload);
  return responseData(res);
}

export async function updateReceipt(id, payload) {
  const res = await server.put(`/receipts/${id}`, payload);
  return responseData(res);
}

export async function deleteReceipt(id) {
  const res = await server.delete(`/receipts/${id}`);
  return responseData(res);
}

export async function fetchPayments(params = {}) {
  const res = await server.get("/payments", { params });
  return responseData(res);
}

export async function createPayment(payload) {
  const res = await server.post("/payments", payload);
  return responseData(res);
}

export async function updatePayment(id, payload) {
  const res = await server.put(`/payments/${id}`, payload);
  return responseData(res);
}

export async function deletePayment(id) {
  const res = await server.delete(`/payments/${id}`);
  return responseData(res);
}

export async function fetchContras(params = {}) {
  const res = await server.get("/contras", { params });
  return responseData(res);
}

export async function createContra(payload) {
  const res = await server.post("/contras", payload);
  return responseData(res);
}

export async function updateContra(id, payload) {
  const res = await server.put(`/contras/${id}`, payload);
  return responseData(res);
}

export async function deleteContra(id) {
  const res = await server.delete(`/contras/${id}`);
  return responseData(res);
}

export async function fetchDebitNotes(params = {}) {
  const res = await server.get("/debit-notes", { params });
  return responseData(res);
}

export async function createDebitNote(payload) {
  const res = await server.post("/debit-notes", payload);
  return responseData(res);
}

export async function updateDebitNote(id, payload) {
  const res = await server.put(`/debit-notes/${id}`, payload);
  return responseData(res);
}

export async function deleteDebitNote(id) {
  const res = await server.delete(`/debit-notes/${id}`);
  return responseData(res);
}

export async function fetchCreditNotes(params = {}) {
  const res = await server.get("/credit-notes", { params });
  return responseData(res);
}

export async function createCreditNote(payload) {
  const res = await server.post("/credit-notes", payload);
  return responseData(res);
}

export async function updateCreditNote(id, payload) {
  const res = await server.put(`/credit-notes/${id}`, payload);
  return responseData(res);
}

export async function deleteCreditNote(id) {
  const res = await server.delete(`/credit-notes/${id}`);
  return responseData(res);
}

export async function fetchManualJournals(params = {}) {
  const res = await server.get("/manual-journals", { params });
  return responseData(res);
}

export async function createManualJournal(payload) {
  const res = await server.post("/manual-journals", payload);
  return responseData(res);
}

export async function updateManualJournal(id, payload) {
  const res = await server.put(`/manual-journals/${id}`, payload);
  return responseData(res);
}

export async function deleteManualJournal(id) {
  const res = await server.delete(`/manual-journals/${id}`);
  return responseData(res);
}

export async function fetchRecurringTransactions(params = {}) {
  const res = await server.get("/recurring-transactions", { params });
  return responseData(res);
}

export async function createRecurringTransaction(payload) {
  const res = await server.post("/recurring-transactions", payload);
  return responseData(res);
}

export async function updateRecurringTransaction(id, payload) {
  const res = await server.put(`/recurring-transactions/${id}`, payload);
  return responseData(res);
}

export async function deleteRecurringTransaction(id) {
  const res = await server.delete(`/recurring-transactions/${id}`);
  return responseData(res);
}

export async function fetchTransactionTransfers(params = {}) {
  const res = await server.get("/transaction-transfers", { params });
  return responseData(res);
}

export async function createTransactionTransfer(payload) {
  const res = await server.post("/transaction-transfers", payload);
  return responseData(res);
}

export async function updateTransactionTransfer(id, payload) {
  const res = await server.put(`/transaction-transfers/${id}`, payload);
  return responseData(res);
}

export async function deleteTransactionTransfer(id) {
  const res = await server.delete(`/transaction-transfers/${id}`);
  return responseData(res);
}
