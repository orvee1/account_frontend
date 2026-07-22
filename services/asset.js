// Laravel controller expects these keys (normalize map followed)
import { responseData, server } from "@/services/server";

// client -> server (camelCase payload that controller will normalize)
const mapCommon = (p = {}) => {
  const purchaseMode = p.purchaseMode ?? "";
  const pmode =
    purchaseMode === "On Credit" ? "" : (p.paymentMode ?? ""); // API rule

  // Straight Line না হলে rate লাগতেই হবে এমন না; থাকলে number করব
  const depRate =
    p.depreciationRate !== "" && p.depreciationRate != null
      ? Number(p.depreciationRate)
      : undefined;

  return {
    name: p.name?.trim() ?? "",
    category: p.category ?? "",
    company_id: p.company_id ?? "",
    purchase_date: p.purchaseDate || p.purchase_date || null,
    amount: Number(p.amount ?? 0),
    vendor_name: p.vendorName ?? p.vendor_name ?? "",
    purchase_mode: purchaseMode,
    payment_mode: pmode,
    useful_life: Number(p.usefulLife ?? p.useful_life ?? 0),
    salvage_value: Number(p.salvageValue ?? p.salvage_value ?? 0),
    depreciation_method: p.depreciationMethod || p.depreciation_method || "Straight Line",
    frequency: p.frequency ?? "",
    depreciation_rate: depRate, // controller চাইলে auto-calc করবে SL হলে
    asset_location: p.assetLocation ?? p.asset_location ?? "",
    tag_serial_number: p.tagSerialNumber ?? p.tag_serial_number ?? "",
    status: p.status ?? "",
    notes: p.notes ?? "",
  };
};

// ---------- READ ----------
export async function fetchAssets(params = {}) {
  // supports: search, mode, category, per_page, page
  const res = await server.get("/fixed-assets", { params });
  return responseData(res);
}

// ---------- CREATE ----------
export async function createAsset(payload) {
  const res = await server.post("/fixed-assets", mapCommon(payload));
  return responseData(res);
}

// ---------- UPDATE ----------
export async function updateAsset(id, payload) {
  const res = await server.put(`/fixed-assets/${id}`, mapCommon(payload));
  return responseData(res);
}

// ---------- DELETE ----------
export async function deleteAsset(id) {
  const res = await server.delete(`/fixed-assets/${id}`);
  return responseData(res);
}
