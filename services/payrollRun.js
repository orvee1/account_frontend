// services/payrollRun.js
import { server, responseData } from "@/services/server";

// Get all payroll runs
export async function fetchPayrollRuns(params = {}) {
  const res = await server.get("/payroll-runs", { params });
  return responseData(res);
}

// Get single payroll run
export async function getPayrollRun(id) {
  const res = await server.get(`/payroll-runs/${id}`);
  return responseData(res);
}

// Create payroll run
export async function createPayrollRun(payload) {
  const res = await server.post("/payroll-runs", payload);
  return responseData(res);
}

// Update payroll run
export async function updatePayrollRun(id, payload) {
  const res = await server.put(`/payroll-runs/${id}`, payload);
  return responseData(res);
}

// Delete payroll run
export async function deletePayrollRun(id) {
  const res = await server.delete(`/payroll-runs/${id}`);
  return responseData(res);
}

// Process payroll run
export async function processPayrollRun(id) {
  const res = await server.post(`/payroll-runs/${id}/process`);
  return responseData(res);
}

// Undo payroll processing
export async function undoPayrollRun(id) {
  const res = await server.post(`/payroll-runs/${id}/undo`);
  return responseData(res);
}

// Lock payroll run
export async function lockPayrollRun(id) {
  const res = await server.post(`/payroll-runs/${id}/lock`);
  return responseData(res);
}

// Get payroll analytics/reports
export async function getPayrollAnalytics(params = {}) {
  const res = await server.get("/payroll-runs/analytics/summary", { params });
  return responseData(res);
}
