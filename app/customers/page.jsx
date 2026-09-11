'use client';

import React, { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { PlusCircle, Edit, Trash2, ArrowUpDown, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import AddCustomerForm from "@/components/custormers/AddCustomerForm";
import CustomerDetailsModal from "@/components/custormers/CustomerDetailsModal";
import {
  fetchCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from "@/services/customer";

const formatCustomerForDisplay = (customer) => {
  const balance = Number(customer.openingBalance ?? 0);
  return {
    ...customer,
    balance,
    balanceFormatted: (balance || 0).toLocaleString("en-US", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
  };
};

const SortableHeader = ({ children, columnKey, sortConfig, requestSort, isTextRight = false, className = "" }) => {
  const isSorted = sortConfig && sortConfig.key === columnKey;
  const direction = isSorted ? sortConfig.direction : null;

  return (
    <th
      scope="col"
      className={`px-4 py-3 cursor-pointer hover:bg-primary/10 dark:hover:bg-dark-primary/10 transition-colors ${isTextRight ? "text-right" : "text-left"} ${className}`}
      onClick={() => requestSort(columnKey)}
    >
      <div className={`flex items-center ${isTextRight ? "justify-end" : "justify-start"}`}>
        {!isTextRight && children}
        <span className={`mx-1 ${isTextRight ? "mr-0 ml-1" : "ml-0 mr-1"}`}>
          {isSorted ? (direction === "ascending" ? "▲" : "▼") : <ArrowUpDown size={14} className="opacity-40" />}
        </span>
        {isTextRight && children}
      </div>
    </th>
  );
};

export default function CustomersPage() {
  const { toast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "ascending" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [selectedCustomerForDetails, setSelectedCustomerForDetails] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const fileInputRef = useRef(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);

  const IMPORT_CUSTOMER_HEADERS = [
    "Name",
    "Display Name",
    "Proprietor Name",
    "Customer Number",
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

  const loadCustomers = async () => {
    const res = await fetchCustomers();
    if (res.ok) {
      const list = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      setCustomers(list.map(formatCustomerForDisplay));
    } else {
      toast({ title: "Failed to load", description: res.statusText || "Could not fetch customers", variant: "destructive" });
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleOpenModal = (customer = null) => {
    setCustomerToEdit(customer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCustomerToEdit(null);
  };

  const handleSaveCustomer = async (payload, isEdit) => {
    // Laravel: customer_number prohibited, তাই একদমই পাঠাবো না।
    const toSend = {
      name: payload.name,
      displayName: payload.displayName || null,
      proprietorName: payload.proprietorName || null,
      customerNumber: isEdit ? undefined : (payload.customerNumber || null),
      phoneNumber: payload.phoneNumber || null,
      email: payload.email || null,
      address: payload.address || null,
      nid: payload.nid || null,
      bankDetails: payload.bankDetails || null,
      notes: payload.notes || null,
      creditLimit: Number(payload.creditLimit ?? 0),
      openingBalanceType: isEdit ? undefined : (payload.openingBalanceType || null),
      openingBalance: isEdit ? undefined : Number(payload.openingBalance ?? 0),
      openingBalanceDate: isEdit ? undefined : (payload.openingBalanceDate || null),
    };

    Object.keys(toSend).forEach((k) => toSend[k] === undefined && delete toSend[k]);

    const res = isEdit
      ? await updateCustomer(payload.id, toSend)
      : await createCustomer(toSend);

    if (res.ok) {
      // ✅ optimistic update (reload ছাড়াই সাথে সাথে দেখাবে)
      const createdOrUpdated = res.data?.data ?? res.data ?? null;

      setCustomers((prev) => {
        if (!createdOrUpdated) return prev;
        const mapped = formatCustomerForDisplay(createdOrUpdated);
        return isEdit
          ? prev.map((c) => (c.id === mapped.id ? { ...c, ...mapped } : c))
          : [mapped, ...prev];
      });

      // তারপর একবার fresh fetch (fetchCustomers ভেতরে cache-bust আছে)
      await loadCustomers();

      return createdOrUpdated;
    } else {
      toast({
        title: isEdit ? "Update failed" : "Create failed",
        description: res.statusText || "Server error",
        variant: "destructive",
      });
      throw new Error(res.data?.message || res.statusText || "Could not save customer.");
    }
  };

  const extractString = (value) => String(value ?? "").trim();

  const makeCustomerPayload = (row) => ({
    name: extractString(row["Name"]),
    displayName: extractString(row["Display Name"]),
    proprietorName: extractString(row["Proprietor Name"]),
    customerNumber: extractString(row["Customer Number"]),
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
    status: extractString(row["Status"]) || "active",
  });

  const downloadCustomerTemplate = () => {
    const sampleRow = {
      Name: "Example Customer",
      "Display Name": "Example Co.",
      "Proprietor Name": "Jane Doe",
      "Customer Number": "CUST001",
      Phone: "+8801234567890",
      Email: "customer@example.com",
      Address: "123 Customer St",
      NID: "1234567890",
      "Bank Details": "Bank ABC, Acc 123",
      Notes: "Preferred customer",
      "Credit Limit": 50000,
      "Opening Balance": 1000,
      "Opening Balance Type": "Debit",
      "Opening Balance Date": "2026-08-01",
      Status: "active",
    };

    const worksheet = XLSX.utils.json_to_sheet([sampleRow], { header: IMPORT_CUSTOMER_HEADERS });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Customers");
    XLSX.writeFile(workbook, "customer-import-template.xlsx");
  };

  const parseCustomerImportFile = async (file) => {
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

  const handleCustomerImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";
    setSelectedFileName(file.name);
    setImportErrors([]);
    setImportSummary(null);
    try {
      const rows = await parseCustomerImportFile(file);
      if (!rows || rows.length === 0) {
        setImportRows([]);
        setImportErrors(["No customer rows found in the selected file."]);
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

  const resetCustomerImportDialog = () => {
    setIsImportDialogOpen(false);
    setImportRows([]);
    setImportErrors([]);
    setSelectedFileName("");
    setImportSummary(null);
    setImporting(false);
  };

  const importCustomers = async () => {
    if (!importRows.length) return;
    setImporting(true);
    const summary = { success: 0, failed: 0, errors: [] };
    for (let index = 0; index < importRows.length; index += 1) {
      const row = importRows[index];
      const payload = makeCustomerPayload(row);
      const res = await createCustomer(payload);
      if (res.ok) {
        const created = res.data?.data ?? res.data ?? null;
        if (created) {
          setCustomers((prev) => [formatCustomerForDisplay(created), ...prev]);
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

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredCustomers = useMemo(() => {
    let items = [...customers];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter((c) =>
        Object.values(c).some((v) => String(v ?? "").toLowerCase().includes(term)) ||
        c.displayName?.toLowerCase().includes(term)
      );
    }
    if (sortConfig) {
      items.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        if (sortConfig.key === "balance") {
          aValue = Number(aValue) || 0;
          bValue = Number(bValue) || 0;
        } else {
          aValue = (aValue ?? "").toString().toLowerCase();
          bValue = (bValue ?? "").toString().toLowerCase();
        }
        if (aValue < bValue) return sortConfig.direction === "ascending" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [customers, searchTerm, sortConfig]);

  return (
    <div className="space-y-6 p-1">
      <Card className="shadow-lg border-border dark:border-dark-border">
        <CardContent className="p-4 md:p-6">
          <div className="mb-6 flex justify-end">
            <div className="flex w-full flex-wrap items-center justify-end gap-2">
              <Input
                type="text"
                placeholder="Search customers (Name, Balance...)"
                className="mr-auto h-10 w-full sm:w-64 md:w-80"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button
                type="button"
                className="bg-primary text-primary-foreground hover:bg-primary-hover dark:bg-dark-primary dark:text-dark-primary-foreground dark:hover:bg-dark-primary-hover"
                onClick={() => toast({ title: "Search", description: `Filtering by "${searchTerm}"` })}
              >
                Search
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="text-primary dark:text-dark-primary border-primary dark:border-dark-primary hover:bg-primary/10 dark:hover:bg-dark-primary/10 shadow-sm flex items-center">
                    <FileDown size={16} className="mr-2" /> Import
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-card dark:bg-dark-card shadow-lg rounded-md border border-border dark:border-dark-border">
                  <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="text-foreground dark:text-dark-foreground hover:bg-primary/10 dark:hover:bg-dark-primary/10 cursor-pointer">
                    Bulk upload
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadCustomerTemplate} className="text-foreground dark:text-dark-foreground hover:bg-primary/10 dark:hover:bg-dark-primary/10 cursor-pointer">
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
            onChange={handleCustomerImportFile}
          />
          {isImportDialogOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 p-4 overflow-y-auto">
              <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b px-5 py-4">
                  <div>
                    <h3 className="text-xl font-semibold">Import Customers</h3>
                    <p className="text-sm text-slate-500">Upload data using the template, then review before importing.</p>
                    {selectedFileName && <p className="text-sm text-slate-500">File: {selectedFileName}</p>}
                  </div>
                  <button type="button" className="rounded-full bg-slate-100 px-3 py-1" onClick={resetCustomerImportDialog}>Close</button>
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
                            <th className="px-3 py-2">Name</th>
                            <th className="px-3 py-2">Customer Number</th>
                            <th className="px-3 py-2">Phone</th>
                            <th className="px-3 py-2">Email</th>
                          </tr>
                        </thead>
                        <tbody>
                          {importRows.slice(0, 20).map((row, index) => (
                            <tr key={index} className="border-t hover:bg-slate-50">
                              <td className="px-3 py-2 align-top">{index + 2}</td>
                              <td className="px-3 py-2 align-top">{row["Name"] || "—"}</td>
                              <td className="px-3 py-2 align-top">{row["Customer Number"] || "—"}</td>
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
                      <Button type="button" onClick={importCustomers} disabled={importing || importRows.length === 0}>
                        {importing ? "Importing..." : "Import customers"}
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
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent className="sm:max-w-[550px] bg-card dark:bg-dark-card text-foreground dark:text-dark-foreground border-border dark:border-dark-border shadow-2xl rounded-lg">
              <DialogHeader>
                <DialogTitle className="text-primary dark:text-dark-primary text-2xl font-semibold">
                  {customerToEdit ? "Edit Customer" : "Add New Customer"}
                </DialogTitle>
                <DialogDescription className="text-muted-foreground dark:text-dark-muted-foreground">
                  {customerToEdit ? "Update customer details." : "Fill in the details to add a new customer."}
                </DialogDescription>
              </DialogHeader>
              <AddCustomerForm
                onSave={handleSaveCustomer}
                onCancel={handleCloseModal}
                initialData={customerToEdit}
                isEditMode={!!customerToEdit}
              />
            </DialogContent>
          </Dialog>

          <CustomerDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedCustomerForDetails(null);
            }}
            customer={selectedCustomerForDetails}
          />

          <AlertDialog open={isConfirmDeleteModalOpen} onOpenChange={setIsConfirmDeleteModalOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the customer
                  "{customerToDelete?.name}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setIsConfirmDeleteModalOpen(false)}>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    if (!customerToDelete) return;
                    const res = await deleteCustomer(customerToDelete.id);
                    if (res.ok) {
                      toast({ title: "Customer Deleted", description: `${customerToDelete.name} deleted.` });
                      setIsConfirmDeleteModalOpen(false);
                      setCustomerToDelete(null);
                      await loadCustomers();
                    } else {
                      toast({ title: "Delete failed", description: res.statusText || "Server error", variant: "destructive" });
                    }
                  }}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Yes, delete customer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="overflow-x-auto rounded-lg border border-border dark:border-dark-border shadow-md max-h-[65vh] overflow-y-auto">
            <table className="w-full min-w-[600px] text-sm text-left text-foreground dark:text-dark-foreground">
              <thead className="sticky top-0 z-20 text-xs text-primary dark:text-dark-primary uppercase bg-muted dark:bg-dark-muted border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <SortableHeader columnKey="name" sortConfig={sortConfig} requestSort={requestSort} className="min-w-[150px]">Customer Name</SortableHeader>
                  <SortableHeader columnKey="displayName" sortConfig={sortConfig} requestSort={requestSort} className="min-w-[150px]">Display Name</SortableHeader>
                  <SortableHeader columnKey="address" sortConfig={sortConfig} requestSort={requestSort}>Address</SortableHeader>
                  <SortableHeader columnKey="phoneNumber" sortConfig={sortConfig} requestSort={requestSort}>Phone Number</SortableHeader>
                  <SortableHeader columnKey="balance" sortConfig={sortConfig} requestSort={requestSort} isTextRight={true}>Balance</SortableHeader>
                  <th scope="col" className="px-4 py-3 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedAndFilteredCustomers.map((customer) => (
                  <tr key={customer.id} className="bg-card dark:bg-dark-card border-b border-border dark:border-dark-border last:border-b-0 hover:bg-muted/30 dark:hover:bg-dark-muted/30 transition-colors duration-150">
                    <td className="px-4 py-3 font-medium text-secondary dark:text-dark-secondary">
                      <button
                        onClick={() => {
                          setSelectedCustomerForDetails(customer);
                          setIsDetailsModalOpen(true);
                        }}
                        className="text-primary dark:text-dark-primary hover:underline font-semibold cursor-pointer"
                      >
                        {customer.name}
                      </button>
                    </td>
                    <td className="px-4 py-3">{customer.displayName}</td>
                    <td className="px-4 py-3">{customer.address}</td>
                    <td className="px-4 py-3">{customer.phoneNumber}</td>
                    <td className="px-4 py-3 text-right font-semibold">{customer.balanceFormatted}</td>
                    <td className="px-4 py-3 text-center space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-secondary dark:text-dark-secondary hover:text-accent dark:hover:text-dark-accent h-8 w-8"
                        onClick={() => handleOpenModal(customer)}
                      >
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive dark:text-red-400 hover:text-destructive/80 dark:hover:text-red-300 h-8 w-8"
                        onClick={() => {
                          setCustomerToDelete(customer);
                          setIsConfirmDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
                {sortedAndFilteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-muted-foreground dark:text-dark-muted-foreground">
                      {searchTerm ? `No customers found for "${searchTerm}".` : "No customers found. Start by adding a customer!"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
