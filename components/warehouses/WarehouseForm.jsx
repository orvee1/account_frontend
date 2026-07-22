'use client';

import { useState } from "react";
import { useToast } from "../ui/use-toast";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";

export default function WarehouseForm({ onSave, onCancel, initial = null, isEdit = false, error = '' }) {
  const { toast } = useToast();
  const [name, setName] = useState(initial?.name || "");
  const [isDefault, setIsDefault] = useState(!!initial?.is_default);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const err = (k) => (errors?.[k]?.[0] || "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!name.trim()) {
      setErrors({ name: ["The warehouse name is required."] });
      return;
    }
    setSubmitting(true);
    const payload = {
      name,
      is_default: isDefault ? 1 : 0,
    };
    const resp = await onSave(payload, isEdit, initial?.id);
    setSubmitting(false);

    if (!resp?.ok) {
      setErrors(resp?.errors || resp?.data?.errors || {});
      return; // keep modal open
    }

    toast({ title: isEdit ? "Warehouse Updated" : "Warehouse Created", description: name });
    onCancel(); // close modal
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors && Object.keys(errors).length > 0 && (
        <div className="rounded border border-red-300 bg-red-50 text-red-800 text-sm p-3">
          <div className="font-semibold mb-1">Please fix the errors below:</div>
          <ul className="list-disc pl-5 space-y-0.5">
            {Object.entries(errors).map(([k, v]) => (
              <li key={k}>{Array.isArray(v) ? v[0] : String(v)}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <Label className="mb-1 block">Name<span className="text-red-500">*</span></Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Warehouse A" />
        {err("name") && <p className="text-xs text-red-600 mt-1">{err("name")}</p>}
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={isDefault} onCheckedChange={setIsDefault} />
        <Label>Default</Label>
      </div>
      {err("is_default") && <p className="text-xs text-red-600">{err("is_default")}</p>}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : (isEdit ? "Update" : "Save")}</Button>
      </div>
    </form>
  );
}
