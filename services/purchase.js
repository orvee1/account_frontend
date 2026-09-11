// services/purchase.js
import axios from "axios";
import { responseData, server } from "./server";

const API_BASE = "/api/backend";

// Purchase Bill payload mapping
const toPurchaseBillPayload = (data = {}) => ({
  vendor_id: Number(data.vendor_id) || null,
  bill_no: data.bill_no?.trim() || "",
  bill_date: data.bill_date || null,
  due_date: data.due_date || null,
  supplier_ref_no: data.supplier_ref_no?.trim() || null,
  vat_mode: data.vat_mode || "exclusive",
  status: data.status || "confirmed",
  bill_discount_amt: Number(data.bill_discount_amt) || 0,
  bill_discount_account_id: data.bill_discount_account_id || null,
  notes: data.notes?.trim() || "",
  items: (data.items || []).map(item => ({
    product_id: Number(item.product_id) || null,
    purchase_uom_id: Number(item.purchase_uom_id) || null,
    price_uom_id: Number(item.price_uom_id) || null,
    quantity: Number(item.quantity) || 0,
    unit_price: Number(item.unit_price) || 0,
    trade_discount_pct: Number(item.trade_discount_pct) || 0,
    line_discount_pct: Number(item.line_discount_pct) || 0,
    line_discount_amt: Number(item.line_discount_amt) || 0,
    vat_rate: Number(item.vat_rate) || 0,
    ait_rate: Number(item.ait_rate) || 0,
  }))
});

export async function fetchPurchaseFormConfig() {
  const res = await server.get("/settings/purchase-form-config");
  return responseData(res);
}

// Client-side version for use in client components
export async function fetchPurchaseBillsClient(params = {}) {
  try {
    const response = await axios.get(`${API_BASE}/purchase-bills`, {
      params,
      headers: { Accept: "application/json" },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching purchase bills:", error);
    return { data: [] };
  }
}

// Server-side version (✅ Fetch all purchase bills)
export async function fetchPurchaseBills(params = {}) {
  const res = await server.get("/purchase-bills", { params });
  return responseData(res);
}

// ✅ Fetch single purchase bill by ID
export async function fetchPurchaseBill(id) {
  const res = await server.get(`/purchase-bills/${id}`);
  return responseData(res);
}

// ✅ Create new purchase bill
export async function createPurchaseBill(payload) {
  const res = await server.post("/purchase-bills", toPurchaseBillPayload(payload));
  return responseData(res);
}

// ✅ Update existing purchase bill
export async function updatePurchaseBill(id, payload) {
  const res = await server.put(`/purchase-bills/${id}`, toPurchaseBillPayload(payload));
  return responseData(res);
}

// ✅ Delete purchase bill
export async function deletePurchaseBill(id) {
  const res = await server.delete(`/purchase-bills/${id}`);
  return responseData(res);
}

// ✅ Fetch purchase orders (if needed)
export async function fetchPurchaseOrders(params = {}) {
  const res = await server.get("/purchase-orders", { params });
  return responseData(res);
}

// ✅ Create purchase order
export async function createPurchaseOrder(payload) {
  const res = await server.post("/purchase-orders", payload);
  return responseData(res);
}

// Legacy functions (keeping for backward compatibility)
export async function fetchPurchases(params = {}) {
  return fetchPurchaseBills(params);
}

export async function getPurchases(params = {}) {
  return fetchPurchaseBills(params);
}

export async function createPurchase(data) {
  return createPurchaseBill(data);
}

export async function updatePurchase(id, data) {
  return updatePurchaseBill(id, data);
}

export async function deletePurchase(id) {
  return deletePurchaseBill(id);
}
