// =============================================
// app/(dashboard)/vendors/page.jsx
// =============================================
"use client";

import { Skeleton } from "@/components/ui/skeleton";
import VendorsServices from "@/components/vendors/VendorsServices";
import { fetchVendors } from "@/services/vendor";
import { useEffect, useState } from "react";

export default function VendorsPage() {
  const [initialVendors, setInitialVendors] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchVendors();
        if (!mounted) return;
        if (data?.data || Array.isArray(data)) {
          setInitialVendors(Array.isArray(data) ? data : data?.data || []);
        } else {
          setLoadError("Failed to load vendors");
        }
      } catch (e) {
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
      <div className="p-1">
        <div className="space-y-3">
          <Skeleton className="h-8 w-[240px]" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-1">
      {loadError ? (
        <p className="mt-4 text-sm text-red-500">{loadError}</p>
      ) : (
        <VendorsServices initialVendors={initialVendors} />
      )}
    </div>
  );
}
