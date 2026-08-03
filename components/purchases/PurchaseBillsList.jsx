"use client";

import SortableHeader from "@/components/SortableHeader";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { deletePurchaseBill } from "@/services/purchase";
import { Edit, Eye, PlusCircle, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function PurchaseBillsList({ initialBills = [] }) {
  const router = useRouter();
  const { toast } = useToast();

  // Normalize initial data
  const starting = Array.isArray(initialBills?.data)
    ? initialBills.data
    : Array.isArray(initialBills)
    ? initialBills
    : [];

  const [bills, setBills] = useState(starting);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "bill_date", direction: "descending" });
  
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState(null);

  // Search/Sort
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  
  const requestSort = (columnKey) => {
    let direction = "ascending";
    if (sortConfig && sortConfig.key === columnKey && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key: columnKey, direction });
  };

  const sortedAndFilteredBills = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let rows = [...bills];

    if (term) {
      rows = rows.filter((b) => {
        const hay = [
          b.bill_no,
          b.vendor?.name || "",
          b.notes || "",
          String(b.total_amount ?? ""),
        ]
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
        const numeric = new Set(["total_amount", "tax_amount", "id"]);
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
  }, [bills, searchTerm, sortConfig]);

  // Delete
  const handleDeleteBill = (bill) => {
    setBillToDelete(bill);
    setIsConfirmDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (!billToDelete) return;
      const res = await deletePurchaseBill(billToDelete.id);
      if (!res?.ok) {
        toast({
          title: "Delete failed",
          description: res?.statusText || "error",
          variant: "destructive",
        });
        return;
      }
      setBills((prev) => prev.filter((b) => String(b.id) !== String(billToDelete.id)));
      toast({
        title: "Deleted",
        description: `Bill ${billToDelete.bill_no} removed.`,
      });
    } finally {
      setIsConfirmDeleteModalOpen(false);
      setBillToDelete(null);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-end">
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <Input
            type="text"
            placeholder="Search bills (Bill No, Vendor, Notes...)"
            className="mr-auto h-10 w-full sm:w-64 md:w-80"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          <Button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() =>
              toast({
                title: "Search Updated",
                description: `Displaying results for "${searchTerm}"`,
              })
            }
          >
            Search
          </Button>
          <Button
            variant="outline"
            className="text-primary dark:text-dark-primary border-primary dark:border-dark-primary hover:bg-orange-500/10 shadow-sm"
            onClick={() => router.push("/purchases/new")}
          >
            <PlusCircle size={20} className="mr-2" /> New Purchase Bill
          </Button>
        </div>
      </div>

      {/* List Table */}
      <div className="overflow-x-auto rounded-lg border border-border dark:border-dark-border shadow-md max-h-[65vh] overflow-y-auto">
        <table className="w-full min-w-[900px] text-sm text-left text-foreground dark:text-dark-foreground">
          <thead className="sticky top-0 z-20 text-xs text-primary dark:text-dark-primary uppercase bg-muted dark:bg-dark-muted border-b border-slate-200 dark:border-slate-700">
            <tr>
              <SortableHeader
                columnKey="id"
                sortConfig={sortConfig}
                requestSort={requestSort}
                className="min-w-[80px]"
              >
                ID
              </SortableHeader>
              <SortableHeader
                columnKey="bill_no"
                sortConfig={sortConfig}
                requestSort={requestSort}
                className="min-w-[120px]"
              >
                Bill No
              </SortableHeader>
              <SortableHeader
                columnKey="vendor"
                sortConfig={sortConfig}
                requestSort={requestSort}
                className="min-w-[150px]"
              >
                Vendor
              </SortableHeader>
              <SortableHeader
                columnKey="bill_date"
                sortConfig={sortConfig}
                requestSort={requestSort}
              >
                Bill Date
              </SortableHeader>
              <SortableHeader
                columnKey="due_date"
                sortConfig={sortConfig}
                requestSort={requestSort}
              >
                Due Date
              </SortableHeader>
              <SortableHeader
                columnKey="total_amount"
                sortConfig={sortConfig}
                requestSort={requestSort}
                isTextRight={true}
              >
                Total Amount
              </SortableHeader>
              <th scope="col" className="px-4 py-3 text-center w-32">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedAndFilteredBills.map((bill) => (
              <tr
                key={bill.id}
                className="bg-card dark:bg-dark-card border-b border-border dark:border-dark-border last:border-b-0 hover:bg-muted/30 dark:hover:bg-dark-muted/30 transition-colors duration-150"
              >
                <td className="px-4 py-3">{bill.id}</td>
                <td className="px-4 py-3 font-medium text-secondary dark:text-dark-secondary">
                  {bill.bill_no}
                </td>
                <td className="px-4 py-3">{bill.vendor?.name || "-"}</td>
                <td className="px-4 py-3">{formatDate(bill.bill_date)}</td>
                <td className="px-4 py-3">{formatDate(bill.due_date)}</td>
                <td className="px-4 py-3 text-right font-semibold">
                  {formatCurrency(bill.total_amount)}
                </td>
                <td className="px-4 py-3 text-center space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 hover:bg-blue-50 dark:hover:text-blue-300 dark:hover:bg-blue-950/30 h-8 w-8 transition-colors"
                    onClick={() => router.push(`/purchases/${bill.id}`)}
                    title="View Details"
                  >
                    <Eye size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-orange-600 dark:text-orange-400 hover:text-orange-800 hover:bg-orange-50 dark:hover:text-orange-300 dark:hover:bg-orange-950/30 h-8 w-8 transition-colors"
                    onClick={() => router.push(`/purchases/${bill.id}/edit`)}
                    title="Edit"
                  >
                    <Edit size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-600 dark:text-red-400 hover:text-red-800 hover:bg-red-50 dark:hover:text-red-300 dark:hover:bg-red-950/30 h-8 w-8 transition-colors"
                    onClick={() => handleDeleteBill(bill)}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </Button>
                </td>
              </tr>
            ))}
            {sortedAndFilteredBills.length === 0 && (
              <tr>
                <td
                  colSpan="7"
                  className="text-center py-10 text-muted-foreground dark:text-dark-muted-foreground"
                >
                  {searchTerm
                    ? `No bills found for "${searchTerm}".`
                    : "No purchase bills found. Create your first bill!"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Confirm Delete */}
      <AlertDialog
        open={isConfirmDeleteModalOpen}
        onOpenChange={setIsConfirmDeleteModalOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              purchase bill "{billToDelete?.bill_no}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setIsConfirmDeleteModalOpen(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Yes, delete bill
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
