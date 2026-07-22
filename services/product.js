// src/services/product.js
import axios from "axios";
import { server, responseData } from "@/services/server";

const API_BASE = "/api/backend";

// Client-side version for use in client components
export async function fetchProductsClient(params = {}) {
  try {
    const response = await axios.get(`${API_BASE}/products`, {
      params,
      headers: { Accept: "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching products:", error);
    return { data: [] };
  }
}

// Server-side version (তালিকা আনা)
export async function fetchProducts(params = {}) {
  const res = await server.get("/products", { params });
  return responseData(res); // => { ok, status, statusText, data }
}

// তৈরী করা
export async function createProduct(payload) {
  const res = await server.post("/products", payload);
  return responseData(res);
}

// আপডেট করা
export async function updateProduct(id, payload) {
  const res = await server.put(`/products/${id}`, payload); // <-- slash OK
  return responseData(res);
}

// ডিলিট করা
export async function deleteProduct(id) {
  const res = await server.delete(`/products/${id}`);
  return responseData(res);
}

// Aliases for compatibility
export async function getProducts(params = {}) {
  return fetchProducts(params);
}
