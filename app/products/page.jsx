"use client";

import { useEffect, useState } from "react";
import ProductsServices from "@/components/products/ProductsServices";
import { fetchProducts } from "@/services/product";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsPage() {
  const [initialProducts, setInitialProducts] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await fetchProducts();
        
        if (!mounted) return;
        
        if ( data?.data) {
          setInitialProducts(Array.isArray(data) ? data : data?.data || []);
        } else {
          setLoadError( "Failed to load products");
        }
      } catch (err) {
        if (mounted) {
          setLoadError("An unexpected error occurred");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadProducts();
    return () => (mounted = false);
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="space-y-3">
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
        <ProductsServices initialProducts={initialProducts} />
      )}
    </div>
  );
}
