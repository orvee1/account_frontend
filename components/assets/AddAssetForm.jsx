"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const STATUS_OPTIONS = ["Active", "Sold", "Disposed", "Written Off"];

export default function AddAssetForm({
  onSave,        // (payload, isEdit) => Promise<{ok?:boolean, errors?:object}>
  onCancel,
  initialData,
  isEditMode = false,
  companyId,     // optional (Register থেকে পাস করলে payload-এ সেট হবে)
}) {
  const { toast } = useToast();

  const init = useMemo(() => {
    const d = initialData || {};
    const get = (a, b, fb = "") => d?.[a] ?? d?.[b] ?? fb;

    return {
      id: d?.id ?? undefined,
      name: get("name", "name", ""),
      category: get("category", "category", ""),
      purchaseDate: get("purchaseDate", "purchase_date", ""),
      amount: get("amount", "amount", ""),
      vendorName: get("vendorName", "vendor_name", ""),
      purchaseMode: get("purchaseMode", "purchase_mode", ""),
      paymentMode: get("paymentMode", "payment_mode", ""),
      usefulLife: get("usefulLife", "useful_life", ""),
      salvageValue: get("salvageValue", "salvage_value", ""),
      depreciationMethod: get("depreciationMethod", "depreciation_method", "Straight Line"),
      frequency: get("frequency", "frequency", "Monthly"),
      depreciationRate: get("depreciationRate", "depreciation_rate", ""),
      assetLocation: get("assetLocation", "asset_location", ""),
      tagSerialNumber: get("tagSerialNumber", "tag_serial_number", ""),
      notes: get("notes", "notes", ""),
      // NEW: status
      status: get("status", "status", "Active"),
    };
  }, [initialData]);

  const [form, setForm] = useState(init);
  const [serverErrors, setServerErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // auto-calc depreciationRate for Straight Line
  useEffect(() => {
    const { amount, usefulLife, salvageValue, depreciationMethod } = form;

    const A = parseFloat(amount);
    const L = parseFloat(usefulLife);
    const S = parseFloat(salvageValue);

    if (depreciationMethod === "Straight Line") {
      if (!isNaN(A) && !isNaN(L) && !isNaN(S) && L > 0 && A > 0) {
        const annual = (A - S) / L;
        const rate = (annual / A) * 100;
        setForm(prev => ({ ...prev, depreciationRate: rate.toFixed(2) }));
      } else {
        setForm(prev => ({ ...prev, depreciationRate: "" }));
      }
    }
  }, [form.amount, form.usefulLife, form.salvageValue, form.depreciationMethod]);

  const err = (k) => serverErrors?.[k]?.[0] || "";
  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const toPayload = () => ({
    ...(isEditMode && form.id != null ? { id: form.id } : {}),
    // 🔐 যদি parent থেকে companyId এসেছে, সেটাই দাও; নাহলে আগের data থেকে
    ...(companyId ? { company_id: companyId } : {}),
    name: form.name?.trim(),
    category: form.category,
    purchaseDate: form.purchaseDate,
    amount: Number(form.amount || 0),
    vendorName: form.vendorName,
    purchaseMode: form.purchaseMode,
    paymentMode: form.purchaseMode === "On Credit" ? null : form.paymentMode,
    usefulLife: Number(form.usefulLife || 0),
    salvageValue: Number(form.salvageValue || 0),
    depreciationMethod: form.depreciationMethod,
    frequency: form.frequency,
    depreciationRate: form.depreciationRate !== "" ? Number(form.depreciationRate) : undefined,
    assetLocation: form.assetLocation,
    tagSerialNumber: form.tagSerialNumber,
    notes: form.notes,
    // NEW: status
    status: form.status,
  });

  const submit = async (e) => {
    e.preventDefault();
    setServerErrors({});

    if (!form.name?.trim()) {
      toast({ title: "Validation", description: "Asset name is required.", variant: "destructive" });
      return;
    }
    if (!form.purchaseDate) {
      toast({ title: "Validation", description: "Purchase date is required.", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      const resp = await onSave?.(toPayload(), isEditMode);
      if (resp && resp.ok === false) {
        setServerErrors(resp?.errors || resp?.data?.errors || {});
        return;
      }
      onCancel?.();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {Object.keys(serverErrors).length > 0 && (
        <div className="rounded border border-red-300 bg-red-50 text-red-800 text-sm p-3">
          <div className="font-semibold mb-1">Please fix the errors below:</div>
          <ul className="list-disc pl-5 space-y-0.5">
            {Object.entries(serverErrors).map(([k, v]) => (
              <li key={k}>{Array.isArray(v) ? v[0] : String(v)}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label>Asset Name <span className="text-red-500">*</span></Label>
          <Input value={form.name} onChange={set("name")} placeholder="Dell Laptop" />
          {err("name") && <p className="text-xs text-red-600 mt-1">{err("name")}</p>}
        </div>
        <div>
          <Label>Tag/Serial Number</Label>
          <Input value={form.tagSerialNumber} onChange={set("tagSerialNumber")} placeholder="LT-0001" />
        </div>

        <div>
          <Label>Category</Label>
          <Input value={form.category} onChange={set("category")} placeholder="Computer" />
        </div>
        <div>
          <Label>Purchase Date <span className="text-red-500">*</span></Label>
          <Input type="date" value={form.purchaseDate} onChange={set("purchaseDate")} />
        </div>

        <div>
          <Label>Amount</Label>
          <Input type="number" value={form.amount} onChange={set("amount")} placeholder="1500.00" />
        </div>
        <div>
          <Label>Vendor Name</Label>
          <Input value={form.vendorName} onChange={set("vendorName")} placeholder="Tech Solutions Ltd." />
        </div>

        <div>
          <Label>Purchase Mode</Label>
          <Select value={form.purchaseMode} onValueChange={(v)=>setForm(p=>({...p,purchaseMode:v}))}>
            <SelectTrigger><SelectValue placeholder="Select mode" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Cash Purchase">Cash Purchase</SelectItem>
              <SelectItem value="Bank Purchase">Bank Purchase</SelectItem>
              <SelectItem value="On Credit">On Credit</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {form.purchaseMode !== "On Credit" && (
          <div>
            <Label>Payment From</Label>
            <Input value={form.paymentMode} onChange={set("paymentMode")} placeholder="Cash/Bank Account" />
          </div>
        )}

        <div>
          <Label>Useful Life (Years)</Label>
          <Input type="number" value={form.usefulLife} onChange={set("usefulLife")} placeholder="5" />
        </div>
        <div>
          <Label>Salvage Value</Label>
          <Input type="number" value={form.salvageValue} onChange={set("salvageValue")} placeholder="100.00" />
        </div>

        <div>
          <Label>Depreciation Method</Label>
          <Select value={form.depreciationMethod} onValueChange={(v)=>setForm(p=>({...p,depreciationMethod:v}))}>
            <SelectTrigger><SelectValue placeholder="Select method" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Straight Line">Straight Line</SelectItem>
              <SelectItem value="Reducing Balance">Reducing Balance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Frequency</Label>
          <Select value={form.frequency} onValueChange={(v)=>setForm(p=>({...p,frequency:v}))}>
            <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Monthly">Monthly</SelectItem>
              <SelectItem value="Yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Depreciation Rate (%)</Label>
          <Input
            type="number"
            value={form.depreciationRate}
            onChange={set("depreciationRate")}
            readOnly={form.depreciationMethod === "Straight Line"}
            placeholder="Auto for Straight Line"
          />
        </div>

        <div>
          <Label>Asset Location</Label>
          <Input value={form.assetLocation} onChange={set("assetLocation")} placeholder="Head Office" />
        </div>

        {/* NEW: Status */}
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v)=>setForm(p=>({...p,status:v}))}>
            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2">
          <Label>Notes</Label>
          <Textarea rows={2} value={form.notes} onChange={set("notes")} placeholder="Optional notes..." />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{isEditMode ? "Update Asset" : "Save Asset"}</Button>
      </div>
    </form>
  );
}
