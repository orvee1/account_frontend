"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { createProduct, updateProduct, deleteProduct } from "@/services/product";
import AddProductForm from "./AddProductForm";
import { FileDown, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
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

  const fileInputRef = useRef(null);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importRows, setImportRows] = useState([]);
  const [importErrors, setImportErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [importSummary, setImportSummary] = useState(null);

  const IMPORT_HEADERS = [
    "Product Type",
    "Name",
    "SKU",
    "Barcode",
    "Description",
    "Category",
    "Brand",
    "Costing Price",
    "Sales Price",
    "VAT Rate",
    "VAT Inclusive",
    "AIT Rate",
    "Warehouse",
    "Opening Quantity",
    "Manufactured At",
    "Expired At",
    "Has Warranty",
    "Warranty Days",
    "Base UOM Name",
    "Base UOM Symbol",
    "Status",
  ];

  const parseBoolean = (value) => {
    if (typeof value === "boolean") return value;
    const normalized = String(value ?? "").trim().toLowerCase();
    return ["1", "true", "yes", "y", "on"].includes(normalized);
  };

  const resolveLookupId = (items, value) => {
    const raw = String(value ?? "").trim();
    if (!raw) return null;
    const numeric = Number(raw);
    if (!Number.isNaN(numeric) && String(numeric) !== "NaN") {
      const byId = items?.find((item) => String(item.id) === String(raw));
      if (byId) return byId.id;
    }
    return items?.find((item) => String(item?.name ?? "").trim().toLowerCase() === raw.toLowerCase())?.id ?? null;
  };

  const makeImportPayload = (row) => {
    const productType = String(row["Product Type"] ?? "Stock").trim() || "Stock";
    const salesPrice = Number(row["Sales Price"] ?? 0);
    const baseUomName = String(row["Base UOM Name"] ?? "").trim();
    const baseUomSymbol = String(row["Base UOM Symbol"] ?? "").trim();
    return {
      product_type: productType,
      name: String(row["Name"] ?? "").trim(),
      sku: row["SKU"] ? String(row["SKU"]).trim() : null,
      barcode: row["Barcode"] ? String(row["Barcode"]).trim() : null,
      description: row["Description"] ? String(row["Description"]).trim() : null,
      category_id: resolveLookupId(categories, row["Category"]),
      brand_id: resolveLookupId(brands, row["Brand"]),
      costing_price: Number(row["Costing Price"] ?? 0),
      sales_price: salesPrice,
      vat_rate: Number(row["VAT Rate"] ?? 0),
      vat_inclusive: parseBoolean(row["VAT Inclusive"]) ? 1 : 0,
      ait_rate: Number(row["AIT Rate"] ?? 0),
      warehouse_id: resolveLookupId(warehouses, row["Warehouse"]),
      opening_quantity: row["Opening Quantity"] ? Number(row["Opening Quantity"]) : null,
      manufactured_at: row["Manufactured At"] ? String(row["Manufactured At"]).trim() : null,
      expired_at: row["Expired At"] ? String(row["Expired At"]).trim() : null,
      has_warranty: parseBoolean(row["Has Warranty"]) ? 1 : 0,
      warranty_days: row["Warranty Days"] ? Number(row["Warranty Days"]) : null,
      status: String(row["Status"] ?? "active").trim().toLowerCase() === "inactive" ? "inactive" : "active",
      product_uoms: baseUomName ? [
        {
          uom_id: null,
          name: baseUomName,
          symbol: baseUomSymbol,
          conversion_factor: 1,
          sale_price: salesPrice,
          is_base_uom: 1,
          is_default_sale_uom: 1,
        },
      ] : [],
    };
  };

  const downloadImportTemplate = () => {
    const sampleRow = {
      "Product Type": "Stock",
      Name: "Example Product",
      SKU: "EX123",
      Barcode: "1234567890123",
      Description: "Optional product description",
      Category: "Default Category",
      Brand: "Example Brand",
      "Costing Price": 100,
      "Sales Price": 125,
      "VAT Rate": 15,
      "VAT Inclusive": "No",
      "AIT Rate": 0,
      Warehouse: "Main Warehouse",
      "Opening Quantity": 10,
      "Manufactured At": "2026-01-01",
      "Expired At": "2027-01-01",
      "Has Warranty": "No",
      "Warranty Days": "",
      "Base UOM Name": "Piece",
      "Base UOM Symbol": "pcs",
      Status: "active",
    };

    const worksheet = XLSX.utils.json_to_sheet([sampleRow], { header: IMPORT_HEADERS });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    XLSX.writeFile(workbook, "product-import-template.xlsx");
  };

  const parseProductImportFile = async (file) => {
    const extension = file.name.split(".").pop().toLowerCase();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const content = event.target.result;

          if (extension === "csv") {
            const parsed = Papa.parse(content, {
              header: true,
              skipEmptyLines: true,
              transformHeader: (header) => String(header ?? "").trim(),
            });
            resolve(parsed.data.filter((row) => Object.values(row).some((value) => value !== null && value !== "")));
          } else if (extension === "xlsx" || extension === "xls") {
            const workbook = XLSX.read(content, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });
            resolve(jsonData.filter((row) => Object.values(row).some((value) => value !== null && value !== "")));
          } else {
            reject(new Error("Unsupported file type"));
          }
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));

      if (extension === "csv") {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const handleProductImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = "";

    setSelectedFileName(file.name);
    setImportErrors([]);
    setImportSummary(null);

    try {
      const rows = await parseProductImportFile(file);
      if (!rows || rows.length === 0) {
        setImportRows([]);
        setImportErrors(["No product rows found in the selected file."]);
      } else {
        setImportRows(rows);
      }
      setIsImportDialogOpen(true);
    } catch (error) {
      setImportRows([]);
      setImportErrors([error?.message || "Unable to parse file"]);
      setIsImportDialogOpen(true);
    }
  };

  const resetImportDialog = () => {
    setIsImportDialogOpen(false);
    setImportRows([]);
    setImportErrors([]);
    setSelectedFileName("");
    setImportSummary(null);
    setImporting(false);
  };

  const importProducts = async () => {
    if (!importRows.length) return;
    setImporting(true);
    const summary = { success: 0, failed: 0, errors: [] };

    for (let index = 0; index < importRows.length; index += 1) {
      const row = importRows[index];
      const payload = makeImportPayload(row);
      const { ok, data, errors, statusText } = await createProduct(payload);

      if (ok) {
        setProducts((prev) => [
          ...prev,
          formatProductForDisplay({ ...data, sl: prev.length > 0 ? Math.max(...prev.map((item) => Number(item.sl) || 0)) + 1 : 1 }),
        ]);
        summary.success += 1;
      } else {
        summary.failed += 1;
        const message = errors ? JSON.stringify(errors) : statusText || "Import failed";
        summary.errors.push(`Row ${index + 2}: ${message}`);
      }
    }

    setImportSummary(summary);
    setImporting(false);
  };

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
      canEditCostingPrice: p?.can_edit_costing_price ?? true,
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
    const { ok, data, statusText } = await deleteProduct(productToDelete.id);
    if (!ok) {
      const message = data?.message || statusText || "Delete failed";
      alert(message);
      return;
    }
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button type="button" variant="outline" className="flex items-center">
                <FileDown size={16} className="mr-2" /> Import
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-card shadow-lg rounded-md border border-border">
              <DropdownMenuItem onClick={() => fileInputRef.current?.click()} className="cursor-pointer">
                Bulk upload
              </DropdownMenuItem>
              <DropdownMenuItem onClick={downloadImportTemplate} className="cursor-pointer">
                Download template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button type="button" onClick={() => handleOpenModal(null)}>
            <PlusCircle size={20} className="mr-2" /> Add New
          </Button>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleProductImportFile}
      />

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

      {isImportDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <div>
                <h3 className="text-xl font-semibold">Import Products from Excel/CSV</h3>
                <p className="text-sm text-slate-500">Upload a file using the template and then review parsed records before importing.</p>
                {selectedFileName && <p className="text-sm text-slate-500">File: {selectedFileName}</p>}
              </div>
              <button
                type="button"
                className="rounded-full bg-slate-100 px-3 py-1 text-slate-700"
                onClick={resetImportDialog}
              >
                Close
              </button>
            </div>
            <div className="space-y-4 p-5">
              {importErrors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  <div className="font-semibold">Import errors</div>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    {importErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border bg-slate-50 p-3 text-sm">
                  <div className="font-semibold">Parsed rows</div>
                  <div className="mt-2 text-lg">{importRows.length}</div>
                </div>
                <div className="rounded-lg border bg-slate-50 p-3 text-sm">
                  <div className="font-semibold">Lookup fields</div>
                  <div className="mt-2 text-slate-500">Category / Brand / Warehouse names are matched case-insensitively.</div>
                </div>
                <div className="rounded-lg border bg-slate-50 p-3 text-sm">
                  <div className="font-semibold">Type</div>
                  <div className="mt-2 text-slate-500">Supported values: Stock, Non-stock, Service, Combo</div>
                </div>
              </div>

              {importRows.length > 0 && (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-slate-100 text-xs uppercase text-slate-700">
                      <tr>
                        <th className="px-3 py-2">Row</th>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">SKU</th>
                        <th className="px-3 py-2">Category</th>
                        <th className="px-3 py-2">Brand</th>
                        <th className="px-3 py-2">Warehouse</th>
                        <th className="px-3 py-2">Sales Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.slice(0, 20).map((row, index) => (
                        <tr key={index} className="border-t hover:bg-slate-50">
                          <td className="px-3 py-2 align-top">{index + 2}</td>
                          <td className="px-3 py-2 align-top">{row["Name"] || "—"}</td>
                          <td className="px-3 py-2 align-top">{row["Product Type"] || "Stock"}</td>
                          <td className="px-3 py-2 align-top">{row["SKU"] || "—"}</td>
                          <td className="px-3 py-2 align-top">{row["Category"] || "—"}</td>
                          <td className="px-3 py-2 align-top">{row["Brand"] || "—"}</td>
                          <td className="px-3 py-2 align-top">{row["Warehouse"] || "—"}</td>
                          <td className="px-3 py-2 align-top">{row["Sales Price"] ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1 text-sm text-slate-600">
                  <p>Import template is available as an Excel download. Use the template headers exactly.</p>
                  <p className="text-xs">Only the first 20 rows are previewed here.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="secondary" onClick={() => fileInputRef.current?.click()}>
                    Choose another file
                  </Button>
                  <Button type="button" onClick={importProducts} disabled={importing || importRows.length === 0}>
                    {importing ? "Importing..." : "Import products"}
                  </Button>
                </div>
              </div>

              {importSummary && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                  <div className="font-semibold">Import summary</div>
                  <p className="mt-2">Imported: {importSummary.success}</p>
                  <p>Failed: {importSummary.failed}</p>
                  {importSummary.errors.length > 0 && (
                    <ul className="list-disc pl-5 mt-2 space-y-1">
                      {importSummary.errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
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
                  isTextRight={["avgCost", "qty", "value"].includes(dataKey)}
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
                <td className="px-4 py-3">{p?.productType ?? p?.product_type}</td>
                <td className="px-4 py-3">{p?.baseUnitName ?? p?.base_unit_name}</td>
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
