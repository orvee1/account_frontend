// app/chart-of-accounts/[id]/reconcile/page.jsx
"use client";
import { Button } from "@/components/ui/button";
import { notFound, useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { getTransactionsForReconciliation, submitReconciliation } from "@/services/chartAccounts";
import { useAuth } from "@/contexts/AuthContext";

export default function ReconcilePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const companyId = user?.company?.id;
  const accountId = params.id;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [endingBalance, setEndingBalance] = useState(0);
  const [selectedTx, setSelectedTx] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Load transactions on mount
  useEffect(() => {
    if (!companyId || !accountId) return;
    loadTransactions();
  }, [companyId, accountId, startDate, endDate]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await getTransactionsForReconciliation(companyId, accountId, params);

      if (response.success) {
        setAccount(response.account);
        setTransactions(response.transactions || []);
        // Initialize dates if not set
        if (!startDate) setStartDate(response.period.start_date);
        if (!endDate) setEndDate(response.period.end_date);
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

  if (!companyId) return notFound();
  if (loading) return <div className="p-4">Loading...</div>;
  if (!account) return notFound();

  // Calculate balances
  const beginningBalance = transactions.length > 0 ? transactions[0].balance : 0;
  const clearedPayments = transactions
    .filter((tx, idx) => selectedTx.includes(tx.id))
    .reduce((sum, tx) => sum + tx.debit, 0);

  const clearedDeposits = transactions
    .filter((tx, idx) => selectedTx.includes(tx.id))
    .reduce((sum, tx) => sum + tx.credit, 0);

  const clearedBalance = beginningBalance - clearedPayments + clearedDeposits;
  const difference = Number(endingBalance) - clearedBalance;

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedTx(transactions.map((tx) => tx.id));
    } else {
      setSelectedTx([]);
    }
  };

  const handleFinishReconciliation = async () => {
    if (difference !== 0) {
      setError("Difference must be 0 to complete reconciliation");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        beginning_balance: beginningBalance,
        ending_balance: Number(endingBalance),
        cleared_deposits: clearedDeposits,
        cleared_payments: clearedPayments,
        difference: difference,
        cleared_transactions: selectedTx,
        reconciliation_date: endDate,
        notes: `Reconciliation for ${account.name}`,
      };

      const response = await submitReconciliation(companyId, accountId, payload);

      if (response.success) {
        alert("Reconciliation completed successfully!");
        router.push(`/chart-of-accounts/${accountId}`);
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

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="space-y-4 p-2">
        <div className="flex items-center justify-between mb-2">
          <Button variant="outline" onClick={() => router.back()}>
            Back
          </Button>
          <h2 className="text-xl font-bold">Reconcile {account.name}</h2>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Top Summary Section */}
        <div className="grid grid-cols-8 gap-[2px] mb-2 items-center">
          <div className="col-span-2 p-2 border border-orange-400 bg-orange-600/20 rounded-md">
            <div className="text-sm">Ending Balance</div>
            <input
              type="number"
              value={endingBalance}
              onChange={(e) => setEndingBalance(e.target.value)}
              className="w-full border rounded px-2 py-1 text-lg font-bold"
              step="0.01"
            />
          </div>
          <div className="col-span-1 flex justify-center">-</div>
          <div className="col-span-2 p-2 border border-green-400 bg-green-600/20 rounded-md">
            <div className="text-sm">Cleared Balance</div>
            <p className="text-lg font-bold">{clearedBalance.toFixed(2)}</p>
          </div>
          <div className="col-span-1 flex justify-center">=</div>
          <div className="col-span-2 p-2 border border-indigo-400 bg-indigo-600/20 rounded-md">
            <div className="text-sm">Difference</div>
            <p className={`text-lg font-bold ${difference === 0 ? "text-green-600" : "text-red-600"}`}>
              {difference.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="bg-card p-2 rounded shadow-sm">
          <div className="flex flex-wrap gap-2 mb-2 items-center bg-muted/30 p-2 rounded">
            <div className="flex flex-col min-w-[120px]">
              <label className="block text-xs text-muted-foreground mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 border rounded"
              />
            </div>
            <div className="flex flex-col min-w-[120px]">
              <label className="block text-xs text-muted-foreground mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 border rounded"
              />
            </div>
          </div>

          <h3 className="text-base font-semibold mb-2">Unreconciled Transactions</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedTx.length === transactions.length && transactions.length > 0}
                      onChange={handleSelectAll}
                      title="Select all"
                    />
                  </th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Description</th>
                  <th className="p-2 text-right">Debit</th>
                  <th className="p-2 text-right">Credit</th>
                  <th className="p-2 text-right">Balance</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-muted-foreground">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="border-t">
                      <td className="p-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedTx.includes(tx.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTx([...selectedTx, tx.id]);
                            } else {
                              setSelectedTx(selectedTx.filter((id) => id !== tx.id));
                            }
                          }}
                        />
                      </td>
                      <td className="p-2">{tx.date}</td>
                      <td className="p-2">{tx.description}</td>
                      <td className="p-2 text-right">{tx.debit.toFixed(2)}</td>
                      <td className="p-2 text-right">{tx.credit.toFixed(2)}</td>
                      <td className="p-2 text-right">{tx.balance.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              variant="primary"
              disabled={difference !== 0 || submitting}
              onClick={handleFinishReconciliation}
              className="flex-1"
            >
              {submitting ? "Saving..." : "Finish Reconciliation"}
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
