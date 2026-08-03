import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ReconcilePage from "./ReconcilePage";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const AccountLedger = ({ account, ledgerData, startDate, endDate, setStartDate, setEndDate, refreshData }) => {
  const { user } = useAuth();
  const companyId = user?.company?.id;

  const [showReconcile, setShowReconcile] = useState(false);
  const [endingBalance, setEndingBalance] = useState("");
  const [statementEndingDate, setStatementEndingDate] = useState("");
  const [showReconcilePage, setShowReconcilePage] = useState(false);
  const [selectedTx, setSelectedTx] = useState([]);

  // Use API data if available, otherwise fallback to mock data
  const transactions = ledgerData?.transactions || [];
  const balances = ledgerData?.balances || {
    opening_balance: 0,
    closing_balance: 0,
    total_debit: 0,
    total_credit: 0,
  };
  const period = ledgerData?.period || {};

  // Get beginning balance from ledger data
  const beginningBalance = balances.opening_balance || 0;
  const currentBalance = balances.closing_balance || 0;

  // Calculate cleared payments and deposits
  const clearedPayments = transactions
    .filter((tx, idx) => selectedTx.includes(idx))
    .reduce((sum, tx) => sum + (tx.debit || 0), 0);

  const clearedDeposits = transactions
    .filter((tx, idx) => selectedTx.includes(idx))
    .reduce((sum, tx) => sum + (tx.credit || 0), 0);

  const clearedBalance = beginningBalance - clearedPayments + clearedDeposits;
  const difference = Number(endingBalance) - clearedBalance;

  if (!account) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Select an account to view its ledger.
      </div>
    );
  }

  // Reconciliation page UI
  if (showReconcilePage) {
    return (
      <ReconcilePage
        companyId={companyId}
        accountId={account.id}
        account={account}
        setShowReconcilePage={setShowReconcilePage}
      />
    );
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between mb-4">
        <Link
          href={`/chart-of-accounts`}
          className="bg-white text-blue-700 border border-blue-500 hover:bg-blue-50 flex items-center py-2 px-3 rounded-sm"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Chart of Accounts
        </Link>
        <h2 className="text-2xl font-bold">
          Ledger: {account.name} ({account.code})
        </h2>
      </div>

      {/* Ledger Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-muted/50 dark:bg-dark-muted/50 p-2 rounded-md mb-2 items-center border">
        <div>
          <p className="text-xs text-muted-foreground uppercase">Account Type</p>
          <p className="font-semibold capitalize text-sm">{account.type}</p>
        </div>
        <div className="flex gap-4">
           <div>
             <label className="text-xs text-muted-foreground uppercase block">From Date</label>
             <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-transparent border rounded px-1 py-0.5 text-xs"
             />
           </div>
           <div>
             <label className="text-xs text-muted-foreground uppercase block">To Date</label>
             <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-transparent border rounded px-1 py-0.5 text-xs"
             />
           </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase">Closing Balance</p>
            <p className="font-bold text-lg">
              {currentBalance.toLocaleString("en-US", {
                style: "decimal",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>
          <Button
            variant="primary"
            className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold px-5 py-1 rounded shadow hover:from-blue-600 hover:to-blue-800 transition ml-4"
            onClick={() => setShowReconcilePage(true)}
          >
            Reconcile
          </Button>
        </div>
      </div>

      {/* Date Range Selection - UI Enhanced */}
      <div className="flex flex-wrap gap-2 mb-2 items-center bg-muted/30 dark:bg-dark-muted/30 p-2 rounded shadow-sm border border-dashed">
        <p className="text-sm text-muted-foreground">
          Showing {transactions.length} transactions for period: <span className="font-medium">{period.start_date} to {period.end_date}</span>
        </p>
        <div className="ml-auto text-sm font-medium flex gap-4">
          <span className="text-blue-600">Debit: {balances.total_debit?.toLocaleString("en-US", {
            style: "decimal",
            minimumFractionDigits: 2,
          })}</span>
          <span className="text-red-600">Credit: {balances.total_credit?.toLocaleString("en-US", {
            style: "decimal",
            minimumFractionDigits: 2,
          })}</span>
        </div>
      </div>

      {/* Reconcile Feature - handled by ReconcilePage component above */}
      <div
        className="mt-2 overflow-x-auto rounded-lg border border-border dark:border-dark-border shadow-md max-h-[80vh] overflow-y-auto"
        style={{ minHeight: "70vh" }}
      >
        <h3 className="text-xl font-semibold p-2 bg-card dark:bg-dark-card border-b border-border dark:border-dark-border">
          Transactions
        </h3>
        <table className="w-full min-w-[700px] text-sm text-left text-foreground dark:text-dark-foreground">
          <thead className="sticky top-0 z-20 text-xs text-primary dark:text-dark-primary uppercase bg-muted dark:bg-dark-muted border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th scope="col" className="px-2 py-1">
                Date
              </th>
              <th scope="col" className="px-2 py-1">
                Description
              </th>
              <th scope="col" className="px-2 py-1">
                Transaction Type
              </th>
              <th scope="col" className="px-2 py-1 text-right">
                Debit
              </th>
              <th scope="col" className="px-2 py-1 text-right">
                Credit
              </th>
              <th scope="col" className="px-2 py-1 text-right">
                Balance
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.length > 0 ? (
              transactions.map((tx, index) => (
                <tr
                  key={index}
                  className="bg-card dark:bg-dark-card border-b border-border dark:border-dark-border last:border-b-0 hover:bg-muted/30 dark:hover:bg-dark-muted/30 transition-colors duration-150"
                >
                  <td className="px-2 py-1">{tx.date}</td>
                  <td className="px-2 py-1">
                    <span className="font-medium">{tx.description}</span>
                    {tx.memo && <div className="text-xs text-muted-foreground">{tx.memo}</div>}
                  </td>
                  <td className="px-2 py-1 text-xs">
                    <div>{tx.reference_type}</div>
                    {tx.reference_id && <div className="text-muted-foreground">#{tx.reference_id}</div>}
                  </td>
                  <td className="px-2 py-1 text-right">
                    {tx.debit.toLocaleString("en-US", {
                      style: "decimal",
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-2 py-1 text-right">
                    {tx.credit.toLocaleString("en-US", {
                      style: "decimal",
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-2 py-1 text-right font-semibold">
                    {tx.balance.toLocaleString("en-US", {
                      style: "decimal",
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="text-center py-4 text-muted-foreground"
                >
                  No transactions found for this account.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccountLedger;
