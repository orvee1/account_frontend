import formatProductForDisplay from './components/products/utilis/formatProductForDisplay.js';

const product = {
  id: 17,
  company_id: 1,
  product_type: 'Stock',
  name: 'mouse 123',
  sku: null,
  barcode: null,
  category_id: null,
  brand_id: null,
  warehouse_id: 1,
  unit: null,
  costing_price: '500.0000',
  sales_price: '0.0000',
  tax_percent: null,
  has_warranty: false,
  warranty_days: 0,
  manufactured_at: null,
  expired_at: null,
  description: null,
  status: 'active',
  created_by: 1,
  updated_by: null,
  meta: null,
  created_at: '2026-08-05T12:20:49.000000Z',
  updated_at: '2026-08-05T12:20:49.000000Z',
  base_uom_id: 1,
  weighted_avg_cost: '0.0000',
  current_stock_in_base_uom: '0.0000',
  vat_rate: '0.00',
  vat_inclusive: false,
  ait_rate: '0.00',
  units: [],
  product_uoms: [
    {
      id: 4,
      product_id: 17,
      uom_id: 1,
      conversion_factor: '1.000000',
      sale_price: '0.0000',
      is_base_uom: 1,
      is_default_sale_uom: 1,
      created_at: '2026-08-05T12:20:49.000000Z',
      updated_at: '2026-08-05T12:20:49.000000Z',
      uom: {
        id: 1,
        name: 'Piece',
        symbol: 'pcs',
        created_at: '2026-08-05T00:00:03.000000Z',
        updated_at: '2026-08-05T00:00:03.000000Z'
      }
    }
  ],
  base_uom: {
    id: 1,
    name: 'Piece',
    symbol: 'pcs',
    created_at: '2026-08-05T00:00:03.000000Z',
    updated_at: '2026-08-05T00:00:03.000000Z'
  },
  stocks: [
    {
      id: 13,
      company_id: 1,
      product_id: 17,
      warehouse_id: 1,
      quantity_on_hand: '200.0000',
      avg_cost: '500.0000',
      created_at: '2026-08-05T12:20:49.000000Z',
      updated_at: '2026-08-05T12:20:49.000000Z'
    }
  ]
};

const result = formatProductForDisplay(product);
console.log(JSON.stringify(result, null, 2));
