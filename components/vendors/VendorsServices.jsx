// components/vendors/VendorsServices.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  const fileInputRef = useRef(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  const IMPORT_VENDOR_HEADERS = [
    "Vendor Name",
    "Display Name",
    "Proprietor Name",
    "Vendor Code",
    "Phone",
    "Email",
    "Address",
    "NID",
    "Bank Details",
    "Notes",
    "Credit Limit",
    "Opening Balance",
    "Opening Balance Type",
    "Opening Balance Date",
    "Status",
  ];

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

  const extractString = (value) => String(value ?? "").trim();

  const makeVendorPayload = (row) => ({
    name: extractString(row["Vendor Name"]),
    displayName: extractString(row["Display Name"]),
    proprietorName: extractString(row["Proprietor Name"]),
    vendorCode: extractString(row["Vendor Code"]),
    phoneNumber: extractString(row["Phone"]),
    email: extractString(row["Email"]),
    address: extractString(row["Address"]),
    nid: extractString(row["NID"]),
    bankDetails: extractString(row["Bank Details"]),
    notes: extractString(row["Notes"]),
    creditLimit: Number(row["Credit Limit"] ?? 0),
    openingBalance: row["Opening Balance"] ? Number(row["Opening Balance"]) : 0,
    openingBalanceType: extractString(row["Opening Balance Type"]),
    openingBalanceDate: extractString(row["Opening Balance Date"]),
  });

  const downloadVendorTemplate = () => {
    const sampleRow = {
      "Vendor Name": "Example Vendor",
      "Display Name": "Vendor Co.",
      "Proprietor Name": "John Doe",
      "Vendor Code": "VEND001",
      Phone: "+8801234567890",
      Email: "vendor@example.com",
      Address: "123 Vendor St",
      NID: "1234567890",
      "Bank Details": "Bank XYZ, Acc 456",
      Notes: "Preferred vendor",
      "Credit Limit": 50000,
      "Opening Balance": 2000,
      "Opening Balance Type": "Credit",
      "Opening Balance Date": "2026-08-01",
      Status: "active",
    };

    const worksheet = XLSX.utils.json_to_sheet([sampleRow], { header: IMPORT_VENDOR_HEADERS });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vendors");
    XLSX.writeFile(workbook, "vendor-import-template.xlsx");
  };

  const parseVendorImportFile = async (file) => {
    const extension = file.name.split(".").pop().toLowerCase();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target.result;
          if (extension === "csv") {
            const parsed = Papa.parse(content, {
              header: true,
              skipEmptyLines: true,
              transformHeader: (header) => String(header ?? "").trim(),
            });
            resolve(parsed.data.filter((row) => Object.values(row).some((value) => value !== null && value !== "")));
          } else if (extension === "xlsx" || extension === "xls") {
            const workbook = XLSX.read(content, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });
            resolve(jsonData.filter((row) => Object.values(row).some((value) => value !== null && value !== "")));
          } else {
            reject(new Error("Unsupported file type"));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      if (extension === "csv") {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const handleVendorImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    setSelectedFileName(file.name);
    setImportErrors([]);
    setImportSummary(null);
    try {
      const rows = await parseVendorImportFile(file);
      if (!rows || rows.length === 0) {
        setImportRows([]);
        setImportErrors(["No vendor rows found in the selected file."]);
      } else {
        setImportRows(rows);
      }
      setIsImportDialogOpen(true);
    } catch (error) {
      setImportRows([]);
      setImportErrors([error?.message || "Unable to parse file"]);
      setIsImportDialogOpen(true);
    }
  };

  const resetVendorImportDialog = () => {
    setIsImportDialogOpen(false);
    setImportRows([]);
    setImportErrors([]);
    setSelectedFileName("");
    setImportSummary(null);
    setImporting(false);
  };

  const importVendors = async () => {
    if (!importRows.length) return;
    setImporting(true);
    const summary = { success: 0, failed: 0, errors: [] };
    for (let index = 0; index < importRows.length; index += 1) {
      const row = importRows[index];
      const payload = makeVendorPayload(row);
      const res = await createVendor(payload);
      if (res.ok) {
        const created = res.data?.data ?? res.data ?? null;
        if (created) {
          setVendors((prev) => [formatVendorForDisplay({ ...created, sl: prev.length + 1 }), ...prev]);
        }
        summary.success += 1;
      } else {
        summary.failed += 1;
        const message = res?.errors ? JSON.stringify(res.errors) : res.statusText || "Import failed";
        summary.errors.push(`Row ${index + 2}: ${message}`);
      }
    }
    setImportSummary(summary);
    setImporting(false);
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="text-primary dark:text-dark-primary border-primary dark:border-dark-primary hover:bg-orange-500/10 shadow-sm flex items-center">
                <FileDown size={16} className="mr-2" /> Import
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card dark:bg-dark-card shadow-lg rounded-md border border-border dark:border-dark-border">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="text-foreground dark:text-dark-foreground hover:bg-primary/10 dark:hover:bg-dark-primary/10 cursor-pointer">
                Bulk upload
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadVendorTemplate} className="text-foreground dark:text-dark-foreground hover:bg-primary/10 dark:hover:bg-dark-primary/10 cursor-pointer">
                Download template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button type="button" onClick={() => handleOpenModal(null)}>
            <PlusCircle size={20} className="mr-2" /> Add New
          </Button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleVendorImportFile}
      />
      {isImportDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="text-xl font-semibold">Import Vendors</h3>
                <p className="text-sm text-slate-500">Upload vendor data using the template, then review before importing.</p>
                {selectedFileName && <p className="text-sm text-slate-500">File: {selectedFileName}</p>}
              </div>
              <button type="button" className="rounded-full bg-slate-100 px-3 py-1" onClick={resetVendorImportDialog}>Close</button>
            </div>
            <div className="space-y-4 p-5">
              {importErrors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <div className="font-semibold">Import errors</div>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    {importErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border bg-slate-50 p-3 text-sm">
                  <div className="font-semibold">Parsed rows</div>
                  <div className="mt-2 text-lg">{importRows.length}</div>
                </div>
                <div className="rounded-lg border bg-slate-50 p-3 text-sm">
                  <div className="font-semibold">Action</div>
                  <div className="mt-2 text-slate-500">Use the Download template action to build your import file.</div>
                </div>
                <div className="rounded-lg border bg-slate-50 p-3 text-sm">
                  <div className="font-semibold">Status</div>
                  <div className="mt-2 text-slate-500">Only valid rows will be imported.</div>
                </div>
              </div>
              {importRows.length > 0 && (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-slate-100 text-xs uppercase text-slate-700">
                      <tr>
                        <th className="px-3 py-2">Row</th>
                        <th className="px-3 py-2">Vendor Name</th>
                        <th className="px-3 py-2">Vendor Code</th>
                        <th className="px-3 py-2">Phone</th>
                        <th className="px-3 py-2">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.slice(0, 20).map((row, index) => (
                        <tr key={index} className="border-t hover:bg-slate-50">
                          <td className="px-3 py-2 align-top">{index + 2}</td>
                          <td className="px-3 py-2 align-top">{row["Vendor Name"] || "—"}</td>
                          <td className="px-3 py-2 align-top">{row["Vendor Code"] || "—"}</td>
                          <td className="px-3 py-2 align-top">{row["Phone"] || "—"}</td>
                          <td className="px-3 py-2 align-top">{row["Email"] || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 text-sm text-slate-600">
                  <p>Template headers should match exactly.</p>
                  <p className="text-xs">Preview shows first 20 rows.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                    Choose another file
                  </Button>
                  <Button type="button" onClick={importVendors} disabled={importing || importRows.length === 0}>
                    {importing ? "Importing..." : "Import vendors"}
                  </Button>
                </div>
              </div>
              {importSummary && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="font-semibold">Import summary</div>
                  <p className="mt-2">Imported: {importSummary.success}</p>
                  <p>Failed: {importSummary.failed}</p>
                  {importSummary.errors.length > 0 && (
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      {importSummary.errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
