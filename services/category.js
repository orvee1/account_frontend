import { server } from "./server";

export async function fetchCategories(params = {}) {
  try {
    const response = await server.get(`/product-categories/`, { params });
    if (response.ok) {
      try {
        return await response.json();
      } catch (err) {
        return { message: err?.message || "Failed to fetch categories" };
      }
    }
    return { message: "Failed to fetch categories" };
  } catch (e) {
    return { message: e?.message || "Failed to fetch categories" };
  }
}

export async function createCategory(data) {
  try {
    const response = await server.post(`/product-categories/`, data);
    if (response.ok) {
      try {
        return await response.json();
      } catch (err) {
        return { message: err?.message || "Failed to create category" };
      }
    }
    return { message: "Failed to create category" };
  } catch (e) {
    return { message: e?.message || "Failed to create category" };
  }
}

export async function updateCategory(id, data) {
  try {
    const response = await server.put(`/product-categories/${id}/`, data);
    if (response.ok) {
      try {
        return await response.json();
      } catch (err) {
        return { message: err?.message || "Failed to update category" };
      }
    }
    return { message: "Failed to update category" };
  } catch (e) {
    return { message: e?.message || "Failed to update category" };
  }
}

export async function deleteCategory(id) {
  try {
    const response = await server.delete(`/product-categories/${id}/`);
    if (response.ok) {
      try {
        return await response.json();
      } catch (err) {
        return { message: err?.message || "Failed to delete category" };
      }
    }
    return { message: "Failed to delete category" };
  } catch (e) {
    return { message: e?.message || "Failed to delete category" };
  }
}
