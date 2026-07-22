// =============================================
// services/assetDepreciation.js
// =============================================

// Laravel controller expects normalized snake_case keys
import { responseData, server } from "@/services/server";

// 🔁 Common field mapper (camelCase → API payload)
const mapCommon = (p = {}) => {
  return {
    fixed_asset_id: p.fixedAssetId ?? p.fixed_asset_id ?? null,
    method: p.method ?? p.depreciationMethod ?? "Straight Line",
    frequency: p.frequency ?? "Monthly",
    time_of_entry: p.timeOfEntry ?? p.time_of_entry ?? null,
    amount:
      p.amount !== undefined && p.amount !== ""
        ? Number(p.amount)
        : undefined, // controller auto compute for Straight Line
    debit_acc_name:
      p.debitAcc ?? p.debit_acc ?? p.debit_acc_name ?? "Depreciation Expense",
    credit_acc_name:
      p.creditAcc ?? p.credit_acc ?? p.credit_acc_name ?? "Accumulated Depreciation",
    start_date: p.startDate ?? p.start_date ?? null,
    end_date: p.endDate ?? p.end_date ?? null,
    is_active:
      p.isActive !== undefined
        ? Boolean(p.isActive)
        : p.is_active !== undefined
        ? Boolean(p.is_active)
        : true,
    company_id: p.companyId ?? p.company_id ?? null,
  };
};

// ======================================================
// 📥 FETCH (List / Filtered)
// GET /api/v1/asset-depreciations
// supports: fixed_asset_id, active, search, per_page, page
// ======================================================
export async function fetchAssetDepreciations(params = {}) {
  const res = await server.get("/asset-depreciations", { params });
  return responseData(res);
}

// ======================================================
// 📥 FETCH SINGLE
// GET /api/v1/asset-depreciations/{id}
// ======================================================
export async function fetchAssetDepreciation(id) {
  const res = await server.get(`/asset-depreciations/${id}`);
  return responseData(res);
}

// ======================================================
// ➕ CREATE
// POST /api/v1/asset-depreciations
// ======================================================
export async function createAssetDepreciation(payload) {
  const res = await server.post("/asset-depreciations", mapCommon(payload));
  return responseData(res);
}

// ======================================================
// ✏️ UPDATE
// PUT /api/v1/asset-depreciations/{id}
// ======================================================
export async function updateAssetDepreciation(id, payload) {
  const res = await server.put(`/asset-depreciations/${id}`, mapCommon(payload));
  return responseData(res);
}

// ======================================================
// ❌ DELETE
// DELETE /api/v1/asset-depreciations/{id}
// ======================================================
export async function deleteAssetDepreciation(id) {
  const res = await server.delete(`/asset-depreciations/${id}`);
  return responseData(res);
}

// ======================================================
// 🧮 Helper: Auto compute depreciation amount client-side (optional)
// mirrors controller logic (for preview)
// ======================================================
export function computeStraightLineAmount(asset = {}, frequency = "Monthly") {
  const A = Number(asset.amount || 0);
  const S = Number(asset.salvage_value || asset.salvageValue || 0);
  const L = Number(asset.useful_life || asset.usefulLife || 0);
  if (A <= 0 || L <= 0) return 0;
  const annual = (A - S) / L;
  return frequency === "Yearly"
    ? Number(annual.toFixed(2))
    : Number((annual / 12).toFixed(2));
}
