"use client";

import AddAssetForm from "@/components/assets/AddAssetForm";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { createAsset, deleteAsset, fetchAssets, updateAsset } from "@/services/asset";
import { PlusCircle, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import AssetsTable from "./AssetsTable";

/**
 * Props:
 *  - companyId: number | string  (required in practice)
 *  - initialAssets?: array
 *  - autoLoad?: boolean
 */
export default function AssetsRegister({ companyId, initialAssets = [], autoLoad = true }) {
  const { toast } = useToast();

  const [assets, setAssets] = useState(initialAssets);
  const [search, setSearch] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "purchaseDate", direction: "descending" });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const reload = async () => {
    try {
      setLoading(true);
      setLoadError("");
      const res = await fetchAssets({ per_page: 100, search });
      const list =
        Array.isArray(res?.data) ? res.data :
        Array.isArray(res) ? res :
        Array.isArray(res?.data?.data) ? res.data.data : [];
      setAssets(list);
    } catch (e) {
      setLoadError("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  // autoload once on mount
  useEffect(() => {
    if (autoLoad) reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const rows = useMemo(() => {
    let list = [...assets];
    const term = search.trim().toLowerCase();
    if (term) {
      list = list.filter((a) => {
        const hay = [
          a.name,
          a.category,
          a.vendor_name || a.vendorName,
          a.tag_serial_number || a.tagSerialNumber,
          a.asset_location || a.assetLocation,
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(term);
      });
    }

    const { key, direction } = sortConfig || {};
    if (key) {
      list.sort((a, b) => {
        const getVal = (obj) => {
          const v = obj[key] ?? obj[key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)];
          if (key === "amount" || key === "usefulLife" || key === "salvageValue") return parseFloat(v || 0);
          if (key === "purchaseDate") return v ? new Date(v).getTime() : 0;
          return (v ?? "").toString().toLowerCase();
        };
        const av = getVal(a), bv = getVal(b);
        if (av < bv) return direction === "ascending" ? -1 : 1;
        if (av > bv) return direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [assets, search, sortConfig]);

  const openCreate = () => {
    setAssetToEdit(null);
    setIsModalOpen(true);
  };

  const openEdit = (row) => {
    setAssetToEdit({
      id: row.id,
      company_id: row.companyId ?? row.company_id, // keep for edit payload
      name: row.name,
      category: row.category,
      purchaseDate: row.purchase_date || row.purchaseDate,
      amount: row.amount,
      vendorName: row.vendor_name || row.vendorName,
      purchaseMode: row.purchase_mode || row.purchaseMode,
      paymentMode: row.payment_mode || row.paymentMode,
      usefulLife: row.useful_life || row.usefulLife,
      salvageValue: row.salvage_value || row.salvageValue,
      depreciationMethod: row.depreciation_method || row.depreciationMethod,
      frequency: row.frequency,
      depreciationRate: row.depreciation_rate || row.depreciationRate,
      assetLocation: row.asset_location || row.assetLocation,
      tagSerialNumber: row.tag_serial_number || row.tagSerialNumber,
      notes: row.notes,
      // NEW: status
      status: row.status,
    });
    setIsModalOpen(true);
  };

  // 🔐 Always inject company_id before API call
  const withCompanyId = (payload) => ({
    ...payload,
    company_id: (companyId ?? payload.company_id ?? assetToEdit?.company_id) || undefined,
  });

  const handleSave = async (payload, isEdit) => {
    const finalPayload = withCompanyId(payload);

    if (isEdit && payload.id != null) {
      const res = await updateAsset(payload.id, finalPayload);
      if (!res?.ok) return { ok: false, errors: res?.data?.errors, statusText: res?.statusText };
      await reload();
      toast({ title: "Asset Updated", description: `${payload.name} updated.` });
      return { ok: true };
    } else {
      const res = await createAsset(finalPayload);
      if (!res?.ok) return { ok: false, errors: res?.data?.errors, statusText: res?.statusText };
      const created = res?.data?.data ?? res?.data;
      if (created?.id) setAssets((prev) => [...prev, created]);
      else await reload();
      toast({ title: "Asset Created", description: `${payload.name} created.` });
      return { ok: true };
    }
  };

  const askDelete = (row) => {
    setToDelete(row);
    setConfirmOpen(true);
  };
  const confirmDelete = async () => {
    if (!toDelete?.id) {
      setConfirmOpen(false);
      return;
    }
    const res = await deleteAsset(toDelete.id);
    if (!res?.ok) {
      toast({ title: "Delete failed", description: res?.statusText || "error", variant: "destructive" });
    } else {
      setAssets((prev) => prev.filter((x) => x.id !== toDelete.id));
      toast({ title: "Deleted", description: `${toDelete.name} removed.` });
    }
    setConfirmOpen(false);
    setToDelete(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <Input
            placeholder="Search (name, category, vendor, tag)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && reload()}
            className="w-full sm:w-72 md:w-80"
          />
          <Button className="h-10" onClick={reload}>
            <Search className="mr-2 h-4 w-4" /> Search
          </Button>
          <Button className="h-10" variant="outline" onClick={openCreate}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Asset
          </Button>
        </div>
      </div>

      {/* Loading & error states */}
      {loading ? (
        <div className="p-4 space-y-3">
          <Skeleton className="h-8 w-[240px]" />
          <Skeleton className="h-[360px] w-full" />
        </div>
      ) : loadError ? (
        <div className="p-4 text-red-600 text-sm">{loadError}</div>
      ) : (
        <div className="overflow-x-auto">
          <AssetsTable
            assets={rows}
            onEdit={(asset) => openEdit(asset)}
            onDelete={(id) => {
              const row = (assets || []).find((a) => String(a.id) === String(id));
              if (row) askDelete(row);
            }}
            requestSort={requestSort}
          />
        </div>
      )}

      {/* Create/Edit */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[680px]">
          <DialogHeader>
            <DialogTitle>{assetToEdit ? "Edit Asset" : "Add Asset"}</DialogTitle>
          </DialogHeader>
          <AddAssetForm
            onSave={handleSave}
            onCancel={() => setIsModalOpen(false)}
            initialData={assetToEdit}
            isEditMode={!!assetToEdit}
            companyId={companyId}
          />
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete asset?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. It will permanently delete “{toDelete?.name}”.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={confirmDelete}>
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
