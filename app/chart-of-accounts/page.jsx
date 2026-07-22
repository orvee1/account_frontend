"use client";

import { useEffect, useState } from "react";
import ChartOfAccountsFullPage from "@/components/accounts/ChartOfAccountsFull";
import { getChartAccountsClient } from "@/services/chartAccounts";
import { useAuth } from "@/contexts/AuthContext";

export default function ChartOfAccountsPage() {
  const { user } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [companyId, setCompanyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function loadChartData() {
      try {
        setLoading(true);
        setError(null);

        const effectiveCompanyId = user?.company_id || user?.company?.id;
        
        if (!effectiveCompanyId) {
          setError("Company ID not found. Please login again.");
          setLoading(false);
          return;
        }

        setCompanyId(effectiveCompanyId);

        const res = await getChartAccountsClient(effectiveCompanyId);

        if (!res.ok) {
          throw new Error(`API error: ${res.status} ${res.statusText}`);
        }

        // Check content-type before parsing JSON
        const contentType = res.headers.get('content-type');
        let responseJson;

        if (contentType?.includes('application/json')) {
          responseJson = await res.json();
        } else {
          // If not JSON, get text to see what's actually being returned
          const text = await res.text();
          console.error('API returned non-JSON response:', text.substring(0, 500));
          throw new Error(`API returned ${contentType || 'unknown'} content instead of JSON`);
        }

        // The API returns the roots array directly (or it might be responseJson)
        // Based on ChartAccountController.php: return response()->json($roots);
        const tree = Array.isArray(responseJson) ? responseJson : (responseJson?.data || []);
        setChartData(tree);
      } catch (err) {
        console.error("Error loading chart data:", err);
        setError(err.message || "Failed to load chart of accounts");
      } finally {
        setLoading(false);
      }
    }

    loadChartData();
  }, [user]);

  if (loading) {
    return <div className="p-6 text-center">Loading chart of accounts...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Error: {error}</div>;
  }

  if (!companyId) {
    return <div className="p-6">Not authorized or Company ID missing.</div>;
  }

  return (
    <ChartOfAccountsFullPage initialChartData={chartData} companyId={companyId} />
  );
}
