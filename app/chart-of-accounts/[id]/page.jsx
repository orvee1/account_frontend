// app/chart-of-accounts/[id]/page.jsx
'use client'
import { useParams } from 'next/navigation'
import { notFound } from "next/navigation";
import { useEffect, useState } from 'react';
import AccountLedger from "@/components/reports/AccountLedger";
import { getAccountLedger } from '@/services/chartAccounts';
import { useAuth } from '@/contexts/AuthContext';


export default function AccountLedgerPage(promiseParams) {
  const params = useParams();
  const { user } = useAuth();
  const accountId = params?.id;
  const [account, setAccount] = useState(null);
  const [ledgerData, setLedgerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Default date range: last 30 days
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchLedgerData = async () => {
    try {
      setLoading(true);
      setError(null);

      const companyId = user?.company_id || user?.company?.id;
      
      if (!companyId) {
        setError('Company not found');
        setLoading(false);
        return;
      }

      // Fetch ledger data from API
      const response = await getAccountLedger(companyId, accountId, {
        start_date: startDate,
        end_date: endDate
      });

      if (response.success) {
        setAccount(response.account);
        setLedgerData(response);
      } else {
        setError('Failed to load account ledger');
      }
    } catch (err) {
      console.error('Error fetching ledger:', err);
      setError(err.message || 'Failed to load account ledger');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId && (user?.company_id || user?.company?.id)) {
      fetchLedgerData();
    }
  }, [accountId, user?.company_id, user?.company?.id, startDate, endDate]);

  if (loading && !ledgerData) {
    return (
      <div className="p-4 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">Loading account ledger...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !ledgerData) {
    return (
      <div className="p-4 max-w-7xl mx-auto space-y-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  if (!account && !loading) {
    return notFound();
  }

  return (
    <div className="p-4 max-w-7xl mx-auto space-y-6">
      <AccountLedger 
        account={account} 
        ledgerData={ledgerData} 
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        refreshData={fetchLedgerData}
      />
    </div>
  );
}
