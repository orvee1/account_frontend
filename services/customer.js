// src/services/customer.js
import axios from "axios";
import { server, responseData } from "@/services/server";

const API_BASE = "/api/backend";

// Client-side version for use in client components
export async function fetchCustomersClient(params = {}) {
  try {
    const response = await axios.get(`${API_BASE}/customers`, {
      params,
      headers: { Accept: "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching customers:", error);
    return { data: [] };
  }
}

// Server-side version (তালিকা cache-bust সহ)
export async function fetchCustomers(params = {}) {
  const res = await server.get("/customers", { params: { ...params, _r: Date.now() } });
  return responseData(res);
}

// এক জন
export async function fetchCustomer(id) {
  const res = await server.get(`/customers/${id}`);
  return responseData(res);
}

// তৈরী
export async function createCustomer(payload) {
  const res = await server.post("/customers", payload);
  return responseData(res);
}

// আপডেট
export async function updateCustomer(id, payload) {
  const res = await server.put(`/customers/${id}`, payload);
  return responseData(res);
}

export async function fetchCustomerCode() {
  const res = await server.get('/customers/generate-code');
  return responseData(res);
}

// সফট-ডিলিট
export async function deleteCustomer(id) {
  const res = await server.delete(`/customers/${id}`);
  return responseData(res);
}

// রিস্টোর
export async function restoreCustomer(id) {
  const res = await server.post(`/customers/${id}/restore`);
  return responseData(res);
}

// Aliases for compatibility
export async function getCustomers(params = {}) {
  return fetchCustomers(params);
}

export async function getCustomer(id) {
  return fetchCustomer(id);
}
