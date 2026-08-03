// =============================================
// components/vendors/VendorProfileLedger.jsx
// (Simple ledger preview with lazy fetch)
// =============================================
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { fetchVendorLedger } from "@/services/vendor";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function VendorProfileLedger({ vendorId, vendorName, onClose, onEditVendor }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchVendorLedger(vendorId);
        if (!mounted) return;
        const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
        setRows(list);
      } catch (e) {
        if (mounted) setError("Failed to load ledger");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => (mounted = false);
  }, [vendorId]);

  const total = useMemo(() => {
    const debit = rows.reduce((s, r) => s + Number(r.debit || 0), 0);
    const credit = rows.reduce((s, r) => s + Number(r.credit || 0), 0);
    return { debit, credit, balance: debit - credit };
  }, [rows]);

  if (loading) {
    return (
      <div className="p-4 space-y-2">
        <Skeleton className="h-7 w-[200px]" />
        <Skeleton className="h-[300px] w-full" />
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 p-4">{error}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-lg font-semibold">{vendorName}</div>
          <div className="text-sm text-muted-foreground">Transactions</div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => onEditVendor && onEditVendor({ id: vendorId })}>Edit</Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>

      <div className="overflow-x-auto border rounded-lg max-h-[65vh] overflow-y-auto">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="sticky top-0 z-20 text-xs uppercase bg-muted border-b border-slate-200">
            <tr>
              <th className="px-3 py-2 text-left">Date</th>
              <th className="px-3 py-2 text-left">Reference</th>
              <th className="px-3 py-2 text-left">Description</th>
              <th className="px-3 py-2 text-right">Debit</th>
              <th className="px-3 py-2 text-right">Credit</th>
              <th className="px-3 py-2 text-right">Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id || `${r.date}-${r.reference || Math.random()}`} className="border-t">
                <td className="px-3 py-2">{r.date}</td>
                <td className="px-3 py-2">{r.reference || "—"}</td>
                <td className="px-3 py-2">{r.description || "—"}</td>
                <td className="px-3 py-2 text-right">{Number(r.debit || 0).toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{Number(r.credit || 0).toLocaleString()}</td>
                <td className="px-3 py-2 text-right">{Number(r.balance || 0).toLocaleString()}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-8 text-muted-foreground">No transactions found.</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="font-semibold border-t bg-muted/30">
              <td className="px-3 py-2" colSpan={3}>Totals</td>
              <td className="px-3 py-2 text-right">{total.debit.toLocaleString()}</td>
              <td className="px-3 py-2 text-right">{total.credit.toLocaleString()}</td>
              <td className="px-3 py-2 text-right">{total.balance.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}