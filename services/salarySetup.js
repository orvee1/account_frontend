// services/salarySetup.js
import { server, responseData } from "@/services/server";

// Get all salary setups
export async function fetchSalarySetups(params = {}) {
  const res = await server.get("/salary-setups", { params });
  return responseData(res);
}

// Get single salary setup
export async function getSalarySetup(id) {
  const res = await server.get(`/salary-setups/${id}`);
  return responseData(res);
}

// Create salary setup
export async function createSalarySetup(payload) {
  const res = await server.post("/salary-setups", payload);
  return responseData(res);
}

// Update salary setup
export async function updateSalarySetup(id, payload) {
  const res = await server.put(`/salary-setups/${id}`, payload);
  return responseData(res);
}

// Delete salary setup
export async function deleteSalarySetup(id) {
  const res = await server.delete(`/salary-setups/${id}`);
  return responseData(res);
}

// Restore deleted salary setup
export async function restoreSalarySetup(id) {
  const res = await server.post(`/salary-setups/${id}/restore`);
  return responseData(res);
}
