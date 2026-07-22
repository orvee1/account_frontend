'use client';

import { useState } from "react";
import { useToast } from "../ui/use-toast";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { Button } from "../ui/button";

export default function CategoryForm({ onSave, onCancel, initial = null, isEdit = false, error = '' }) {
  const { toast } = useToast();
  const [name, setName] = useState(initial?.name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [status, setStatus] = useState((initial?.status || 'active') === 'active');
  const [parentId, setParentId] = useState(initial?.parent_id || "");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const err = (k) => (errors?.[k]?.[0] || "");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!name.trim()) {
      setErrors({ name: ["The category name is required."] });
      return;
    }
    setSubmitting(true);
    const payload = {
      name,
      slug: slug || null,
      description: description || null,
      status: status ? 'active' : 'inactive',
      parent_id: parentId ? Number(parentId) : null,
    };
    const resp = await onSave(payload, isEdit, initial?.id);
    setSubmitting(false);

    if (!resp?.data && !resp?.ok) {
      setErrors(resp?.errors || resp?.data?.errors || {});
      return;
    }

    toast({ title: isEdit ? "Category Updated" : "Category Created", description: name });
    onCancel();
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
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Pharmaceuticals" />
        {err("name") && <p className="text-xs text-red-600 mt-1">{err("name")}</p>}
      </div>

      <div>
        <Label className="mb-1 block">Slug</Label>
        <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="pharmaceuticals" />
        {err("slug") && <p className="text-xs text-red-600 mt-1">{err("slug")}</p>}
      </div>

      <div>
        <Label className="mb-1 block">Parent Category (ID)</Label>
        <Input type="number" value={parentId} onChange={(e) => setParentId(e.target.value)} placeholder="optional parent id" />
        {err("parent_id") && <p className="text-xs text-red-600 mt-1">{err("parent_id")}</p>}
      </div>

      <div>
        <Label className="mb-1 block">Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description..." />
        {err("description") && <p className="text-xs text-red-600 mt-1">{err("description")}</p>}
      </div>

      <div className="flex items-center gap-3">
        <Switch checked={status} onCheckedChange={setStatus} />
        <Label>Status (Active)</Label>
      </div>
      {err("status") && <p className="text-xs text-red-600">{err("status")}</p>}

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{submitting ? "Saving..." : (isEdit ? "Update" : "Save")}</Button>
      </div>
    </form>
  );
}
