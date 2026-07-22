import { server } from "./server";

export async function fetchBrands(params = {}) {
  try {
    const response = await server.get(`/brands/`, { params });
    if (response.ok) {
      try {
        return await response.json();
      } catch (err) {
        return { message: err?.message || "Failed to fetch brands" };
      }
    }
    return { message: "Failed to fetch brands" };
  } catch (e) {
    return { message: e?.message || "Failed to fetch brands" };
  }
}

export async function createBrand(data) {
  try {
    const response = await server.post(`/brands/`, data);
    if (response.ok) {
      try {
        return await response.json();
      } catch (err) {
        return { message: err?.message || "Failed to create brand" };
      }
    }
    return { message: "Failed to create brand" };
  } catch (e) {
    return { message: e?.message || "Failed to create brand" };
  }
}

export async function updateBrand(id, data) {
  try {
    const response = await server.put(`/brands/${id}/`, data);
    if (response.ok) {
      try {
        return await response.json();
      } catch (err) {
        return { message: err?.message || "Failed to update brand" };
      }
    }
    return { message: "Failed to update brand" };
  } catch (e) {
    return { message: e?.message || "Failed to update brand" };
  }
}

export async function deleteBrand(id) {
  try {
    const response = await server.delete(`/brands/${id}/`);
    if (response.ok) {
      try {
        return await response.json();
      } catch (err) {
        return { message: err?.message || "Failed to delete brand" };
      }
    }
    return { message: "Failed to delete brand" };
  } catch (e) {
    return { message: e?.message || "Failed to delete brand" };
  }
}