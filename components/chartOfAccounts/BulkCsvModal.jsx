"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { XCircle, UploadCloud, Pencil } from "lucide-react";

export default function BulkCsvModal({ isOpen, onClose, csvAccounts, onSubmit, onDelete }) {
  const handleConfirmUpload = () => {
    onSubmit(csvAccounts);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl bg-white dark:bg-slate-600 dark:text-white">
        <DialogHeader>
          <DialogTitle>CSV Account Upload Preview</DialogTitle>
        </DialogHeader>

        {csvAccounts.length > 0 ? (
          <div className="overflow-auto max-h-[500px] border rounded">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Account Name</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Account Number</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Account Type</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Account Subtype</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Opening Balance</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Opening Balance Date</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Sub-Account Of</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {csvAccounts.map((acc, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2">{acc.account_name}</td>
                    <td className="px-4 py-2">{acc.account_no}</td>
                    <td className="px-4 py-2">{acc.account_type}</td>
                    <td className="px-4 py-2">{acc.detail_type}</td>
                    <td className="px-4 py-2">{acc.opening_balance}</td>
                    <td className="px-4 py-2">{acc.opening_date}</td>
                    <td className="px-4 py-2">{acc.parent_account_id || "None"}</td>
                    <td className="px-4 py-2">
                        <Button variant="ghost" size="icon" onClick={() => onDelete(index)}>
                            <XCircle size={16} className="text-red-600" />
                        </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-8 text-muted-foreground">
            No data parsed from the CSV.
          </p>
        )}

        <DialogFooter className="pt-6">
          <Button variant="outline" onClick={onClose} className="text-red-600">
            <XCircle size={18} className="mr-2" /> Cancel
          </Button>
          <Button
            onClick={handleConfirmUpload}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <UploadCloud size={18} className="mr-2" /> Confirm & Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
