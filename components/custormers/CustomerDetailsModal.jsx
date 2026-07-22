// components/custormers/CustomerDetailsModal.jsx
"use client";
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, CalendarRange } from "lucide-react";
import { getAccountLedger } from "@/services/chartAccounts";
import { useAuth } from "@/contexts/AuthContext";

export default function CustomerDetailsModal({ isOpen, onClose, customer }) {
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
        if (!isOpen || !customer?.id || !companyId || !startDate || !endDate) return;
        loadLedgerData();
    }, [isOpen, customer?.id, companyId, startDate, endDate]);

    const loadLedgerData = async () => {
        try {
            setLoading(true);

            // Try to get customer's account from chart of accounts
            // For now, we'll use customer_id as account_id placeholder
            // In a real scenario, customers should have linked accounts in the database
            const response = await getAccountLedger(companyId, customer.id, {
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
                    id: customer.id,
                    code: `CUST-${customer.id}`,
                    name: customer.name,
                    type: "receivable",
                },
                period: {
                    start_date: startDate,
                    end_date: endDate,
                },
                balances: {
                    opening_balance: 0,
                    closing_balance: customer.balance || 0,
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
            <DialogContent className="sm:max-w-[900px] bg-card dark:bg-dark-card text-foreground dark:text-dark-foreground border-border dark:border-dark-border max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-bold text-primary dark:text-dark-primary">
                                {customer?.name}
                            </DialogTitle>
                            <DialogDescription className="text-muted-foreground dark:text-dark-muted-foreground mt-1">
                                Customer Account & Transaction Details
                            </DialogDescription>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Customer Info */}
                    <Card className="bg-muted/30 dark:bg-dark-muted/30 border-border dark:border-dark-border">
                        <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground dark:text-dark-muted-foreground uppercase">Display Name</p>
                                <p className="font-semibold">{customer?.displayName || customer?.name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground dark:text-dark-muted-foreground uppercase">Phone</p>
                                <p className="font-semibold">{customer?.phoneNumber || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground dark:text-dark-muted-foreground uppercase">Email</p>
                                <p className="font-semibold text-sm">{customer?.email || "N/A"}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground dark:text-dark-muted-foreground uppercase">Address</p>
                                <p className="font-semibold text-sm">{customer?.address || "N/A"}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Date Range Filter */}
                    <div className="flex flex-wrap gap-3 items-end bg-muted/20 dark:bg-dark-muted/20 p-4 rounded-lg border border-border dark:border-dark-border">
                        <div className="flex-1 min-w-[150px]">
                            <label className="text-xs text-muted-foreground dark:text-dark-muted-foreground uppercase font-semibold">
                                From Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-input dark:border-dark-input rounded-md bg-background dark:bg-dark-background text-foreground dark:text-dark-foreground mt-1"
                            />
                        </div>
                        <div className="flex-1 min-w-[150px]">
                            <label className="text-xs text-muted-foreground dark:text-dark-muted-foreground uppercase font-semibold">
                                To Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-input dark:border-dark-input rounded-md bg-background dark:bg-dark-background text-foreground dark:text-dark-foreground mt-1"
                            />
                        </div>
                        <Button
                            onClick={loadLedgerData}
                            disabled={loading}
                            className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            <CalendarRange size={18} className="mr-2" /> Load
                        </Button>
                    </div>

                    {/* Balance Summary */}
                    {ledgerData && (
                        <Card className="bg-primary/5 dark:bg-dark-primary/5 border-primary/20 dark:border-dark-primary/20">
                            <CardContent className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground dark:text-dark-muted-foreground uppercase">Opening Balance</p>
                                    <p className="text-lg font-bold text-primary dark:text-dark-primary">
                                        {(ledgerData.balances?.opening_balance || 0).toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground dark:text-dark-muted-foreground uppercase">Total Debit</p>
                                    <p className="text-lg font-bold text-destructive">
                                        {(ledgerData.balances?.total_debit || 0).toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground dark:text-dark-muted-foreground uppercase">Total Credit</p>
                                    <p className="text-lg font-bold text-green-600">
                                        {(ledgerData.balances?.total_credit || 0).toFixed(2)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground dark:text-dark-muted-foreground uppercase">Closing Balance</p>
                                    <p className="text-lg font-bold text-accent dark:text-dark-accent">
                                        {(ledgerData.balances?.closing_balance || 0).toFixed(2)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Transactions Table */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3 text-foreground dark:text-dark-foreground">
                            Transactions ({ledgerData?.transactions?.length || 0})
                        </h3>
                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground dark:text-dark-muted-foreground">
                                Loading transactions...
                            </div>
                        ) : ledgerData?.transactions && ledgerData.transactions.length > 0 ? (
                            <div className="overflow-x-auto rounded-lg border border-border dark:border-dark-border">
                                <table className="w-full min-w-[800px] text-sm text-left text-foreground dark:text-dark-foreground">
                                    <thead className="text-xs text-primary dark:text-dark-primary uppercase bg-muted/50 dark:bg-dark-muted/50">
                                        <tr>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Description</th>
                                            <th className="px-4 py-3 text-right">Debit</th>
                                            <th className="px-4 py-3 text-right">Credit</th>
                                            <th className="px-4 py-3 text-right">Balance</th>
                                            <th className="px-4 py-3">Reference</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ledgerData.transactions.map((tx, idx) => (
                                            <tr
                                                key={idx}
                                                className="bg-card dark:bg-dark-card border-b border-border dark:border-dark-border last:border-b-0 hover:bg-muted/30 dark:hover:bg-dark-muted/30 transition-colors"
                                            >
                                                <td className="px-4 py-3 font-medium">{tx.date}</td>
                                                <td className="px-4 py-3">{tx.description}</td>
                                                <td className="px-4 py-3 text-right font-semibold text-destructive">
                                                    {tx.debit && Number(tx.debit) > 0 ? Number(tx.debit).toFixed(2) : "-"}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-green-600">
                                                    {tx.credit && Number(tx.credit) > 0 ? Number(tx.credit).toFixed(2) : "-"}
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-accent dark:text-dark-accent">
                                                    {Number(tx.balance).toFixed(2)}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-muted-foreground dark:text-dark-muted-foreground">
                                                    {tx.reference_id || tx.reference_type || "N/A"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground dark:text-dark-muted-foreground border border-border dark:border-dark-border rounded-lg">
                                No transactions found for the selected date range.
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border dark:border-dark-border">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
