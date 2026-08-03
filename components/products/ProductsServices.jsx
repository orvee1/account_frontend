"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createProduct, updateProduct, deleteProduct } from "@/services/product";
import AddProductForm from "./AddProductForm";
import { FileDown, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import formatProductForDisplay from "./utilis/formatProductForDisplay";
import SortableHeader from "@/components/SortableHeader";
import { fetchWarehouses } from "@/services/warehouse";
import { fetchBrands } from "@/services/brand";
import { fetchCategories } from "@/services/category";

export default function ProductsServices({ initialProducts = [] }) {
  const startingProducts = Array.isArray(initialProducts?.data) 
    ? initialProducts.data 
    : Array.isArray(initialProducts) 
      ? initialProducts 
      : [];

  const [products, setProducts] = useState(
    startingProducts.map((p, i) => formatProductForDisplay({ ...p, sl: i + 1 }))
  );

  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "sl", direction: "ascending" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Load lookups
  const loadLookups = async () => {
    const [c, b, w] = await Promise.all([
      fetchCategories({ per_page: 9999 }),
      fetchBrands({ per_page: 9999 }),
      fetchWarehouses({ per_page: 9999 }),
    ]);
    if (c?.data) setCategories(c.data);
    if (b?.data) setBrands(b.data);
    if (w?.data) setWarehouses(w.data);
  };

  useEffect(() => { loadLookups(); }, []);

  const handleOpenModal = (p = null) => {
    setProductToEdit(p ? {
      id: p?.id,
      name: p?.name,
      sku: p?.sku,
      barcode: p?.barcode,
      description: p?.description,
      category_id: p?.category_id,
      brand_id: p?.brand_id,
      productType: p?.product_type,
      salesPrice: p?.sales_price,
      costingPrice: p?.costing_price,
      taxPercent: p?.tax_percent,
      openingQuantity: p?.opening_quantity,
      batchNo: p?.batch_no,
      manufacturingDate: p?.manufactured_at,
      expiryDate: p?.expired_at,
      meta: p?.meta,
      baseUnitName: p?.base_unit_name ?? p?.baseUnitName,
      hasWarranty: !!(p?.has_warranty ?? p?.hasWarranty),
      warrantyDays: p?.warranty_days ?? p?.warrantyDays,
      warehouse_id: p?.warehouse_id ?? p?.warehouseId,
      units: (p?.units ?? []).map(u => ({
        id: u.id,
        name: u.name,
        factor: u.factor,
        isBase: !!(u.is_base === 1 || u.isBase),
      })),
      comboItems: (p?.combo_items ?? p?.comboItems ?? []).map(ci => ({
        id: ci.item_product_id ?? ci.product_id ?? ci.id,
        name: ci.name ?? ci.itemProduct?.name,
        comboQuantity: ci.quantity ?? ci.comboQuantity,
      })),
    } : null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setProductToEdit(null);
  };

  // Create/Update
  const handleSaveProduct = async (payload, isEdit) => {
    const id = payload?.id;

    if (isEdit && id !== undefined && id !== null) {
      const { ok, data, statusText } = await updateProduct(id, payload);
      if (!ok) {
        return { ok: false, errors: data?.errors, message: data?.message };
      }
      setProducts(prev =>
        prev.map(p => (String(p.id) === String(id) ? formatProductForDisplay({ ...p, ...data }) : p))
      );
      handleCloseModal();
    } else {
      const { ok, data, statusText } = await createProduct(payload);
      if (!ok) {
        return { ok: false, errors: data?.errors, message: data?.message };
      }

      const newSl = products.length > 0 ? Math.max(...products.map(p => Number(p.sl) || 0)) + 1 : 1;
      setProducts(prev => [...prev, formatProductForDisplay({ ...data, sl: newSl })]);
      handleCloseModal();
    }
  };

  // Delete
  const handleAskDelete = (id) => {
    const found = products.find(p => String(p.id) === String(id));
    if (found) {
      setProductToDelete(found);
      setConfirmOpen(true);
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    const { ok, statusText } = await deleteProduct(productToDelete.id);
    if (!ok) return alert(`Delete failed: ${statusText || "error"}`);
    setProducts(prev => prev.filter(p => String(p.id) !== String(productToDelete.id)));
    setConfirmOpen(false);
    setProductToDelete(null);
    alert("Deleted");
  };

  const requestSort = (key) => {
    let direction = "ascending";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const list = useMemo(() => {
    let items = [...products];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(p => Object.values(p).some(v => String(v ?? "").toLowerCase().includes(term)));
    }
    if (sortConfig) {
      const { key, direction } = sortConfig;
      items.sort((a, b) => {
        let av = a[key], bv = b[key];
        const numeric = new Set(["avgCost", "qty", "value", "sl", "costingPrice", "openingQuantity", "salesPrice"]);
        if (numeric.has(String(key))) {
          av = av === Infinity ? (direction === "ascending" ? Infinity : -Infinity) : (parseFloat(av) || 0);
          bv = bv === Infinity ? (direction === "ascending" ? Infinity : -Infinity) : (parseFloat(bv) || 0);
        } else if (typeof av === "string") {
          av = av.toLowerCase(); bv = bv.toLowerCase();
        }
        if (av < bv) return direction === "ascending" ? -1 : 1;
        if (av > bv) return direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [products, searchTerm, sortConfig]);

  return (
    <div className={`p-4 md:p-6 ${isModalOpen ? "" : "space-y-6"}`}>
      <div className="flex justify-end">
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <input
            className="mr-auto h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm sm:w-64 md:w-80"
            placeholder="Search products/services..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="button">Search</Button>
          <Button type="button" variant="outline">
            <FileDown size={16} className="mr-2" /> Import from Excel
          </Button>
          <Button type="button" onClick={() => handleOpenModal(null)}>
            <PlusCircle size={20} className="mr-2" /> Add New
          </Button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80">
          <div className="fixed left-[50%] top-[5%] z-50 grid w-full lg:max-w-4xl translate-x-[-50%] gap-4 border p-6 sm:rounded-lg max-h-[90vh] overflow-y-auto sm:max-w-2xl bg-white rounded-lg">
            <div className="w-full max-w-4xl rounded shadow p-0">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-xl font-semibold">{productToEdit ? "Edit Product/Service" : "Add Product/Service"}</h3>
                <button onClick={handleCloseModal} className="px-2 py-1 rounded-full bg-rose-600 text-white">✕</button>
              </div>
              <div className="p-4">
                <AddProductForm
                  initialData={productToEdit || undefined}
                  isEditMode={!!productToEdit}
                  onSave={handleSaveProduct}
                  onCancel={() => setIsModalOpen(false)}
                  categories={categories}
                  brands={brands}
                  warehouses={warehouses}
                  products={products}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded shadow p-4 max-w-md w-full">
            <h4 className="font-semibold mb-2">Delete this product?</h4>
            <p className="text-sm mb-4">"{productToDelete?.name}" একবার ডিলিট করলে আর ফেরত আনা যাবে না।</p>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-2 rounded border" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="px-3 py-2 rounded bg-red-600 text-white" onClick={handleConfirmDelete}>Yes, delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg max-h-[65vh] overflow-y-auto">
        <table className="w-full min-w-[900px] text-sm text-left">
          <thead className="sticky top-0 z-20 text-xs uppercase bg-muted border-b border-slate-200">
            <tr>
              {[
                ["sl", "Sl"],
                ["id", "ID"],
                ["name", "Name"],
                ["productType", "Type"],
                ["baseUnitName", "Base Unit"],
                ["avgCost", "Avg. Cost (৳)"],
                ["qty", "Quantity"],
                ["value", "Value (৳)"],
              ].map(([dataKey, label]) => (
                <SortableHeader
                  key={dataKey}
                  sortConfig={sortConfig}
                  requestSort={() => requestSort(dataKey)}
                  className="w-16"
                >
                  {label}
                </SortableHeader>
              ))}
              <th className="px-4 py-3 text-center w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.length > 0 && list.map((p) => (
              <tr key={String(p?.id)} className="border-t">
                <td className="px-4 py-3">{p?.sl}</td>
                <td className="px-4 py-3 text-xs font-mono">{p?.id}</td>
                <td className="px-4 py-3">{p?.name}</td>
                <td className="px-4 py-3">{p?.product_type}</td>
                <td className="px-4 py-3">{p?.base_unit_name}</td>
                <td className="px-4 py-3 text-right">{p?.avgCostFormatted ?? 0}</td>
                <td className="px-4 py-3 text-right">{p?.qtyFormatted ?? 0}</td>
                <td className="px-4 py-3 text-right">{p?.valueFormatted ?? 0}</td>
                <td className="px-2 py-2 text-center">
                  <button className="px-2 py-1 rounded border" onClick={() => handleOpenModal(p)}>Edit</button>{" "}
                  <button className="px-2 py-1 rounded border text-red-600" onClick={() => handleAskDelete(p?.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={9} className="text-center py-10 text-gray-500">No products found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
