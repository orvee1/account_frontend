// components/reports/ReconcilePage.jsx
"use client";

import { toDateInput } from "@/utils/accounting-date.mjs";
import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { getTransactionsForReconciliation, submitReconciliation } from "@/services/chartAccounts";

export default function ReconcilePage({
  companyId,
  accountId,
  account,
  setShowReconcilePage,
}) {
  const today = toDateInput();

  const [endDate, setEndDate] = useState(today);
  const [transactions, setTransactions] = useState([]);
  const [selectedTx, setSelectedTx] = useState([]); // These are "Cleared" transactions
  const [endingBalance, setEndingBalance] = useState(0);
  const [balances, setBalances] = useState({ beginning_balance: 0, book_balance: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Load transactions when end date changes
  useEffect(() => {
    loadTransactions();
  }, [endDate, companyId, accountId]);

  const loadTransactions = async () => {
    if (!companyId || !accountId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await getTransactionsForReconciliation(companyId, accountId, {
        end_date: endDate,
      });

      if (response.success) {
        setTransactions(response.transactions || []);
        setBalances(response.balances || { beginning_balance: 0, book_balance: 0 });
        setSelectedTx([]); // Reset selection when date changes
      } else {
        setError("Failed to load transactions");
      }
    } catch (err) {
      setError(err.message || "Error loading transactions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Logic from instructions:
  // Adjusted Bank Balance = Statement Ending Balance + Deposits in Transit - Outstanding Checks
  // Deposits in Transit = Unreconciled (Unchecked) Debits
  // Outstanding Checks = Unreconciled (Unchecked) Credits
  
  const depositsInTransit = useMemo(() => {
    return transactions
      .filter((tx) => !selectedTx.includes(tx.id))
      .reduce((sum, tx) => sum + (tx.debit || 0), 0);
  }, [transactions, selectedTx]);

  const outstandingChecks = useMemo(() => {
    return transactions
      .filter((tx) => !selectedTx.includes(tx.id))
      .reduce((sum, tx) => sum + (tx.credit || 0), 0);
  }, [transactions, selectedTx]);

  const adjustedBankBalance = Number(endingBalance) + depositsInTransit - outstandingChecks;
  const bookBalance = balances.book_balance;
  const difference = adjustedBankBalance - bookBalance;

  // Additional cleared info for summary
  const clearedDeposits = transactions
    .filter((tx) => selectedTx.includes(tx.id))
    .reduce((sum, tx) => sum + (tx.debit || 0), 0);

  const clearedPayments = transactions
    .filter((tx) => selectedTx.includes(tx.id))
    .reduce((sum, tx) => sum + (tx.credit || 0), 0);

  const clearedBalance = Number(balances.beginning_balance) + clearedDeposits - clearedPayments;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedTx(transactions.map((tx) => tx.id));
    } else {
      setSelectedTx([]);
    }
  };

  const handleFinishReconciliation = async () => {
    if (Math.abs(difference) > 0.001) {
      setError("Difference must be 0 to complete reconciliation");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        beginning_balance: balances.beginning_balance,
        ending_balance: Number(endingBalance),
        cleared_deposits: clearedDeposits,
        cleared_payments: clearedPayments,
        difference: difference,
        cleared_transactions: selectedTx,
        reconciliation_date: endDate,
        notes: `Reconciliation for ${account?.name || 'Account'} as of ${endDate}`,
      };

      const response = await submitReconciliation(companyId, accountId, payload);

      if (response.success) {
        alert("Reconciliation completed successfully!");
        setShowReconcilePage(false);
      } else {
        setError(response.message || "Failed to save reconciliation");
      }
    } catch (err) {
      setError(err.message || "Error saving reconciliation");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground">Fetching unreconciled transactions...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => setShowReconcilePage(false)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h2 className="text-xl font-bold flex items-center">
            Bank Reconciliation: <span className="text-primary ml-2">{account?.name}</span>
          </h2>
        </div>
        <div className="flex items-center space-x-2 bg-muted p-1 rounded-md">
          <label className="text-xs font-medium px-2">Statement Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-background border-none text-sm px-2 py-1 rounded-sm focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2 rounded-md flex items-center text-sm">
          <AlertCircle className="h-4 w-4 mr-2" /> {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
        {/* Left Panel: Summary Logic */}
        <div className="lg:col-span-4 space-y-4 overflow-y-auto pr-2">
          <div className="bg-card border rounded-lg shadow-sm p-4 space-y-4">
            <h3 className="font-semibold border-b pb-2 flex items-center">
              <Info className="h-4 w-4 mr-2 text-primary" />
              Reconciliation Summary
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Statement Ending Balance</span>
                <div className="relative w-32">
                  <span className="absolute left-2 top-1.5 text-xs text-muted-foreground">$</span>
                  <input
                    type="number"
                    value={endingBalance}
                    onChange={(e) => setEndingBalance(e.target.value)}
                    className="w-full text-right pr-2 pl-6 py-1 border rounded font-semibold focus:ring-1 focus:ring-primary"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span>Add: Deposits in Transit</span>
                <span className="font-medium text-green-600">
                  + {depositsInTransit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span>Less: Outstanding Checks</span>
                <span className="font-medium text-red-600">
                  - {outstandingChecks.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="pt-2 border-t flex justify-between items-center font-bold">
                <span>Adjusted Bank Balance</span>
                <span>{adjustedBankBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between items-center text-sm text-muted-foreground italic">
                <span>Book Balance (as of {endDate})</span>
                <span>{bookBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>

              <div className={`mt-4 p-3 rounded-md flex flex-col items-center justify-center border-2 ${Math.abs(difference) < 0.001 ? "bg-green-50 border-green-200 text-green-700" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
                <span className="text-xs uppercase font-bold tracking-wider">Difference</span>
                <span className="text-2xl font-black">
                  {difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                {Math.abs(difference) < 0.001 && (
                  <div className="flex items-center mt-1 text-xs font-semibold">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Ready to Finalize
                  </div>
                )}
              </div>
            </div>

            <Button
              className="w-full mt-4"
              disabled={Math.abs(difference) > 0.001 || submitting}
              onClick={handleFinishReconciliation}
            >
              {submitting ? "Finalizing..." : "Finalize Reconciliation"}
            </Button>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 border border-dashed">
             <h4 className="text-xs font-bold uppercase text-muted-foreground mb-2">Technical Info</h4>
             <div className="grid grid-cols-2 gap-2 text-xs">
                <span className="text-muted-foreground">Cleared Balance:</span>
                <span className="text-right font-mono">{clearedBalance.toFixed(2)}</span>
                <span className="text-muted-foreground">Beg. Balance:</span>
                <span className="text-right font-mono">{Number(balances.beginning_balance).toFixed(2)}</span>
                <span className="text-muted-foreground">Items Selected:</span>
                <span className="text-right font-mono">{selectedTx.length} of {transactions.length}</span>
             </div>
          </div>
        </div>

        {/* Right Panel: Transaction List */}
        <div className="lg:col-span-8 bg-card border rounded-lg shadow-sm flex flex-col overflow-hidden">
          <div className="p-4 border-b bg-muted/20 flex justify-between items-center">
            <h3 className="font-semibold">Unreconciled Transactions</h3>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="select-all"
                checked={selectedTx.length === transactions.length && transactions.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <label htmlFor="select-all" className="text-sm cursor-pointer select-none">
                Select All
              </label>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted sticky top-0 border-b border-slate-200">
                <tr>
                  <th className="w-12 px-4 py-2"></th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2 text-right">Debit</th>
                  <th className="px-4 py-2 text-right">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-12 text-center text-muted-foreground">
                      No unreconciled transactions found up to {endDate}.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr 
                      key={tx.id} 
                      className={`hover:bg-muted/30 transition-colors cursor-pointer ${selectedTx.includes(tx.id) ? "bg-primary/5" : ""}`}
                      onClick={() => {
                        if (selectedTx.includes(tx.id)) {
                          setSelectedTx(selectedTx.filter((id) => id !== tx.id));
                        } else {
                          setSelectedTx([...selectedTx, tx.id]);
                        }
                      }}
                    >
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedTx.includes(tx.id)}
                          onChange={() => {}} // Handled by row click
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{tx.date}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{tx.description}</div>
                        {tx.memo && <div className="text-xs text-muted-foreground">{tx.memo}</div>}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-green-600">
                        {tx.debit > 0 ? tx.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-red-600">
                        {tx.credit > 0 ? tx.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-3 bg-muted/10 border-t flex justify-between text-xs font-medium">
             <span>Total Unreconciled: {transactions.length} items</span>
             <div className="space-x-4">
                <span className="text-green-600">Total Debit: {transactions.reduce((s, t) => s + (t.debit || 0), 0).toFixed(2)}</span>
                <span className="text-red-600">Total Credit: {transactions.reduce((s, t) => s + (t.credit || 0), 0).toFixed(2)}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
