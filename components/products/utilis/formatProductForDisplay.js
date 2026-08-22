export default function formatProductForDisplay (product) {
  const productType = product.productType ?? product.product_type ?? "Stock";
  const units = product.units || [];
  const baseUnit = units.find(u => u.isBase || u.is_base === 1 || u.is_base === true)
    || { name: product.base_unit_name ?? product.baseUnitName ?? product.baseUom?.name ?? "N/A", factor: 1 };
  const stockRows = Array.isArray(product.stocks) ? product.stocks : [];
  const stockQuantity = stockRows.reduce((sum, row) => sum + Number(row.quantity_on_hand ?? 0), 0);
  const stockWeightedCostTotal = stockRows.reduce((sum, row) => sum + (Number(row.quantity_on_hand ?? 0) * Number(row.avg_cost ?? 0)), 0);
  const stockAvgCost = stockQuantity > 0 ? stockWeightedCostTotal / stockQuantity : null;
  const openingQuantity = Number(product.openingQuantity ?? product.opening_quantity ?? 0);
  const currentStock = Number(
    product.current_stock_in_base_uom ??
    product.currentStockInBaseUom ??
    product.quantity_on_hand ??
    product.quantityOnHand ??
    0
  ) || stockQuantity || openingQuantity;
  let cost = Number(
    product.weighted_avg_cost ??
    product.weightedAvgCost ??
    product.costing_price ??
    product.costingPrice ??
    product.avg_cost ??
    0
  );
  if (cost === 0 && stockAvgCost !== null) {
    cost = stockAvgCost;
  }
  const qty = productType === "Service" ? Infinity : currentStock;
  const value = productType === "Service" ? Infinity : qty * cost;

  const formattedCost = Number.isFinite(cost) ? cost : 0;
  const formattedQty = Number.isFinite(qty) ? qty : 0;
  const formattedValue = Number.isFinite(value) ? value : 0;

  const computedBaseUnitName = product.baseUnitName ?? product.base_unit_name ?? product.base_uom?.name ?? baseUnit.name;

  return {
    ...product,
    productType,
    openingQuantity,
    currentStock,
    costingPrice: cost,
    baseUnitName: computedBaseUnitName,
    avgCost: formattedCost,
    qty: formattedQty,
    value: formattedValue,
    avgCostFormatted: formattedCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    qtyFormatted: productType === "Service" ? "N/A" : `${formattedQty.toLocaleString("en-US")} ${computedBaseUnitName}`,
    valueFormatted: productType === "Service" ? "N/A" : formattedValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  };
};
