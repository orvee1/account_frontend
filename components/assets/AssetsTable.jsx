"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpDown, Filter } from "lucide-react";
import { useMemo, useState } from "react";

/** Normalize a row for UI (camelCase primary; snake_case fallback) */
const normalizeAsset = (row) => ({
  id: row.id,
  name: row.name ?? "",
  companyId: row.companyId ?? row.company_id ?? "",
  tagSerialNumber: row.tagSerialNumber ?? row.tag_serial_number ?? "",
  category: row.category ?? "",
  assetLocation: row.assetLocation ?? row.asset_location ?? "",
  purchaseDate: row.purchaseDate ?? row.purchase_date ?? "",
  amount: parseFloat(row.amount ?? 0) || 0,
  usefulLife: parseFloat(row.usefulLife ?? row.useful_life ?? 0) || 0,
  salvageValue: parseFloat(row.salvageValue ?? row.salvage_value ?? 0) || 0,
  depreciationMethod: row.depreciationMethod ?? row.depreciation_method ?? "",
  depreciationRate: row.depreciationRate ?? row.depreciation_rate ?? "",
  // Status will come from API now; fallback maintained
  status: row.status ?? (row.disposal_type || row.disposalDate || row.disposal_date ? (row.disposal_type ?? "Disposed") : "Active"),
  disposalDate: row.disposalDate ?? row.disposal_date ?? "",
  _raw: row, // original for edit/delete
});

const monthsBetween = (startISO, end = new Date()) => {
  if (!startISO) return 0;
  const start = new Date(startISO);
  if (isNaN(start.getTime())) return 0;
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
};
const monthlyDep = (amount, salvage, life) => {
  const A = parseFloat(amount) || 0;
  const S = parseFloat(salvage) || 0;
  const L = parseFloat(life) || 0;
  if (A <= 0 || L <= 0) return 0;
  return (A - S) / (L * 12);
};
const accumulated = (asset) => {
  const m = monthlyDep(asset.amount, asset.salvageValue, asset.usefulLife);
  const acc = m * monthsBetween(asset.purchaseDate);
  const max = Math.max(asset.amount - asset.salvageValue, 0);
  return Math.min(Math.max(acc, 0), max);
};
const bookValue = (asset) => Math.max(asset.amount - accumulated(asset), asset.salvageValue);

export default function AssetsTable({ assets = [], onEdit, onDelete }) {
  const rowsBase = useMemo(() => assets.map(normalizeAsset), [assets]);

  const [sortConfig, setSortConfig] = useState({ key: null, direction: "ascending" });
  const [filters, setFilters] = useState({});

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };
  const handleFilterChange = (key, value) => setFilters((p) => ({ ...p, [key]: value }));

  const filteredAndSorted = useMemo(() => {
    let list = [...rowsBase];

    // filters: comma-separated terms
    Object.keys(filters).forEach((key) => {
      const raw = (filters[key] ?? "").toString().trim().toLowerCase();
      if (!raw) return;
      const terms = raw.split(",").map((t) => t.trim()).filter(Boolean);

      list = list.filter((item) => {
        let value;
        if (key === "accumulatedDepreciation") value = accumulated(item);
        else if (key === "netBookValue") value = bookValue(item);
        else if (key === "depreciationRate") {
          const provided = item.depreciationRate;
          value = provided !== "" && provided != null
            ? parseFloat(provided) || 0
            : (item.usefulLife > 0 ? (100 / item.usefulLife) : 0);
        } else value = item[key];

        const hay = String(value ?? "").toLowerCase();
        return terms.some((t) => hay.includes(t));
      });
    });

    if (sortConfig.key) {
      list.sort((a, b) => {
        const key = sortConfig.key;
        const getVal = (row) => {
          if (key === "purchaseDate") return row.purchaseDate ? new Date(row.purchaseDate).getTime() : 0;
          if (key === "amount" || key === "usefulLife" || key === "salvageValue") return parseFloat(row[key] || 0) || 0;
          if (key === "depreciationRate") {
            const provided = row.depreciationRate;
            return provided !== "" && provided != null
              ? parseFloat(provided) || 0
              : (row.usefulLife > 0 ? (100 / row.usefulLife) : 0);
          }
          if (key === "accumulatedDepreciation") return accumulated(row);
          if (key === "netBookValue") return bookValue(row);
          return (row[key] ?? "").toString().toLowerCase();
        };
        const av = getVal(a), bv = getVal(b);
        if (av < bv) return sortConfig.direction === "ascending" ? -1 : 1;
        if (av > bv) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return list;
  }, [rowsBase, filters, sortConfig]);

  // headers config for DRY UI
  const headers = [
    { key: "name", label: "Asset Name" },
    { key: "tagSerialNumber", label: "Tag No" },
    { key: "category", label: "Category" },
    { key: "assetLocation", label: "Location" },
    { key: "purchaseDate", label: "Purchase Date" },
    { key: "amount", label: "Purchase Price" },
    { key: "usefulLife", label: "Useful Life" },
    { key: "salvageValue", label: "Salvage Value" },
    { key: "depreciationMethod", label: "Depreciation Method" },
    { key: "depreciationRate", label: "Depreciation Rate" },
    { key: "accumulatedDepreciation", label: "Accumulated Depreciation" },
    { key: "netBookValue", label: "Net Book Value" },
    { key: "status", label: "Status" },
    { key: "disposalDate", label: "Disposal Date" },
  ];

  return (
    <div className="overflow-hidden rounded-lg border bg-white">
      <Table className="border border-collapse">
        <TableHeader>
          <TableRow>
            {headers.map((col) => (
              <TableHead key={col.key} className="border text-center">
                <div className="flex items-center justify-center">
                  {col.label}
                  <ArrowUpDown className="ml-2 h-4 w-4 cursor-pointer" onClick={() => handleSort(col.key)} />
                  <Popover>
                    <PopoverTrigger asChild>
                      <Filter className="ml-2 h-4 w-4 cursor-pointer" />
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2">
                      <Input
                        placeholder={`Filter ${col.label.toLowerCase()}...`}
                        value={filters[col.key] || ""}
                        onChange={(e) => handleFilterChange(col.key, e.target.value)}
                        className="mt-1"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </TableHead>
            ))}
            <TableHead className="border text-center">Action</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {filteredAndSorted.map((asset) => {
            const rate = asset.depreciationRate !== "" && asset.depreciationRate != null
              ? parseFloat(asset.depreciationRate) || 0
              : (asset.usefulLife > 0 ? (100 / asset.usefulLife) : 0);
            const accDep = accumulated(asset);
            const nbv = bookValue(asset);

            return (
              <TableRow key={asset.id}>
                <TableCell className="border text-center">{asset.name}</TableCell>
                <TableCell className="border text-center">{asset.tagSerialNumber}</TableCell>
                <TableCell className="border text-center">{asset.category}</TableCell>
                <TableCell className="border text-center">{asset.assetLocation}</TableCell>
                <TableCell className="border text-center">{asset.purchaseDate}</TableCell>
                <TableCell className="border text-center">{asset.amount}</TableCell>
                <TableCell className="border text-center">{asset.usefulLife}</TableCell>
                <TableCell className="border text-center">{asset.salvageValue}</TableCell>
                <TableCell className="border text-center">{asset.depreciationMethod}</TableCell>
                <TableCell className="border text-center">{rate.toFixed(2)}%</TableCell>
                <TableCell className="border text-center">{accDep.toFixed(2)}</TableCell>
                <TableCell className="border text-center">{nbv.toFixed(2)}</TableCell>
                <TableCell className="border text-center">{asset.status}</TableCell>
                <TableCell className="border text-center">{asset.disposalDate}</TableCell>
                <TableCell className="border text-center">
                  <Button variant="outline" size="sm" onClick={() => onEdit?.(asset._raw)}>Edit</Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="ml-2"
                    onClick={() => onDelete?.(asset._raw?.id ?? asset.id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          {filteredAndSorted.length === 0 && (
            <TableRow>
              <TableCell colSpan={15} className="text-center py-10 text-muted-foreground">
                No assets found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
