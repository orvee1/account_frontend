"use client";

import PurchaseBillsList from "@/components/purchases/PurchaseBillsList";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPurchaseBills } from "@/services/purchase";
import { useEffect, useState } from "react";

export default function PurchasesPage() {
  const [initialBills, setInitialBills] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchPurchaseBills();
        if (!mounted) return;
        
        console.log("Purchase Bills Response:", data);
        
        if (data?.data || Array.isArray(data)) {
          const bills = Array.isArray(data) ? data : (data?.data?.data || data?.data || []);
          setInitialBills(bills);
        } else {
          setLoadError("Failed to load purchase bills");
        }
      } catch (e) {
        console.error("Load error:", e);
        if (mounted) setLoadError("An unexpected error occurred");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => (mounted = false);
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-[240px]" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {loadError ? (
        <p className="mt-4 text-sm text-red-500">{loadError}</p>
      ) : (
        <PurchaseBillsList initialBills={initialBills} />
      )}
    </div>
  );
}