"use client";
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { createWarehourse, deleteWarehourse, makeDefault, fetchWarehouses, updateWarehourse } from "@/services/warehouse";
import WarehouseForm from "@/components/warehouses/WarehouseForm";
import SortableHeader from "@/components/SortableHeader";

// ---- Page ----
export default function WarehousesPage() {
  const { toast } = useToast();
  const [list, setList] = useState([]);         // data
  const [meta, setMeta] = useState(null);       // pagination info (if needed)
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "desc" });

  const requestSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  const fetchData = async (page = 1) => {
    const data = await fetchWarehouses({
      search,
      sort: sortConfig.key,
      dir: sortConfig.direction,
      page,
    });
    if (data) {
      // Laravel resource pagination format: { data: [...], meta: {...} }
      setList(data?.data || []);
      setMeta(data?.meta || null);
      console.log(list, data?.data);
    }
  };

  useEffect(() => {
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortConfig]);

  const handleOpenCreate = () => {
    setEditing(null);
    setOpen(true);
  };

  const handleOpenEdit = (row) => {
    setEditing(row);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditing(null);
  };

 const onSave = async (payload, isEdit, id) => {
  try {
    if (isEdit && id) {
      const data = await updateWarehourse(id, payload);
      if ( data?.data) {
        setList((prev) => prev.map((x) => 
          String(x.id) === String(id) ? data.data : x
        ));
        handleClose();
      } else {
        setError( "Failed to update warehouse");
      }
      return { data };
    }

    const data = await createWarehourse(payload);
    if (data?.data) {
      setList((prev) => [data?.data, ...prev]);
      handleClose();
    } else {
      setError(error?.message || "Failed to create warehouse");
    }
    return {data };
  } catch (err) {
    setError( "An unexpected error occurred");
    return { ok: false };
  }
};

  const onDelete = async (id) => {
    if (!confirm("Delete this warehouse?")) return;
    const resp = deleteWarehourse(id);
    if (!resp) {
      toast({ title: "Delete failed", description: resp?.message || "Error", variant: "destructive" });
      return;
    }
    setList((prev) => prev.filter((x) => String(x.id) !== String(id)));
    toast({ title: "Warehouse deleted" });
  };

  const onMakeDefault = async (id) => {
    const resp = await makeDefault(id);
    if (!resp?.data) {
      toast({ title: "Failed to set default", description: resp?.data?.message || "Error", variant: "destructive" });
      return;
    }
    // refresh list default flags
    setList((prev) =>
      prev.map((x) => ({
        ...x,
        is_default: String(x.id) === String(id),
      }))
    );
    toast({ title: "Default warehouse updated" });
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-end mb-6">
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchData(1)}
            className="mr-auto w-64"
          />
          <Button onClick={() => fetchData(1)}>Search</Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate}>Add Warehouse</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editing ? "Edit Warehouse" : "Add Warehouse"}</DialogTitle>
              </DialogHeader>
              <WarehouseForm
                isEdit={!!editing}
                initial={editing}
                onCancel={handleClose}
                onSave={onSave}
                error={error}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="overflow-auto border rounded">
        <table className="w-full min-w-[700px] text-sm text-left text-foreground dark:text-dark-foreground">
          <thead className="text-xs text-primary dark:text-dark-primary uppercase bg-muted/50 dark:bg-dark-muted/50">
            <tr>
              <SortableHeader
                columnKey="id"
                sortConfig={sortConfig}
                requestSort={requestSort}
                className="w-20"
              >
                ID
              </SortableHeader>

              <SortableHeader
                columnKey="name"
                sortConfig={sortConfig}
                requestSort={requestSort}
                className="min-w-[250px]"
              >
                Name
              </SortableHeader>

              <SortableHeader
                columnKey="is_default"
                sortConfig={sortConfig}
                requestSort={requestSort}
              >
                Default
              </SortableHeader>

              <SortableHeader
                columnKey="created_at"
                sortConfig={sortConfig}
                requestSort={requestSort}
              >
                Created
              </SortableHeader>

              <th scope="col" className="px-4 py-3 text-center w-44">Actions</th>
            </tr>
          </thead>

          <tbody>
            {list?.length > 0 ? (
              list.map((w) => (
                <tr key={w.id} className="border-t">
                  <td className="px-4 py-3 text-xs font-mono">{w.id}</td>
                  <td className="px-4 py-3">{w.name}</td>
                  <td className="px-4 py-3">
                    {w.is_default ? (
                      <span className="px-2 py-0.5 text-xs rounded bg-green-100 text-green-700">Default</span>
                    ) : (
                      <button className="text-blue-600 underline" onClick={() => onMakeDefault(w.id)}>
                        Make default
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3">{w.created_at ?? ""}</td>
                  <td className="px-2 py-2 text-center">
                    <button className="px-2 py-1 rounded border" onClick={() => handleOpenEdit(w)}>Edit</button>{" "}
                    <button className="px-2 py-1 rounded border text-red-600" onClick={() => onDelete(w.id)}>Delete</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-10 text-muted-foreground dark:text-dark-muted-foreground">
                  No warehouses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination (optional) */}
      {meta?.last_page > 1 && (
        <div className="flex items-center gap-2 justify-end mt-3">
          <Button variant="secondary" disabled={meta.current_page <= 1} onClick={() => fetchData(meta.current_page - 1)}>Prev</Button>
          <span className="text-sm">
            Page {meta.current_page} of {meta.last_page}
          </span>
          <Button variant="secondary" disabled={meta.current_page >= meta.last_page} onClick={() => fetchData(meta.current_page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
