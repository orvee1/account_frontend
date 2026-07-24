'use client';

import React, { useEffect, useMemo, useState } from "react";
import { PlusCircle, Edit, Trash2, ArrowUpDown } from "lucide-react";
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
      // customerNumber: ❌ (server-managed)
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

      handleCloseModal();
    } else {
      toast({
        title: isEdit ? "Update failed" : "Create failed",
        description: res.statusText || "Server error",
        variant: "destructive",
      });
    }
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
                <Button variant="outline" className="text-primary dark:text-dark-primary border-primary dark:border-dark-primary hover:bg-primary/10 dark:hover:bg-dark-primary/10 shadow-sm">
                  <PlusCircle size={20} className="mr-2" /> Add Customer
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card dark:bg-dark-card shadow-lg rounded-md border border-border dark:border-dark-border">
                <DropdownMenuItem onClick={() => handleOpenModal(null)} className="text-foreground dark:text-dark-foreground hover:bg-primary/10 dark:hover:bg-dark-primary/10 cursor-pointer">
                  Add New
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    toast({ title: "Import", description: "Import from Excel coming soon." });
                  }}
                  className="text-foreground dark:text-dark-foreground hover:bg-primary/10 dark:hover:bg-dark-primary/10 cursor-pointer"
                >
                  Import from Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
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

          <div className="overflow-x-auto rounded-lg border border-border dark:border-dark-border shadow-md">
            <table className="w-full min-w-[600px] text-sm text-left text-foreground dark:text-dark-foreground">
              <thead className="text-xs text-primary dark:text-dark-primary uppercase bg-muted/50 dark:bg-dark-muted/50">
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
