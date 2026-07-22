# Purchase Bill Module — Enhancement Prompt
# (Mirror of EnhancedSalesInvoiceForm.jsx pattern)

## CRITICAL INSTRUCTIONS — Read before writing any code

1. The existing `PurchaseBillForm.jsx` must be **refactored to mirror `EnhancedSalesInvoiceForm.jsx`** exactly in architecture, patterns, and logic — while keeping purchase-specific fields (Vendor, Due Date, Supplier Ref No, Save as Draft).

2. **Study these existing files before writing any code:**
   - `EnhancedSalesInvoiceForm.jsx` — mirror its exact architecture
   - `useSalesCalculations` hook — find it at `@/hooks/useSalesCalculations` and read it first, then create `usePurchaseCalculations` following the exact same pattern (same export structure, same return shape: `{ items: calculatedItems, totals }`, same useMemo pattern)
   - `PurchaseBillForm.jsx` — keep its existing UI style (shadcn/ui components, dark mode classes)
   - `purchase.js` — keep all existing functions, only update payload mapping
   - `PurchaseBillController.php` — keep structure, enhance PurchaseService
   - `SalesInvoiceController.php` — mirror its patterns for purchase controller

3. **Architecture to mirror from Sales:**
   - Single `formData` state object (same structure as sales formData)
   - Separate `usePurchaseCalculations(formData, settings)` hook
   - Separate handlers: `handleProductChange`, `handlePurchaseUomChange`, `handlePriceUomChange`, `handleItemFieldChange`
   - `settings` state fetched from API on mount
   - `accounts` state for chart of accounts dropdown
   - Column visibility controlled by settings

4. **Keep from existing PurchaseBillForm.jsx:**
   - shadcn/ui components (Button, Card, CardHeader, CardContent, CardFooter, Input, Select, Label, Textarea, DatePicker)
   - Dark mode Tailwind classes
   - Due Date field
   - Save as Draft + Save Bill buttons
   - Vendor selector (keep name "vendor", not "supplier")
   - `fetchVendors()` API call

5. All backend writes in a single database transaction.

6. The following tables already exist — do NOT recreate:
   - `products` (has: `weighted_avg_cost`, `current_stock_in_base_uom`, `vat_rate`, `ait_rate`)
   - `product_uoms` (has: `conversion_factor`, `is_base_uom`, `is_default_sale_uom`, `sale_price`)
   - `units_of_measure`, `inventory_ledger`, `journal_entries`, `chart_of_accounts`
   - `company_settings` (key-value table)
   - `purchase_bills`, `purchase_bill_items` (existing columns must be kept)

---

## PART 1 — DATABASE MIGRATIONS

### 1A. Add columns to `purchase_bills`:
```
supplier_ref_no              varchar(100)   nullable
vat_mode                     enum('exclusive','inclusive')  default 'exclusive'
trade_discount_amt           decimal(15,4)  default 0
line_discount_amt            decimal(15,4)  default 0
taxable_amount               decimal(15,4)  default 0
vat_amount                   decimal(15,4)  default 0
ait_amount                   decimal(15,4)  default 0
bill_discount_amt            decimal(15,4)  default 0
bill_discount_account_id     bigint         nullable  FK → chart_of_accounts
payment_status               enum('unpaid','partial','paid')  default 'unpaid'
```

### 1B. Add columns to `purchase_bill_items`:
```
purchase_uom_id          bigint         FK → product_uoms  (replaces qty_unit_id)
price_uom_id             bigint         FK → product_uoms  (replaces rate_unit_id)
quantity_in_purchase_uom decimal(15,4)
quantity_in_base_uom     decimal(15,4)
unit_price_original      decimal(15,4)
trade_discount_pct       decimal(5,2)   default 0
trade_discount_amt       decimal(15,4)  default 0
net_unit_price           decimal(15,4)
line_gross_amount        decimal(15,4)
line_discount_pct        decimal(5,2)   default 0
line_discount_amt        decimal(15,4)  default 0
line_subtotal            decimal(15,4)
vat_rate                 decimal(5,2)   default 0
vat_amount               decimal(15,4)  default 0
ait_rate                 decimal(5,2)   default 0
ait_amount               decimal(15,4)  default 0
net_unit_cost            decimal(15,4)
weighted_avg_cost_before decimal(15,4)
weighted_avg_cost_after  decimal(15,4)
```

### 1C. Add to `company_settings` (seeder):
```
is_vat_registered              → true
purchase_show_price_uom        → true
purchase_show_trade_discount   → true
purchase_show_line_discount    → true
purchase_show_vat              → true
purchase_show_ait              → true
```

### 1D. Add indexes:
```sql
purchase_bills:       INDEX(vendor_id), INDEX(bill_date), INDEX(payment_status)
purchase_bill_items:  INDEX(bill_id), INDEX(product_id)
inventory_ledger:     INDEX(product_id), INDEX(reference_id, reference_type)
```

---

## PART 2 — `usePurchaseCalculations` Hook
### Exact mirror of `useSalesCalculations` — same structure, same return shape, purchase-side logic only

The existing `useSalesCalculations` hook is:

```javascript
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
      const saleUom = item.saleUom || { conversion_factor: 1 };
      const priceUom = item.priceUom || { conversion_factor: 1 };
      const pricePerBaseUnit = unitPrice / priceUom.conversion_factor;
      const unitPriceOriginal = pricePerBaseUnit * saleUom.conversion_factor;
      const lineGrossAmount = quantity * unitPriceOriginal;
      const tradeDiscountPct = parseFloat(item.trade_discount_pct) || 0;
      const tradeDiscountAmt = lineGrossAmount * (tradeDiscountPct / 100);
      const netUnitPrice = unitPriceOriginal * (1 - tradeDiscountPct / 100);
      const amountAfterTradeDiscount = lineGrossAmount - tradeDiscountAmt;
      let lineDiscountAmt = parseFloat(item.line_discount_amt) || 0;
      const lineDiscountPct = parseFloat(item.line_discount_pct) || 0;
      if (item.discount_type === 'percentage' || (!item.line_discount_amt && lineDiscountPct > 0)) {
        lineDiscountAmt = amountAfterTradeDiscount * (lineDiscountPct / 100);
      }
      const lineSubtotal = amountAfterTradeDiscount - lineDiscountAmt;
      const vatRate = parseFloat(item.vat_rate) || 0;
      const aitRate = parseFloat(item.ait_rate) || 0;
      let vatAmount = 0;
      if (formData.vat_mode === 'inclusive') {
        vatAmount = (lineSubtotal * vatRate) / (100 + vatRate);
      } else {
        vatAmount = lineSubtotal * (vatRate / 100);
      }
      const aitAmount = lineSubtotal * (aitRate / 100);
      const avgCost = parseFloat(item.weighted_avg_cost) || 0;
      const qtyInBase = quantity * saleUom.conversion_factor;
      const cogs = qtyInBase * avgCost;
      const grossProfit = lineSubtotal - cogs;
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
```

### Create `usePurchaseCalculations.js` with these EXACT changes from sales:

1. **Export name:** `usePurchaseCalculations` (not useSalesCalculations)
2. **UOM field names:** `purchaseUom` instead of `saleUom` (same logic)
3. **Remove:** `cogs`, `grossProfit`, `totalGrossProfit` — not needed on purchase side
4. **Add:** `net_unit_cost` per item — calculated as:
   ```javascript
   const qtyInBase = quantity * purchaseUom.conversion_factor;
   let netUnitCost = 0;
   if (settings.is_vat_registered) {
     netUnitCost = qtyInBase > 0 ? lineSubtotal / qtyInBase : 0;
   } else {
     netUnitCost = qtyInBase > 0 ? (lineSubtotal + vatAmount) / qtyInBase : 0;
   }
   ```
5. **Grand total formula (purchase side):**
   ```javascript
   const billDiscountAmt = parseFloat(formData.bill_discount_amt) || 0;
   const grandTotal = totalTaxableAmount + (formData.vat_mode === 'exclusive' ? totalVat : 0) - totalAit - billDiscountAmt;
   ```
   Note: AIT is subtracted (liability deducted from payable) — opposite of sales
6. **Return totals:** replace `invoiceDiscountAmt` with `billDiscountAmt`, remove `totalGrossProfit`
7. **Everything else:** identical to useSalesCalculations

---

## PART 3 — `PurchaseBillForm.jsx` Refactor
### Mirror EnhancedSalesInvoiceForm.jsx architecture exactly

### 3A. State structure (mirror sales formData pattern):
```javascript
const [formData, setFormData] = useState({
    vendor_id: '',
    bill_date: new Date().toISOString().split('T')[0],
    due_date: '',
    supplier_ref_no: '',
    vat_mode: 'exclusive',
    bill_discount_amt: 0,
    bill_discount_account_id: '',
    notes: '',
    items: [{
        product_id: '',
        purchase_uom_id: '',
        price_uom_id: '',
        quantity: 1,
        unit_price: 0,
        trade_discount_pct: 0,
        line_discount_pct: 0,
        line_discount_amt: 0,
        vat_rate: 0,
        ait_rate: 0,
        // Helper fields:
        purchaseUom: null,
        priceUom: null,
        productUoms: [],
    }]
});

const [settings, setSettings] = useState({
    purchase_show_price_uom: true,
    purchase_show_trade_discount: true,
    purchase_show_line_discount: true,
    purchase_show_vat: true,
    purchase_show_ait: true,
    is_vat_registered: true,
});

const [products, setProducts] = useState([]);
const [vendors, setVendors] = useState([]);
const [accounts, setAccounts] = useState([]);

const { items: calculatedItems, totals } = usePurchaseCalculations(formData, settings);
```

### 3B. Data loading (mirror sales loadData pattern):
```javascript
const loadData = async () => {
    const [productsData, vendorsData, settingsRes, accountsRes] = await Promise.all([
        fetchProducts(),
        fetchVendors(),
        server.get('/settings/purchase-form-config'),
        server.get('/chart-accounts/options'),
    ]);
    // Set states — same pattern as EnhancedSalesInvoiceForm
};
```

### 3C. Handlers (mirror sales handlers exactly):

**handleProductChange(index, productId):**
- Find product from products list
- Find defaultUom where `is_default_sale_uom = true` OR first UOM
- Set both `purchase_uom_id` AND `price_uom_id` to defaultUom.id
- Set `unit_price` from defaultUom.sale_price
- Set `vat_rate` from product.vat_rate
- Set `ait_rate` from product.ait_rate

**handlePurchaseUomChange(index, uomId):**
- Set `purchase_uom_id` to new uomId
- Set `price_uom_id` to same uomId (mirrors sale UOM behavior)
- Set `unit_price` from new uom's sale_price

**handlePriceUomChange(index, uomId):**
- Set only `price_uom_id` (independent override)
- Set `unit_price` from new uom's sale_price

**handleItemFieldChange(index, field, value):**
- Generic field update — same as sales

### 3D. Line items table columns (using shadcn/ui — keep existing UI style):

| Column | Hideable? | Notes |
|--------|-----------|-------|
| Product | No | shadcn Select |
| Qty | No | shadcn Input |
| Purchase UOM | No | shadcn Select from productUoms |
| Price UOM | Yes — `purchase_show_price_uom` | shadcn Select, mirrors Qty UOM by default |
| Rate | No | shadcn Input, auto-filled from price UOM |
| Trade Discount % | Yes — `purchase_show_trade_discount` | shadcn Input |
| Net Unit Price | No | read-only, auto-calculated |
| Line Discount % | Yes — `purchase_show_line_discount` | shadcn Input |
| Line Subtotal | No | read-only, auto-calculated |
| VAT Rate % | Yes — `purchase_show_vat` | shadcn Input, auto-filled from product |
| VAT Amount | Yes — `purchase_show_vat` | read-only |
| AIT Rate % | Yes — `purchase_show_ait` | shadcn Input |
| AIT Amount | Yes — `purchase_show_ait` | read-only |
| Net Unit Cost | No | read-only, shows what goes into WAC |
| Delete | No | Trash2 icon button |

### 3E. Bill Header (keep existing shadcn UI style, add new fields):
```
Row 1: Vendor selector | Bill Date (DatePicker) | Due Date (DatePicker)
Row 2: Bill Number (auto, editable) | Supplier Ref No (optional) | VAT Mode toggle
```

### 3F. Summary section (mirror sales summary exactly — replace existing):
```
Gross Subtotal:        [sum of line_gross_amounts]
Trade Discount (-):    [shown if purchase_show_trade_discount]
Line Discount (-):     [shown if purchase_show_line_discount]
──────────────────────────────────────
Taxable Amount:        [sum of line_subtotals]
Input VAT (+):         [shown if purchase_show_vat]
AIT Payable (-):       [shown if purchase_show_ait]
──────────────────────────────────────
Bill Discount (-):     [Input amount] + [Select account from accounts list]
Grand Total:           [final amount]
```

### 3G. Footer buttons (keep existing shadcn Button style):
- Cancel button
- Save as Draft button (same as existing)
- Save Bill button (same as existing)

---

## PART 4 — Update `purchase.js` Service

Keep all existing functions. Update `toPurchaseBillPayload`:

```javascript
const toPurchaseBillPayload = (data = {}) => ({
    vendor_id: Number(data.vendor_id) || null,
    bill_no: data.billNumber?.trim() || '',
    bill_date: data.bill_date || null,
    due_date: data.due_date || null,
    supplier_ref_no: data.supplier_ref_no?.trim() || null,
    vat_mode: data.vat_mode || 'exclusive',
    bill_discount_amt: Number(data.bill_discount_amt) || 0,
    bill_discount_account_id: data.bill_discount_account_id || null,
    notes: data.notes?.trim() || '',
    items: (data.items || []).map(item => ({
        product_id: Number(item.product_id) || null,
        purchase_uom_id: Number(item.purchase_uom_id) || null,
        price_uom_id: Number(item.price_uom_id) || null,
        quantity_in_purchase_uom: Number(item.quantity) || 0,
        unit_price_original: Number(item.unit_price) || 0,
        trade_discount_pct: Number(item.trade_discount_pct) || 0,
        line_discount_pct: Number(item.line_discount_pct) || 0,
        line_discount_amt: Number(item.line_discount_amt) || 0,
        vat_rate: Number(item.vat_rate) || 0,
        ait_rate: Number(item.ait_rate) || 0,
    }))
});
```

Add new function:
```javascript
export async function fetchPurchaseFormConfig() {
    const res = await server.get('/settings/purchase-form-config');
    return responseData(res);
}
```

---

## PART 5 — Backend: `PurchaseService.php` Enhancement
### Mirror SalesInvoiceService pattern

The `createBill()` method — all inside ONE DB transaction:

```
1. Save purchase_bills record

2. For each line item (sequential — NOT batch):
   a. Get product: weighted_avg_cost, current_stock_in_base_uom
   b. Get UOM conversion factors from product_uoms
   c. Calculate all amounts (same logic as usePurchaseCalculations hook)
   d. Calculate net_unit_cost:
      - if is_vat_registered: net_unit_cost = line_subtotal / qty_in_base
      - else: net_unit_cost = (line_subtotal + vat_amount) / qty_in_base
   e. Calculate new WAC:
      new_avg = (old_stock × old_avg + qty_in_base × net_unit_cost)
                / (old_stock + qty_in_base)
   f. Save purchase_bill_items with before/after WAC
   g. UPDATE products.weighted_avg_cost = new_avg
   h. UPDATE products.current_stock_in_base_uom += qty_in_base
   i. INSERT inventory_ledger row:
      (product_id, reference_id=bill.id, reference_type='purchase',
       qty_in=qty_in_base, qty_out=0, qty_balance=new_stock,
       unit_cost=net_unit_cost, total_cost=qty×cost,
       new_weighted_avg_cost=new_avg)

3. Generate journal_entries:
   IF is_vat_registered:
     Dr. Inventory/Stock A/C    [line_subtotal]
     Dr. Input VAT Receivable   [vat_amount]
         Cr. Accounts Payable       [line_subtotal + vat - ait]
         Cr. AIT Payable (NBR)      [ait_amount]  ← only if > 0
   ELSE:
     Dr. Inventory/Stock A/C    [line_subtotal + vat_amount]
         Cr. Accounts Payable       [line_subtotal + vat - ait]
         Cr. AIT Payable (NBR)      [ait_amount]  ← only if > 0

4. If bill_discount_amt > 0:
   Dr. Accounts Payable         [bill_discount_amt]
       Cr. Purchase Discount A/C    [bill_discount_amt]

5. Commit. Any failure → rollback all.
```

### Add new API endpoint (mirror sales settings endpoint):
```
GET /api/settings/purchase-form-config
→ returns: {
    purchase_show_price_uom, purchase_show_trade_discount,
    purchase_show_line_discount, purchase_show_vat,
    purchase_show_ait, is_vat_registered
  }
```

---

## PART 6 — Business Rules

1. Trade discount → never posted, reduces price only
2. Line discount → reduces inventory cost (WAC uses net after line discount)
3. Bill discount → "Purchase Discount" Contra Expense account, does NOT change inventory cost
4. is_vat_registered=true → WAC excludes VAT, Input VAT = asset
5. is_vat_registered=false → WAC includes VAT, no separate Input VAT entry
6. AIT on purchase → always liability (AIT Payable to NBR)
7. WAC update is sequential per line item — each affects the next
8. Store weighted_avg_cost_before and _after per line for audit trail
9. Bill discount does not affect VAT — VAT locked at line level
10. Soft delete only — never hard delete

---

## PART 7 — Deliverables (in this order)

1. Migration: add columns to purchase_bills
2. Migration: add columns to purchase_bill_items
3. Migration: add indexes
4. Seeder: company_settings new keys
5. `usePurchaseCalculations.js` hook (mirror useSalesCalculations)
6. `PurchaseBillForm.jsx` refactored (mirror EnhancedSalesInvoiceForm architecture, keep shadcn/ui style)
7. Updated `purchase.js` (keep all functions, update payload)
8. Enhanced `PurchaseService.php` createBill() with WAC + journal entries
9. New API endpoint: GET /api/settings/purchase-form-config
