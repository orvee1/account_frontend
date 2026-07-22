export default function formatProductForDisplay (product) {
  const productType = product.productType ?? product.product_type ?? "Stock";
  const units = product.units || [];
  const baseUnit = units.find(u => u.isBase || u.is_base === 1 || u.is_base === true)
    || { name: product.base_unit_name || "N/A", factor: 1 };
  const openingQuantity = product.openingQuantity ?? product.opening_quantity ?? 0;
  const cost = product.costingPrice ?? product.costing_price ?? 0;
  const qty = productType === "Service" ? Infinity : openingQuantity;
  const value = productType === "Service" ? Infinity : qty * cost;

  return {
    ...product,
    productType,
    openingQuantity,
    costingPrice: cost,
    baseUnitName: baseUnit.name,
    avgCost: cost,
    qty,
    value,
    avgCostFormatted: cost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    qtyFormatted: productType === "Service" ? "N/A" : `${Number.isFinite(qty) ? qty.toLocaleString("en-US") : "N/A"} ${baseUnit.name}`,
    valueFormatted: productType === "Service" ? "N/A" : value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  };
};
