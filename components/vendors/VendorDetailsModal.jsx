// components/vendors/VendorDetailsModal.jsx
"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, CalendarRange } from "lucide-react";
import { getAccountLedger } from "@/services/chartAccounts";
import { useAuth } from "@/contexts/AuthContext";

export default function VendorDetailsModal({ isOpen, onClose, vendor }) {
    const { user } = useAuth();
    const companyId = user?.company?.id;

    const [loading, setLoading] = useState(false);
    const [ledgerData, setLedgerData] = useState(null);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Set default dates (last 7 days)
    useEffect(() => {
        if (isOpen) {
            const today = new Date();
            const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

            setEndDate(today.toISOString().split("T")[0]);
            setStartDate(sevenDaysAgo.toISOString().split("T")[0]);
        }
    }, [isOpen]);

    // Load ledger data
    useEffect(() => {
        if (!isOpen || !vendor?.id || !companyId || !startDate || !endDate) return;
        loadLedgerData();
    }, [isOpen, vendor?.id, companyId, startDate, endDate]);

    const loadLedgerData = async () => {
        try {
            setLoading(true);

            const response = await getAccountLedger(companyId, vendor.id, {
                start_date: startDate,
                end_date: endDate,
            });

            if (response.success) {
                setLedgerData(response);
            } else {
                console.error("Failed to load ledger:", response);
            }
        } catch (error) {
            console.error("Error loading ledger:", error);
            // Show sample data if API fails
            setLedgerData({
                success: true,
                account: {
                    id: vendor.id,
                    code: `VEND-${vendor.id}`,
                    name: vendor.name,
                    type: "payable",
                },
                period: {
                    start_date: startDate,
                    end_date: endDate,
                },
                balances: {
                    opening_balance: 0,
                    closing_balance: vendor.balance || 0,
                    total_debit: 0,
                    total_credit: 0,
                },
                transactions: [],
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[1000px] bg-card dark:bg-dark-card text-foreground dark:text-dark-foreground border-border dark:border-dark-border max-h-[90vh] overflow-y-auto p-4 md:p-5">
                {/* Header: Title + Contact/Address */}
                <DialogHeader className="p-0 border-b border-border dark:border-dark-border pb-3">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-lg font-bold text-primary dark:text-dark-primary flex items-center gap-2">
                            Vendor Statement: {vendor?.name}
                        </DialogTitle>
                    </div>
                    {/* Simple Contact/Address Info */}
                    <div className="text-xs text-muted-foreground dark:text-dark-muted-foreground mt-2">
                        <span className="font-semibold text-foreground dark:text-dark-foreground">Phone:</span> {vendor?.phoneNumber || "N/A"}
                        <span className="mx-2">|</span>
                        <span className="font-semibold text-foreground dark:text-dark-foreground">Email:</span> {vendor?.email || "N/A"}
                        <span className="mx-2">|</span>
                        <span className="font-semibold text-foreground dark:text-dark-foreground">Address:</span> {vendor?.address || "N/A"}
                    </div>
                    <DialogDescription className="sr-only">
                        Vendor Account & Transaction Details
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 mt-3">
                    {/* 3rd Row: Vendor No. (left side), Date Range (right side) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/10 dark:bg-dark-muted/10 p-2 rounded-md border border-border dark:border-dark-border text-xs">
                        {/* Left Side: Vendor No. */}
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-muted-foreground dark:text-dark-muted-foreground uppercase">Vendor No:</span>
                            <span className="font-mono bg-muted/60 dark:bg-dark-muted/60 px-2 py-0.5 rounded text-foreground dark:text-dark-foreground font-bold">
                                {vendor?.vendorNumber || vendor?.customerNumber || vendor?.vendor_no || vendor?.code || `VEND-${vendor?.id}`}
                            </span>
                        </div>

                        {/* Right Side: Date Range */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                                <span className="text-muted-foreground dark:text-dark-muted-foreground uppercase font-semibold">From:</span>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="px-2 py-1 border border-input dark:border-dark-input rounded bg-background dark:bg-dark-background text-foreground dark:text-dark-foreground font-medium text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-muted-foreground dark:text-dark-muted-foreground uppercase font-semibold">To:</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="px-2 py-1 border border-input dark:border-dark-input rounded bg-background dark:bg-dark-background text-foreground dark:text-dark-foreground font-medium text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <Button
                                onClick={loadLedgerData}
                                disabled={loading}
                                size="sm"
                                className="h-7 px-2.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold flex items-center gap-1"
                            >
                                <CalendarRange size={13} /> Load
                            </Button>
                        </div>
                    </div>

                    {/* 4th Row: Balance Summary (Optional, rendered when data exists) */}
                    {ledgerData && (
                        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-1.5 px-3 bg-primary/5 dark:bg-dark-primary/5 border border-primary/20 dark:border-dark-primary/20 rounded-md text-xs">
                            <div className="flex items-center gap-4 flex-wrap">
                                <div>
                                    <span className="text-muted-foreground dark:text-dark-muted-foreground uppercase font-semibold mr-1">Opening:</span>
                                    <span className="font-bold text-primary dark:text-dark-primary">
                                        {(ledgerData.balances?.opening_balance || 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="h-3 w-px bg-primary/20 dark:bg-dark-primary/20 hidden sm:block"></div>
                                <div>
                                    <span className="text-muted-foreground dark:text-dark-muted-foreground uppercase font-semibold mr-1">Total Debit:</span>
                                    <span className="font-bold text-destructive">
                                        {(ledgerData.balances?.total_debit || 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="h-3 w-px bg-primary/20 dark:bg-dark-primary/20 hidden sm:block"></div>
                                <div>
                                    <span className="text-muted-foreground dark:text-dark-muted-foreground uppercase font-semibold mr-1">Total Credit:</span>
                                    <span className="font-bold text-green-600">
                                        {(ledgerData.balances?.total_credit || 0).toFixed(2)}
                                    </span>
                                </div>
                                <div className="h-3 w-px bg-primary/20 dark:bg-dark-primary/20 hidden sm:block"></div>
                                <div>
                                    <span className="text-muted-foreground dark:text-dark-muted-foreground uppercase font-semibold mr-1">Closing:</span>
                                    <span className="font-bold text-accent dark:text-dark-accent">
                                        {(ledgerData.balances?.closing_balance || 0).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                            <div className="font-semibold text-muted-foreground dark:text-dark-muted-foreground">
                                Count: <span className="text-foreground dark:text-dark-foreground font-bold">{ledgerData?.transactions?.length || 0}</span>
                            </div>
                        </div>
                    )}

                    {/* 5th Row: Transactions Table */}
                    <div className="mt-2">
                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground dark:text-dark-muted-foreground text-xs">
                                Loading transactions...
                            </div>
                        ) : ledgerData?.transactions && ledgerData.transactions.length > 0 ? (
                            <div className="overflow-x-auto rounded-lg border border-border dark:border-dark-border max-h-[45vh] overflow-y-auto">
                                <table className="w-full min-w-[800px] text-xs text-left text-foreground dark:text-dark-foreground border-collapse">
                                    <thead className="sticky top-0 text-primary dark:text-dark-primary uppercase bg-muted dark:bg-dark-muted font-bold border-b border-border dark:border-dark-border">
                                        <tr>
                                            <th className="px-3 py-2 text-center w-12">SL</th>
                                            <th className="px-3 py-2 w-24">Date</th>
                                            <th className="px-3 py-2">Particular</th>
                                            <th className="px-3 py-2">Voucher Type</th>
                                            <th className="px-3 py-2 text-right w-28">Debit</th>
                                            <th className="px-3 py-2 text-right w-28">Credit</th>
                                            <th className="px-3 py-2 text-right w-28">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border dark:divide-dark-border">
                                        {ledgerData.transactions.map((tx, idx) => (
                                            <tr
                                                key={idx}
                                                className="bg-card dark:bg-dark-card hover:bg-muted/30 dark:hover:bg-dark-muted/30 transition-colors"
                                            >
                                                <td className="px-3 py-1.5 text-center font-medium text-muted-foreground dark:text-dark-muted-foreground border-r border-border/50 dark:border-dark-border/50">
                                                    {idx + 1}
                                                </td>
                                                <td className="px-3 py-1.5 font-medium whitespace-nowrap">
                                                    {tx.date}
                                                </td>
                                                <td className="px-3 py-1.5 max-w-xs truncate" title={tx.description}>
                                                    {tx.description}
                                                </td>
                                                <td className="px-3 py-1.5 whitespace-nowrap">
                                                    {tx.reference_type ? (
                                                        <span className="inline-flex items-center gap-1 font-semibold text-muted-foreground dark:text-dark-muted-foreground">
                                                            {tx.reference_type}
                                                            {tx.reference_id && (
                                                                <span className="font-mono text-[10px] bg-muted/80 dark:bg-dark-muted/80 px-1 py-0.5 rounded text-foreground dark:text-dark-foreground">
                                                                    #{tx.reference_id}
                                                                </span>
                                                            )}
                                                        </span>
                                                    ) : (
                                                        tx.voucher_type || "N/A"
                                                    )}
                                                </td>
                                                <td className="px-3 py-1.5 text-right font-semibold text-destructive">
                                                    {tx.debit && Number(tx.debit) > 0 ? Number(tx.debit).toFixed(2) : "-"}
                                                </td>
                                                <td className="px-3 py-1.5 text-right font-semibold text-green-600">
                                                    {tx.credit && Number(tx.credit) > 0 ? Number(tx.credit).toFixed(2) : "-"}
                                                </td>
                                                <td className="px-3 py-1.5 text-right font-semibold text-accent dark:text-dark-accent">
                                                    {Number(tx.balance).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground dark:text-dark-muted-foreground border border-border dark:border-dark-border rounded-lg text-xs">
                                No transactions found for the selected date range.
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-border dark:border-dark-border">
                    <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs px-4">
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
