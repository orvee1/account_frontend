// src/components/forms/AddVendorForm.jsx
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Save } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Props:
 *  - onSave: (payloadCamelCase, isEdit:boolean) => void | Promise<{ok?:boolean, errors?:object}>
 *  - onCancel: () => void
 *  - initialData: object (camelCase or snake_case; vendorNumber supported)
 *  - isEditMode: boolean
 *
 * Payload (EXACT camelCase as requested):
 * {
 *   name, displayName, proprietorName, customerNumber, phoneNumber, email,
 *   address, nid, bankDetails, notes, creditLimit, openingBalance, openingBalanceDate
 *   // id: only on edit (if present)
 * }
 */
export default function AddVendorForm({
  onSave,
  onCancel,
  initialData,
  isEditMode = false,
}) {
  const { toast } = useToast();

  // normalize incoming data -> camelCase state (maps snake_case & vendorNumber)
  const init = useMemo(() => {
    const d = initialData || {};
    const get = (a, b, fallback = "") => d?.[a] ?? d?.[b] ?? fallback;

    return {
      id: d?.id ?? undefined, // শুধুমাত্র edit-এ কাজে লাগবে
      name: get("name", "name", ""),
      displayName: get("displayName", "display_name", ""),
      proprietorName: get("proprietorName", "proprietor_name", ""),
      // vendorNumber fallback -> customerNumber
      customerNumber:
        get("customerNumber", "customer_number") ||
        get("vendorNumber", "vendor_number", ""),
      phoneNumber: get("phoneNumber", "phone_number", ""),
      email: get("email", "email", ""),
      address: get("address", "address", ""),
      nid: get("nid", "nid", ""),
      bankDetails: get("bankDetails", "bank_details", ""),
      notes: get("notes", "notes", ""),
      creditLimit: Number(get("creditLimit", "credit_limit", 0)),
      openingBalance: Number(get("openingBalance", "opening_balance", 0)),
      openingBalanceType: get("openingBalanceType", "opening_balance_type", ""),
      openingBalanceDate: get("openingBalanceDate", "opening_balance_date", ""),
    };
  }, [initialData]);

  const [form, setForm] = useState(init);
  const [serverErrors, setServerErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!init.id;

  const err = (key) => serverErrors?.[key]?.[0] || "";

  const set = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  // EXACT camelCase payload
  const toPayload = () => {
    const payload = {
      // ✅ EXACT camelCase — your JSON spec
      ...(isEditMode && init.id != null ? { id: init.id } : {}),
      name: form.name?.trim(),
      displayName: form.displayName,
      proprietorName: form.proprietorName,
      customerNumber: form.customerNumber,
      phoneNumber: form.phoneNumber,
      email: form.email,
      address: form.address,
      nid: form.nid,
      bankDetails: form.bankDetails,
      notes: form.notes,
      creditLimit: Number(form.creditLimit || 0),
      openingBalance: Number(form.openingBalance || 0),
      openingBalanceType: form.openingBalanceType || "",
      openingBalanceDate: form.openingBalanceDate || "",
    };
    // only on edit: include id so caller can match & update
    if (isEditMode && init.id != null) payload.id = init.id;
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerErrors({});

    // minimal validations
    if (!form.name?.trim()) {
      toast({
        title: "Validation",
        description: "Name is required.",
        variant: "destructive",
      });
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast({
        title: "Validation",
        description: "Invalid email.",
        variant: "destructive",
      });
      return;
    }
    if (form.phoneNumber && !/^[-+()0-9\s]+$/.test(form.phoneNumber)) {
      toast({
        title: "Validation",
        description: "Invalid phone number.",
        variant: "destructive",
      });
      return;
    }

    const payload = toPayload();

    try {
      setSubmitting(true);
      const resp = await onSave?.(payload, isEditMode);
      if (resp && resp.ok === false) {
        const errs = resp?.errors || resp?.data?.errors || {};
        setServerErrors(errs);
        return;
      }
      // success handled by parent (toast + close)
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* server error summary */}
      {serverErrors && Object.keys(serverErrors).length > 0 && (
        <div className="rounded border border-red-300 bg-red-50 text-red-800 text-sm p-3">
          <div className="font-semibold mb-1">Please fix the errors below:</div>
          <ul className="list-disc pl-5 space-y-0.5">
            {Object.entries(serverErrors).map(([k, v]) => (
              <li key={k}>{Array.isArray(v) ? v[0] : String(v)}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <Label className="mb-1 block">
          Name <span className="text-red-500">*</span>
        </Label>
        <Input
          value={form.name}
          onChange={set("name")}
          placeholder="Client Omega Corp."
        />
        {err("name") && (
          <p className="text-xs text-red-600 mt-1">{err("name")}</p>
        )}
      </div>
      <div>
        <Label className="mb-1 block">Display Name</Label>
        <Input
          value={form.displayName}
          onChange={set("displayName")}
          placeholder="Omega Corp."
        />
        {err("displayName") && (
          <p className="text-xs text-red-600 mt-1">{err("displayName")}</p>
        )}
      </div>

      <div>
        <Label className="mb-1 block">Proprietor Name</Label>
        <Input
          value={form.proprietorName}
          onChange={set("proprietorName")}
          placeholder="Jane Smith"
        />
        {err("proprietorName") && (
          <p className="text-xs text-red-600 mt-1">{err("proprietorName")}</p>
        )}
      </div>
      <div>
        <Label className="mb-1 block">Customer/Vendor No.</Label>
        <Input
          value={form.customerNumber}
          onChange={set("customerNumber")}
          placeholder="C001"
        />
        {err("customerNumber") && (
          <p className="text-xs text-red-600 mt-1">{err("customerNumber")}</p>
        )}
      </div>

      <div>
        <Label className="mb-1 block">Phone</Label>
        <Input
          value={form.phoneNumber}
          onChange={set("phoneNumber")}
          placeholder="+1234567890"
        />
        {err("phoneNumber") && (
          <p className="text-xs text-red-600 mt-1">{err("phoneNumber")}</p>
        )}
      </div>
      <div>
        <Label className="mb-1 block">Email</Label>
        <Input
          type="email"
          value={form.email}
          onChange={set("email")}
          placeholder="contact@example.com"
        />
        {err("email") && (
          <p className="text-xs text-red-600 mt-1">{err("email")}</p>
        )}
      </div>

      {/* address */}
      <div>
        <Label className="mb-1 block">Address</Label>
        <Textarea
          rows={2}
          value={form.address}
          onChange={set("address")}
          placeholder="456 Client Ave"
        />
        {err("address") && (
          <p className="text-xs text-red-600 mt-1">{err("address")}</p>
        )}
      </div>

      <div>
        <Label className="mb-1 block">NID</Label>
        <Input
          value={form.nid}
          onChange={set("nid")}
          placeholder="1234567890"
        />
        {err("nid") && (
          <p className="text-xs text-red-600 mt-1">{err("nid")}</p>
        )}
      </div>
      <div>
        <Label className="mb-1 block">Bank Details</Label>
        <Input
          value={form.bankDetails}
          onChange={set("bankDetails")}
          placeholder="Bank ABC, Acc 123"
        />
        {err("bankDetails") && (
          <p className="text-xs text-red-600 mt-1">{err("bankDetails")}</p>
        )}
      </div>

      {/* notes */}
      <div>
        <Label className="mb-1 block">Notes</Label>
        <Textarea
          rows={2}
          value={form.notes}
          onChange={set("notes")}
          placeholder="VIP"
        />
        {err("notes") && (
          <p className="text-xs text-red-600 mt-1">{err("notes")}</p>
        )}
      </div>

      <div>
        <Label className="mb-1 block">Credit Limit</Label>
        <Input
          type="number"
          value={form.creditLimit}
          onChange={set("creditLimit")}
        />
        {err("creditLimit") && (
          <p className="text-xs text-red-600 mt-1">{err("creditLimit")}</p>
        )}
      </div>
      {!isEditing && (
        <>
          <div>
            <Label className="mb-1 block">Opening Balance</Label>
            <Input
              type="number"
              value={form.openingBalance}
              onChange={set("openingBalance")}
            />
            {err("openingBalance") && (
              <p className="text-xs text-red-600 mt-1">{err("openingBalance")}</p>
            )}
          </div>
          <div>
            <Label className="mb-1 block">
              Opening Balance Type <span className="text-red-500">*</span>
            </Label>
            <Select
              onValueChange={(v) => setForm(prev => ({ ...prev, openingBalanceType: v }))}
              value={form.openingBalanceType}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debit">Debit</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
              </SelectContent>
            </Select>
            {err("openingBalanceType") && (
              <p className="text-xs text-red-600 mt-1">{err("openingBalanceType")}</p>
            )}
          </div>
          <div>
            <Label className="mb-1 block">Opening Balance Date</Label>
            <Input
              type="date"
              value={form.openingBalanceDate}
              onChange={set("openingBalanceDate")}
            />
            {err("openingBalanceDate") && (
              <p className="text-xs text-red-600 mt-1">
                {err("openingBalanceDate")}
              </p>
            )}
          </div>
        </>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting}>
          <Save size={16} className="mr-2" />
          {submitting
            ? "Saving..."
            : isEditMode
              ? "Update Vendor"
              : "Save Vendor"}
        </Button>
      </div>
    </form>
  );
}
