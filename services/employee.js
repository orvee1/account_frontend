// services/employee.js
import { server, responseData } from "@/services/server";

// Get all employees
export async function fetchEmployees(params = {}) {
  const res = await server.get("/employees", { params });
  return responseData(res);
}

// Get single employee
export async function getEmployee(id) {
  const res = await server.get(`/employees/${id}`);
  return responseData(res);
}

// Create employee
export async function createEmployee(payload) {
  const res = await server.post("/employees", payload);
  return responseData(res);
}

// Update employee
export async function updateEmployee(id, payload) {
  const res = await server.put(`/employees/${id}`, payload);
  return responseData(res);
}

// Delete employee
export async function deleteEmployee(id) {
  const res = await server.delete(`/employees/${id}`);
  return responseData(res);
}

// Restore deleted employee
export async function restoreEmployee(id) {
  const res = await server.post(`/employees/${id}/restore`);
  return responseData(res);
}
