// src/services/vendor.js
import { responseData, server } from "@/services/server";

// Common fields (both create & update)
const mapCommon = (p = {}) => ({
  name: p.name?.trim() ?? "",
  display_name: p.displayName ?? "",
  proprietor_name: p.proprietorName ?? "",
  phone_number: p.phoneNumber ?? "",
  email: p.email ?? "",
  address: p.address ?? "",
  nid: p.nid ?? "",
  bank_details: p.bankDetails ?? "",
  notes: p.notes ?? "",
  credit_limit: Number(p.creditLimit ?? 0),
});

// ✅ CREATE: everything + vendor_number + opening_balance
const toServerCreatePayload = (p = {}) => ({
  ...mapCommon(p),
  vendor_number: p.vendorCode || p.customerNumber || p.vendorNumber || null,
  opening_balance: Number(p.openingBalance || 0),
  opening_balance_type: p.openingBalanceType || null,
  opening_balance_date: p.openingBalanceDate || null,
});

// তালিকা আনা
export async function fetchVendors(params = {}) {
  const res = await server.get("/vendors", { params });
  return responseData(res); // => { ok, status, statusText, data }
}

const toServerUpdatePayload = (p = {}) => ({
  ...mapCommon(p),
  // intentionally NO vendor_number, NO opening_balance
});

// তৈরী করা
export async function createVendor(payload) {
  const res = await server.post("/vendors", toServerCreatePayload(payload));
  return responseData(res);
}

// আপডেট করা
export async function updateVendor(id, payload) {
  const res = await server.put(`/vendors/${id}`, toServerUpdatePayload(payload));
  return responseData(res);
}

// ডিলিট করা
export async function deleteVendor(id) {
  const res = await server.delete(`/vendors/${id}`);
  return responseData(res);
}

// লেজার (optional, but useful)
export async function fetchVendorLedger(id, params = {}) {
  const res = await server.get(`/vendors/${id}/ledger`, { params });
  return responseData(res);
}

export async function fetchVendorCode() {
  const res = await server.get('/vendors/generate-code');
  return responseData(res);
}

