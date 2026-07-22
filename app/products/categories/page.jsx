"use client";
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { fetchCategories, createCategory, deleteCategory, updateCategory } from "@/services/category";
import CategoryForm from "@/components/categories/CategoryForm";
import SortableHeader from "@/components/SortableHeader"; // reuse

export default function CategoriesPage() {
  const { toast } = useToast();
  const [list, setList] = useState([]);
  const [meta, setMeta] = useState(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" });

  const requestSort = (key) => {
    setSortConfig((prev) => (prev.key === key ? { key, direction: prev.direction === "asc" ? "desc" : "asc" } : { key, direction: "asc" }));
  };

  const fetchData = async (page = 1) => {
    const data = await fetchCategories({
      q: search,
      sort: sortConfig.key,
      dir: sortConfig.direction,
      page,
    });
    if (data) {
      setList(data?.data || []);
      setMeta(data?.meta || null);
    }
  };

  useEffect(() => {
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortConfig]);

  const handleOpenCreate = () => { setEditing(null); setOpen(true); };
  const handleOpenEdit = (row) => { setEditing(row); setOpen(true); };
  const handleClose = () => { setOpen(false); setEditing(null); };

  const onSave = async (payload, isEdit, id) => {
    try {
      if (isEdit && id) {
        const data = await updateCategory(id, payload);
        if (data) {
          setList((prev) => prev.map((x) => String(x.id) === String(id) ? data : x));
          handleClose();
        } else {
          setError("Failed to update category");
        }
        return { data };
      }
      const data = await createCategory(payload);
      if (data) {
        setList((prev) => [data, ...prev]);
        handleClose();
      } else {
        setError("Failed to create category");
      }
      return { data };
    } catch {
      setError("An unexpected error occurred");
      return { ok: false };
    }
  };

  const onDelete = async (id) => {
    if (!confirm("Delete this category?")) return;
    const resp = await deleteCategory(id);
    if (!resp) {
      toast({ title: "Delete failed", description: resp?.message || "Error", variant: "destructive" });
      return;
    }
    setList((prev) => prev.filter((x) => String(x.id) !== String(id)));
    toast({ title: "Category deleted" });
  };

  return (
    <div className="p-4">
      <div className="flex justify-end mb-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchData(1)}
            className="w-64"
          />
          <Button onClick={() => fetchData(1)}>Search</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate}>Add Category</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader><DialogTitle>{editing ? "Edit Category" : "Add Category"}</DialogTitle></DialogHeader>
              <CategoryForm isEdit={!!editing} initial={editing} onCancel={handleClose} onSave={onSave} error={error} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="overflow-auto border rounded">
        <table className="w-full min-w-[800px] text-sm text-left">
          <thead className="text-xs uppercase bg-muted/50">
            <tr>
              <SortableHeader columnKey="id" sortConfig={sortConfig} requestSort={requestSort} className="w-20">ID</SortableHeader>
              <SortableHeader columnKey="name" sortConfig={sortConfig} requestSort={requestSort} className="min-w-[250px]">Name</SortableHeader>
              <SortableHeader columnKey="parent_id" sortConfig={sortConfig} requestSort={requestSort}>Parent ID</SortableHeader>
              <SortableHeader columnKey="status" sortConfig={sortConfig} requestSort={requestSort}>Status</SortableHeader>
              <SortableHeader columnKey="created_at" sortConfig={sortConfig} requestSort={requestSort}>Created</SortableHeader>
              <th className="px-4 py-3 text-center w-44">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list?.length > 0 ? (
              list.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="px-4 py-3 text-xs font-mono">{row.id}</td>
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3">{row.parent_id ?? "-"}</td>
                  <td className="px-4 py-3">
                    {row.status === 'active'
                      ? <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">Active</span>
                      : <span className="px-2 py-0.5 text-xs rounded bg-gray-200 text-gray-700">Inactive</span>
                    }
                  </td>
                  <td className="px-4 py-3">{row.created_at ?? ""}</td>
                  <td className="px-2 py-2 text-center">
                    <button className="px-2 py-1 rounded border" onClick={() => handleOpenEdit(row)}>Edit</button>{" "}
                    <button className="px-2 py-1 rounded border text-red-600" onClick={() => onDelete(row.id)}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} className="text-center py-10 text-muted-foreground">No categories found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {meta?.last_page > 1 && (
        <div className="flex items-center gap-2 justify-end mt-3">
          <Button variant="secondary" disabled={meta.current_page <= 1} onClick={() => fetchData(meta.current_page - 1)}>Prev</Button>
          <span className="text-sm">Page {meta.current_page} of {meta.last_page}</span>
          <Button variant="secondary" disabled={meta.current_page >= meta.last_page} onClick={() => fetchData(meta.current_page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
