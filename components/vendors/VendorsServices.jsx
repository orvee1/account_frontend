// components/vendors/VendorsServices.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { PlusCircle, Edit, Trash2, FileDown } from "lucide-react";
import SortableHeader from "@/components/vendors/SortableHeader";
import { fetchVendors, createVendor, updateVendor, deleteVendor } from "@/services/vendor";
import formatVendorForDisplay from "@/components/vendors/utils/formatVendorForDisplay";
import AddVendorForm from "@/components/vendors/AddVendorForm";
import VendorProfileLedger from "@/components/vendors/VendorProfileLedger";
import VendorDetailsModal from "@/components/vendors/VendorDetailsModal";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function VendorsServices({ initialVendors = [] }) {
  // normalize initial
  const starting = Array.isArray(initialVendors?.data)
    ? initialVendors.data
    : Array.isArray(initialVendors)
      ? initialVendors
      : [];

  const [vendors, setVendors] = useState(
    starting.map((v, i) => formatVendorForDisplay({ ...v, sl: i + 1 }))
  );

  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "ascending" });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState(null);

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState(null);

  const [selectedVendorForLedger, setSelectedVendorForLedger] = useState(null);
  const [selectedVendorForDetails, setSelectedVendorForDetails] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // ------------ load helper (authoritative refresh) ------------
  const loadVendors = async () => {
    const res = await fetchVendors();
    // support both shapes: {data:[...]} or [...]
    const list =
      Array.isArray(res?.data) ? res.data :
        Array.isArray(res) ? res :
          Array.isArray(res?.data?.data) ? res.data.data : [];
    setVendors(list.map((v, i) => formatVendorForDisplay({ ...v, sl: i + 1 })));
  };

  // optional: initial reload from API if needed
  // useEffect(() => { loadVendors(); }, []);

  // ---------- search/sort ----------
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const requestSort = (columnKey) => {
    let direction = "ascending";
    if (sortConfig && sortConfig.key === columnKey && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key: columnKey, direction });
  };

  const sortedAndFilteredVendors = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let rows = [...vendors];

    if (term) {
      rows = rows.filter((v) => {
        const hay = [v.name, v.displayName, v.address, v.phoneNumber, v.email, String(v.balance ?? "")]
          .join(" ")
          .toLowerCase();
        return hay.includes(term);
      });
    }

    const { key, direction } = sortConfig || {};
    if (key) {
      rows.sort((a, b) => {
        let av = a[key];
        let bv = b[key];
        const numeric = new Set(["balance", "creditLimit", "sl", "id"]);
        if (numeric.has(String(key))) {
          av = parseFloat(av ?? 0) || 0;
          bv = parseFloat(bv ?? 0) || 0;
        } else {
          av = (av ?? "").toString().toLowerCase();
          bv = (bv ?? "").toString().toLowerCase();
        }
        if (av < bv) return direction === "ascending" ? -1 : 1;
        if (av > bv) return direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return rows;
  }, [vendors, searchTerm, sortConfig]);

  // ---------- modal open/close ----------
  const handleOpenModal = (v = null) => {
    setVendorToEdit(v ? { ...v } : null);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setVendorToEdit(null);
  };

  // ---------- CRUD (refetch after success) ----------
  const handleSaveVendor = async (apiPayload, isEdit) => {
    try {
      if (isEdit && apiPayload?.id != null) {
        const res = await updateVendor(apiPayload.id, apiPayload);
        if (!res?.ok) return { ok: false, statusText: res?.statusText };
        await loadVendors(); // authoritative refresh
        toast({
          title: "Vendor Updated",
          description: `${apiPayload?.name || "Vendor"} updated successfully.`,
        });
        handleCloseModal();
        return { ok: true };
      }

      const res = await createVendor(apiPayload);
      if (!res?.ok) return { ok: false, statusText: res?.statusText };

      // Try to append if API returned the created row, otherwise hard refresh
      const created = res?.data?.data ?? res?.data;
      if (created && (created.id ?? created.ID)) {
        const newSl = vendors.length > 0 ? Math.max(...vendors.map((x) => Number(x.sl) || 0)) + 1 : 1;
        setVendors((prev) => [...prev, formatVendorForDisplay({ ...created, sl: newSl })]);
      } else {
        await loadVendors();
      }

      toast({
        title: "Vendor Created",
        description: `${apiPayload?.name || "Vendor"} created successfully.`,
      });
      handleCloseModal();
      return { ok: true };
    } catch (e) {
      return { ok: false, statusText: e?.message || "error" };
    }
  };

  const handleDeleteVendor = (id) => {
    const found = vendors.find((v) => String(v.id) === String(id));
    if (found) {
      setVendorToDelete(found);
      setIsConfirmDeleteModalOpen(true);
    }
  };

  const confirmDelete = async () => {
    try {
      if (!vendorToDelete) return;
      const res = await deleteVendor(vendorToDelete.id);
      if (!res?.ok) {
        toast({ title: "Delete failed", description: res?.statusText || "error", variant: "destructive" });
        return;
      }
      // either remove locally or refetch
      setVendors((prev) => prev.filter((v) => String(v.id) !== String(vendorToDelete.id)));
      // or: await loadVendors();
      toast({ title: "Deleted", description: `${vendorToDelete.name} removed.` });
    } finally {
      setIsConfirmDeleteModalOpen(false);
      setVendorToDelete(null);
    }
  };

  // ---------- ledger ----------
  const handleOpenLedger = (vendor) => setSelectedVendorForLedger(vendor);
  const handleCloseLedger = () => setSelectedVendorForLedger(null);

  return (
    <div className={`p-4 md:p-6 ${isModalOpen ? "" : "space-y-6"}`}>
      <div className="flex justify-end">
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <Input
            type="text"
            placeholder="Search vendors (Name, Balance...)"
            className="mr-auto h-10 w-full sm:w-64 md:w-80"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <Button
            type="button"
            onClick={() => toast({ title: "Search Updated", description: `Displaying results for "${searchTerm}"` })}
          >
            Search
          </Button>
          <Button variant="outline" className="text-primary dark:text-dark-primary border-primary dark:border-dark-primary hover:bg-orange-500/10 shadow-sm">
            <FileDown size={16} className="mr-2" /> Import from Excel
          </Button>
          <Button
            variant="outline"
            className="text-primary dark:text-dark-primary border-primary dark:border-dark-primary hover:bg-orange-500/10 shadow-sm"
            onClick={() => handleOpenModal(null)}
          >
            <PlusCircle size={20} className="mr-2" /> Add New
          </Button>
        </div>
      </div>

      {/* Ledger Dialog */}
      {selectedVendorForLedger ? (
        <Dialog open={!!selectedVendorForLedger} onOpenChange={handleCloseLedger}>
          <DialogContent className="sm:max-w-[90%] h-[90vh] flex flex-col p-0">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="text-2xl font-bold">Vendor Ledger</DialogTitle>
              <DialogDescription>
                Detailed transaction history for {selectedVendorForLedger.name}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-y-auto p-4">
              <VendorProfileLedger
                vendorId={selectedVendorForLedger.id}
                vendorName={selectedVendorForLedger.name}
                onClose={handleCloseLedger}
                onEditVendor={handleOpenModal}
              />
            </div>
          </DialogContent>
        </Dialog>
      ) : null}

      {/* List Table */}
      <div className="overflow-x-auto rounded-lg border border-border dark:border-dark-border shadow-md max-h-[65vh] overflow-y-auto">
        <table className="w-full min-w-[700px] text-sm text-left text-foreground dark:text-dark-foreground">
          <thead className="sticky top-0 z-20 text-xs text-primary dark:text-dark-primary uppercase bg-muted dark:bg-dark-muted border-b border-slate-200 dark:border-slate-700">
            <tr>
              {/* ID columnKey ঠিক করা হল */}
              <SortableHeader columnKey="id" sortConfig={sortConfig} requestSort={requestSort} className="min-w-[80px]">
                ID
              </SortableHeader>
              <SortableHeader columnKey="name" sortConfig={sortConfig} requestSort={requestSort} className="min-w-[150px]">
                Vendor Name
              </SortableHeader>
              <SortableHeader columnKey="displayName" sortConfig={sortConfig} requestSort={requestSort} className="min-w-[150px]">
                Display Name
              </SortableHeader>
              <SortableHeader columnKey="address" sortConfig={sortConfig} requestSort={requestSort}>
                Address
              </SortableHeader>
              <SortableHeader columnKey="phoneNumber" sortConfig={sortConfig} requestSort={requestSort}>
                Phone Number
              </SortableHeader>
              <SortableHeader columnKey="balance" sortConfig={sortConfig} requestSort={requestSort} isTextRight={true}>
                Balance
              </SortableHeader>
              <th scope="col" className="px-4 py-3 text-center w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredVendors.map((vendor) => (
              <tr key={vendor.id} className="bg-card dark:bg-dark-card border-b border-border dark:border-dark-border last:border-b-0 hover:bg-muted/30 dark:hover:bg-dark-muted/30 transition-colors duration-150">
                <td className="px-4 py-3">{vendor.id}</td>
                <td className="px-4 py-3 font-medium text-secondary dark:text-dark-secondary">
                  <button
                    onClick={() => {
                      setSelectedVendorForDetails(vendor);
                      setIsDetailsModalOpen(true);
                    }}
                    className="text-primary dark:text-dark-primary hover:underline font-semibold cursor-pointer"
                  >
                    {vendor.name}
                  </button>
                </td>
                <td className="px-4 py-3">{vendor.displayName}</td>
                <td className="px-4 py-3">{vendor.address}</td>
                <td className="px-4 py-3">{vendor.phoneNumber}</td>
                <td className="px-4 py-3 text-right font-semibold">{vendor.balanceFormatted}</td>
                <td className="px-4 py-3 text-center space-x-1">
                  <Button variant="ghost" size="icon" className="text-secondary dark:text-dark-secondary hover:text-accent dark:hover:text-dark-accent h-8 w-8" onClick={() => handleOpenModal(vendor)}>
                    <Edit size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive dark:text-red-400 hover:text-destructive/80 dark:hover:bg-red-950/30 h-8 w-8" onClick={() => handleDeleteVendor(vendor.id)}>
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            ))}
            {sortedAndFilteredVendors.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-10 text-muted-foreground dark:text-dark-muted-foreground">
                  {searchTerm ? `No vendors found for "${searchTerm}".` : "No vendors found. Add your first vendor!"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[550px] bg-card dark:bg-dark-card text-foreground dark:text-dark-foreground border-border dark:border-dark-border shadow-2xl rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-primary dark:text-dark-primary text-2xl font-semibold">
              {vendorToEdit ? "Edit Vendor" : "Add New Vendor"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground dark:text-dark-muted-foreground">
              {vendorToEdit ? "Update vendor details." : "Fill in the details to add a new vendor."}
            </DialogDescription>
          </DialogHeader>
          <AddVendorForm
            onSave={handleSaveVendor}
            onCancel={handleCloseModal}
            initialData={vendorToEdit}
            isEditMode={!!vendorToEdit}
          />
        </DialogContent>
      </Dialog>

      {/* Confirm Delete */}
      <AlertDialog open={isConfirmDeleteModalOpen} onOpenChange={setIsConfirmDeleteModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vendor "{vendorToDelete?.name}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmDeleteModalOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Yes, delete vendor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Vendor Details Modal */}
      <VendorDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedVendorForDetails(null);
        }}
        vendor={selectedVendorForDetails}
      />
    </div>
  );
}
