import { server } from "./server";

export async function fetchWarehouses(params ={}) {
  try {
    const response = await server.get(`/warehouses/`, { params });
    if (response.ok) {
      try {
        return await response.json();
      } catch (err) {
        return { message: err?.message || "Failed to fetch warehouses" };
      }
    }
    return { message: "Failed to fetch warehouses" };
  } catch (e) {
    return { message: e?.message || "Failed to fetch warehouses" };
  }
}

export async function createWarehourse(data) {
  try {
    const response = await server.post(`/warehouses/`, data);
    if (response.ok) {
      try {
        return await response.json();
      } catch (err) {
        return { message: err?.message || "Failed to create Warehourse" };
      }
    }
    return { message: "Failed to create Warehourse" };
  } catch (e) {
    return { message: e?.message || "Failed to create Warehourse" };
  }
}

export async function updateWarehourse(id, data) {
  try {
    const response = await server.put(`/warehouses/${id}/`, data);
    if (response.ok) {
      try {
        return await response.json();
      } catch (err) {
        return { message: err?.message || "Failed to update Warehourse" };
      }
    }
    return { message: "Failed to update Warehourse" };
  } catch (e) {
    return { message: e?.message || "Failed to update Warehourse" };
  }
}

export async function makeDefault(id, data) {
  try {
    const response = await server.put(`/warehouses/${id}/make-default`, data);
    if (response.ok) {
      try {
        return await response.json();
      } catch (err) {
        return { message: err?.message || "Failed to update Warehourse" };
      }
    }
    return { message: "Failed to update Warehourse" };
  } catch (e) {
    return { message: e?.message || "Failed to update Warehourse" };
  }
}

export async function deleteWarehourse(id) {
  try {
    const response = await server.delete(`/warehouses/${id}/`);
    if (response.ok) {
      try {
        return await response.json();
      } catch (err) {
        return { message: err?.message || "Failed to delete Warehourse" };
      }
    }
    return { message: "Failed to delete Warehourse" };
  } catch (e) {
    return { message: e?.message || "Failed to delete Warehourse" };
  }
}