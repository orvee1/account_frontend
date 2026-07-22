import { useMemo } from 'react';

export const useSalesCalculations = (formData, settings) => {
  const calculatedData = useMemo(() => {
    let subtotal = 0;
    let totalTradeDiscount = 0;
    let totalLineDiscount = 0;
    let totalTaxableAmount = 0;
    let totalVat = 0;
    let totalAit = 0;

    const items = formData.items.map((item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const unitPrice = parseFloat(item.unit_price) || 0;
      
      // Multi-UOM Calculation
      const saleUom = item.saleUom || { conversion_factor: 1 };
      const priceUom = item.priceUom || { conversion_factor: 1 };
      
      const pricePerBaseUnit = unitPrice / priceUom.conversion_factor;
      const unitPriceOriginal = pricePerBaseUnit * saleUom.conversion_factor;
      const lineGrossAmount = quantity * unitPriceOriginal;

      // Trade Discount
      const tradeDiscountPct = parseFloat(item.trade_discount_pct) || 0;
      const tradeDiscountAmt = lineGrossAmount * (tradeDiscountPct / 100);
      const netUnitPrice = unitPriceOriginal * (1 - tradeDiscountPct / 100);
      const amountAfterTradeDiscount = lineGrossAmount - tradeDiscountAmt;

      // Line Discount
      let lineDiscountAmt = parseFloat(item.line_discount_amt) || 0;
      const lineDiscountPct = parseFloat(item.line_discount_pct) || 0;
      
      if (item.discount_type === 'percentage' || (!item.line_discount_amt && lineDiscountPct > 0)) {
        lineDiscountAmt = amountAfterTradeDiscount * (lineDiscountPct / 100);
      } else if (amountAfterTradeDiscount > 0) {
        // Calculate percentage from amount if not provided
        // lineDiscountPct = (lineDiscountAmt / amountAfterTradeDiscount) * 100;
      }

      const lineSubtotal = amountAfterTradeDiscount - lineDiscountAmt;

      // VAT & AIT
      const vatRate = parseFloat(item.vat_rate) || 0;
      const aitRate = parseFloat(item.ait_rate) || 0;
      let vatAmount = 0;
      
      if (formData.vat_mode === 'inclusive') {
        vatAmount = (lineSubtotal * vatRate) / (100 + vatRate);
      } else {
        vatAmount = lineSubtotal * (vatRate / 100);
      }
      
      const aitAmount = lineSubtotal * (aitRate / 100);

      // COGS & Gross Profit
      const avgCost = parseFloat(item.weighted_avg_cost) || 0;
      const qtyInBase = quantity * saleUom.conversion_factor;
      const cogs = qtyInBase * avgCost;
      const grossProfit = lineSubtotal - cogs;

      // Accumulate Totals
      subtotal += lineGrossAmount;
      totalTradeDiscount += tradeDiscountAmt;
      totalLineDiscount += lineDiscountAmt;
      totalTaxableAmount += lineSubtotal;
      totalVat += vatAmount;
      totalAit += aitAmount;

      return {
        ...item,
        unit_price_original: unitPriceOriginal.toFixed(4),
        trade_discount_amt: tradeDiscountAmt.toFixed(4),
        net_unit_price: netUnitPrice.toFixed(4),
        line_gross_amount: lineGrossAmount.toFixed(4),
        line_discount_amt: lineDiscountAmt.toFixed(4),
        line_subtotal: lineSubtotal.toFixed(4),
        vat_amount: vatAmount.toFixed(4),
        ait_amount: aitAmount.toFixed(4),
        cogs: cogs.toFixed(4),
        gross_profit: grossProfit.toFixed(4),
      };
    });

    const invoiceDiscountAmt = parseFloat(formData.invoice_discount_amt) || 0;
    const grandTotal = totalTaxableAmount + (formData.vat_mode === 'exclusive' ? totalVat : 0) - invoiceDiscountAmt;
    const totalGrossProfit = totalTaxableAmount - items.reduce((acc, item) => acc + parseFloat(item.cogs), 0);

    return {
      items,
      totals: {
        subtotal: subtotal.toFixed(2),
        totalTradeDiscount: totalTradeDiscount.toFixed(2),
        totalLineDiscount: totalLineDiscount.toFixed(2),
        totalTaxableAmount: totalTaxableAmount.toFixed(2),
        totalVat: totalVat.toFixed(2),
        totalAit: totalAit.toFixed(2),
        invoiceDiscountAmt: invoiceDiscountAmt.toFixed(2),
        grandTotal: grandTotal.toFixed(2),
        totalGrossProfit: totalGrossProfit.toFixed(2),
      }
    };
  }, [formData, settings]);

  return calculatedData;
};
