import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Save, PlusCircle, Trash2 } from 'lucide-react';
import Select from 'react-select';
import axios from 'axios';
import { toDateInput } from '@/utils/accounting-date.mjs';

const API_BASE = '/api/backend';

const selectPortalProps = {
  menuPortalTarget: typeof window !== 'undefined' ? document.body : null,
  styles: {
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
  },
  menuPosition: 'fixed',
};

const EMPTY_UNIT = () => ({
  id: crypto.randomUUID(),
  name: '',
  factor: 1,
  isBase: false,
});

const EMPTY_COMBO = () => ({
  id: '',
  name: '',
  comboQuantity: 1,
  uid: crypto.randomUUID(),
});

const isTruthyFlag = (value) =>
  value === true ||
  value === 1 ||
  value === '1' ||
  String(value).toLowerCase() === 'true';

const makeBaseProductUom = (salePrice = 0, overrides = {}) => ({
  uid: overrides.uid ?? crypto.randomUUID(),
  uom_id: overrides.uom_id ?? '',
  name: overrides.name || 'Piece',
  symbol: overrides.symbol ?? 'pcs',
  conversion_factor: 1,
  sale_price: Number(overrides.sale_price ?? salePrice ?? 0),
  is_base_uom: true,
  is_default_sale_uom: true,
});

const hasUsefulUomData = (uom) =>
  Boolean(uom?.uom_id) ||
  Boolean(String(uom?.name ?? '').trim()) ||
  Boolean(String(uom?.symbol ?? '').trim());

const normalizeProductUoms = (uoms = [], fallbackSalePrice = 0) => {
  const rows = (Array.isArray(uoms) ? uoms : [])
    .filter(hasUsefulUomData)
    .map((uom) => ({
      ...uom,
      uid: uom.uid ?? crypto.randomUUID(),
      name: String(uom.name ?? '').trim(),
      symbol: String(uom.symbol ?? '').trim(),
      conversion_factor: Number(uom.conversion_factor || 0),
      sale_price: Number(uom.sale_price ?? fallbackSalePrice ?? 0),
      is_base_uom: isTruthyFlag(uom.is_base_uom),
      is_default_sale_uom: isTruthyFlag(uom.is_default_sale_uom),
    }));

  if (rows.length === 0) {
    return [makeBaseProductUom(fallbackSalePrice)];
  }

  const foundBaseIndex = rows.findIndex((uom) => uom.is_base_uom);
  const baseIndex = foundBaseIndex >= 0 ? foundBaseIndex : 0;

  const foundDefaultIndex = rows.findIndex(
    (uom) => uom.is_default_sale_uom
  );

  const defaultIndex =
    foundDefaultIndex >= 0 ? foundDefaultIndex : baseIndex;

  return rows.map((uom, index) => ({
    ...uom,
    conversion_factor:
      index === baseIndex ? 1 : uom.conversion_factor,
    is_base_uom: index === baseIndex,
    is_default_sale_uom: index === defaultIndex,
  }));
};

const Section = ({ title, hint, children }) => (
  <div className="rounded-xl border bg-white/80 shadow-sm backdrop-blur-sm p-4 md:p-5 space-y-4">
    <div className="flex items-start justify-between">
      <div>
        <h3 className="text-sm font-semibold tracking-wide text-slate-700 uppercase">
          {title}
        </h3>

        {hint && (
          <p className="text-xs text-slate-500 mt-1">
            {hint}
          </p>
        )}
      </div>
    </div>

    <div className="space-y-3">
      {children}
    </div>
  </div>
);

export default function AddProductForm({
  onSave,
  onCancel,
  initialData,
  isEditMode = false,
  categories = [],
  brands = [],
  warehouses = [],
  products = [],
}) {
  const { toast } = useToast();

  const [uoms, setUoms] = useState([]);

  useEffect(() => {
    const fetchUoms = async () => {
      try {
        const resp = await axios.get(
          `${API_BASE}/units-of-measure`,
          {
            headers: {
              Accept: 'application/json',
            },
          }
        );

        setUoms(resp.data || []);
      } catch (e) {
        console.error('Failed to fetch UOMs', e);
      }
    };

    fetchUoms();
  }, []);

  // ============================================================
  // Normalize incoming data
  // ============================================================

  const init = useMemo(() => {
    const d = initialData || {};

    const get = (a, b, fallback = '') =>
      d?.[a] ?? d?.[b] ?? fallback;

    const productType = get(
      'productType',
      'product_type',
      'Stock'
    );

    const unitsIn = (d?.units ?? []).map((u) => ({
      id: u.id ?? crypto.randomUUID(),
      name: u.name ?? '',
      factor: Number(u.factor ?? 1),
      isBase: !!(
        u.isBase ??
        (u.is_base === 1 || u.is_base === true)
      ),
    }));

    const productUomsIn = (d?.product_uoms ?? []).map(
      (u) => ({
        uid: crypto.randomUUID(),
        uom_id: u.uom_id ?? '',
        name: u.uom?.name ?? u.name ?? '',
        symbol: u.uom?.symbol ?? u.symbol ?? '',
        conversion_factor: u.conversion_factor,
        sale_price: u.sale_price,
        is_base_uom: isTruthyFlag(u.is_base_uom),
        is_default_sale_uom: isTruthyFlag(
          u.is_default_sale_uom
        ),
      })
    );

    const salesPriceValue = Number(
      get('salesPrice', 'sales_price', 0)
    );

    const normalizedProductUoms = normalizeProductUoms(
      productUomsIn,
      salesPriceValue
    );

    return {
      id: get(
        'id',
        'id',
        isEditMode
          ? undefined
          : `prod-${Date.now()}`
      ),

      productType,

      name: get('name', 'name', ''),
      sku: get('sku', 'sku', ''),
      barcode: get('barcode', 'barcode', ''),
      description: get(
        'description',
        'description',
        ''
      ),

      manufacturingDate: get(
        'manufactured_at',
        'manufactured_at',
        ''
      ),

      expiryDate: get(
        'expired_at',
        'expired_at',
        ''
      ),

      category_id: d?.category_id ?? null,
      brand_id: d?.brand_id ?? null,

      costingPrice: Number(
        get(
          'costingPrice',
          'costing_price',
          0
        )
      ),

      salesPrice: salesPriceValue,

      openingQuantity: Number(
        get(
          'openingQuantity',
          'opening_quantity',
          0
        )
      ),

      // --------------------------------------------------------
      // NEW: Opening stock date
      // --------------------------------------------------------
      openingDate: get(
        'openingDate',
        'opening_date',
        toDateInput()
      ),

      hasWarranty: !!(
        d?.has_warranty ?? false
      ),

      warrantyDays: Number(
        d?.warranty_days ?? 0
      ),

      units:
        unitsIn.length > 0
          ? unitsIn
          : [EMPTY_UNIT()],

      baseUnitName: get(
        'baseUnitName',
        'base_unit_name',
        ''
      ),

      vat_rate: d?.vat_rate ?? 0,
      vat_inclusive: !!d?.vat_inclusive,
      ait_rate: d?.ait_rate ?? 0,

      base_uom_id:
        d?.base_uom_id ?? null,

      product_uoms:
        normalizedProductUoms,

      comboItems: (
        d?.comboItems ??
        d?.combo_items ??
        []
      ).map((ci) => ({
        id:
          ci.id ??
          ci.product_id ??
          '',

        name:
          ci.name ??
          '',

        comboQuantity: Number(
          ci.comboQuantity ??
          ci.quantity ??
          1
        ),

        uid:
          ci.uid ??
          ci.id ??
          ci.product_id ??
          crypto.randomUUID(),
      })),

      warehouse_id:
        d?.warehouse_id ?? null,

      canEditCostingPrice:
        d?.canEditCostingPrice ??
        d?.can_edit_costing_price ??
        true,
    };
  }, [initialData, isEditMode]);

  // ============================================================
  // UI state
  // ============================================================

  const [productType, setProductType] =
    useState(init.productType);

  const [name, setName] =
    useState(init.name);

  const [sku, setSku] =
    useState(init.sku);

  const [barcode, setBarcode] =
    useState(init.barcode);

  const [description, setDescription] =
    useState(init.description);

  const [
    manufacturingDate,
    setManufacturingDate,
  ] = useState(init.manufacturingDate);

  const [
    expiryDate,
    setExpiryDate,
  ] = useState(init.expiryDate);

  const [
    categoryId,
    setCategoryId,
  ] = useState(init.category_id);

  const [
    brandId,
    setBrandId,
  ] = useState(init.brand_id);

  const [
    costingPrice,
    setCostingPrice,
  ] = useState(init.costingPrice);

  const [
    salesPrice,
    setSalesPrice,
  ] = useState(init.salesPrice);

  const [
    openingQuantity,
    setOpeningQuantity,
  ] = useState(init.openingQuantity);

  // ============================================================
  // NEW: Opening stock date state
  // ============================================================

  const [
    openingDate,
    setOpeningDate,
  ] = useState(init.openingDate);

  const [
    hasWarranty,
    setHasWarranty,
  ] = useState(init.hasWarranty);

  const [
    warrantyDays,
    setWarrantyDays,
  ] = useState(init.warrantyDays);

  const [
    vatRate,
    setVatRate,
  ] = useState(init.vat_rate);

  const [
    vatInclusive,
    setVatInclusive,
  ] = useState(init.vat_inclusive);

  const [
    aitRate,
    setAitRate,
  ] = useState(init.ait_rate);

  const [
    baseUomId,
    setBaseUomId,
  ] = useState(init.base_uom_id);

  const [
    productUoms,
    setProductUoms,
  ] = useState(init.product_uoms);

  const [
    units,
    setUnits,
  ] = useState(init.units);

  const [
    comboItems,
    setComboItems,
  ] = useState(init.comboItems);

  const [
    baseUnitName,
    setBaseUnitName,
  ] = useState(init.baseUnitName);

  const [
    warehouseId,
    setWarehouseId,
  ] = useState(init.warehouse_id);

  const [
    canEditCostingPrice,
    setCanEditCostingPrice,
  ] = useState(
    init.canEditCostingPrice
  );

  const [
    serverErrors,
    setServerErrors,
  ] = useState({});

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  // ============================================================
  // Default at least one combo row
  // ============================================================

  useEffect(() => {
    if (
      productType === 'Combo' &&
      comboItems.length === 0
    ) {
      setComboItems([
        EMPTY_COMBO(),
      ]);
    }
  }, [
    productType,
    comboItems.length,
  ]);

  // ============================================================
  // Build API payload
  // ============================================================

  const toApiPayload = () => {
    const normalizedProductUoms =
      normalizeProductUoms(
        productUoms,
        salesPrice
      );

    const openingQty =
      Number(openingQuantity || 0);

    const hasOpeningStock =
      productType === 'Stock' &&
      !isEditMode &&
      openingQty > 0;

    return {
      id: init.id,

      product_type:
        productType,

      name,

      sku:
        sku || null,

      barcode:
        barcode || null,

      description,

      category_id:
        categoryId
          ? Number(categoryId)
          : null,

      brand_id:
        brandId
          ? Number(brandId)
          : null,

      costing_price:
        Number(costingPrice || 0),

      sales_price:
        Number(salesPrice || 0),

      vat_rate:
        Number(vatRate || 0),

      vat_inclusive:
        vatInclusive ? 1 : 0,

      ait_rate:
        Number(aitRate || 0),

      base_uom_id:
        baseUomId
          ? Number(baseUomId)
          : null,

      product_uoms:
        normalizedProductUoms.map(
          (u) => ({
            uom_id:
              u.uom_id || null,

            name:
              u.name,

            symbol:
              u.symbol,

            conversion_factor:
              Number(
                u.conversion_factor
              ),

            sale_price:
              Number(
                u.sale_price
              ),

            is_base_uom:
              u.is_base_uom
                ? 1
                : 0,

            is_default_sale_uom:
              u.is_default_sale_uom
                ? 1
                : 0,
          })
        ),

      has_warranty:
        hasWarranty
          ? 1
          : 0,

      warranty_days:
        Number(
          warrantyDays || 0
        ),

      // ========================================================
      // Opening stock
      // ========================================================

      opening_quantity:
        productType === 'Stock' &&
          !isEditMode
          ? openingQty
          : null,

      /*
       * Opening unit cost is explicitly sent so backend
       * opening-stock valuation does not need to infer it.
       *
       * For the Excel test plan:
       * Keyboard:
       * 10 x 500 = 5,000 opening inventory.
       */
      opening_unit_cost:
        hasOpeningStock
          ? Number(
            costingPrice || 0
          )
          : null,

      /*
       * Historical accounting date used by:
       * - opening StockMovement
       * - InventoryLedger
       * - Opening Balance journal
       */
      opening_date:
        hasOpeningStock
          ? openingDate
          : null,

      manufactured_at:
        manufacturingDate ||
        null,

      expired_at:
        expiryDate ||
        null,

      warehouse_id:
        warehouseId
          ? Number(warehouseId)
          : null,

      status:
        'active',
    };
  };

  // ============================================================
  // Submit
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setServerErrors({});

    // ==========================================================
    // Client-side opening-stock validation
    // ==========================================================

    const validationErrors = {};

    const openingQty =
      Number(openingQuantity || 0);

    const openingCost =
      Number(costingPrice || 0);

    if (
      productType === 'Stock' &&
      !isEditMode &&
      openingQty > 0
    ) {
      if (!warehouseId) {
        validationErrors.warehouse_id = [
          'Warehouse is required when opening quantity is greater than zero.',
        ];
      }

      if (
        !Number.isFinite(
          openingCost
        ) ||
        openingCost <= 0
      ) {
        validationErrors.opening_unit_cost = [
          'Costing Price must be greater than zero when opening stock exists.',
        ];
      }

      if (!openingDate) {
        validationErrors.opening_date = [
          'Opening Stock Date is required when opening quantity is greater than zero.',
        ];
      }
    }

    if (
      Object.keys(
        validationErrors
      ).length > 0
    ) {
      setServerErrors(
        validationErrors
      );

      toast({
        title:
          'Opening stock information required',

        description:
          'Please provide the required opening stock information.',

        variant:
          'destructive',
      });

      return;
    }

    setSubmitting(true);

    try {
      const apiPayload =
        toApiPayload();

      const resp =
        await onSave(
          apiPayload,
          isEditMode
        );

      if (!resp?.ok) {
        setServerErrors(
          resp?.errors ||
          resp?.data?.errors ||
          {}
        );

        return;
      }

      toast({
        title:
          `Product ${isEditMode
            ? 'Updated'
            : 'Created'
          }`,

        description:
          `${name} has been ${isEditMode
            ? 'updated'
            : 'created'
          } successfully.`,
      });

      onCancel();
    } catch (e) {
      console.error(e);

      toast({
        title:
          'Unable to save product',

        description:
          'An unexpected error occurred while saving the product.',

        variant:
          'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // Select options
  // ============================================================

  const categoryOptions =
    (categories || []).map(
      (c) => ({
        value: c.id,
        label: c.name,
      })
    );

  const brandOptions =
    (brands || []).map(
      (b) => ({
        value: b.id,
        label: b.name,
      })
    );

  const warehouseOptions =
    (warehouses || []).map(
      (w) => ({
        value: w.id,
        label: w.name,
      })
    );

  const stockProductOptions =
    useMemo(
      () =>
        (products || [])
          .filter(
            (p) =>
              (
                p.product_type ??
                p.productType
              ) === 'Stock'
          )
          .map((p) => ({
            value: p.id,
            label:
              `${p.name}${p.sku
                ? ` (${p.sku})`
                : ''
              }`,
          })),
      [products]
    );

  // ============================================================
  // Render
  // ============================================================

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-h-[85vh] overflow-y-auto pr-2"
    >
      {/* =======================================================
          Validation errors
      ======================================================== */}

      {serverErrors &&
        Object.keys(
          serverErrors
        ).length > 0 && (
          <div className="rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm p-4 shadow-sm">
            <div className="font-semibold mb-1">
              Please fix the errors below:
            </div>

            <ul className="list-disc pl-5 space-y-0.5">
              {Object.entries(
                serverErrors
              ).map(
                ([k, v]) => (
                  <li key={k}>
                    {Array.isArray(v)
                      ? v[0]
                      : String(v)}
                  </li>
                )
              )}
            </ul>
          </div>
        )}

      {/* =======================================================
          Type & Codes
      ======================================================== */}

      <Section
        title="Type & Codes"
        hint="Choose what you are creating and add quick identifiers."
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <Label className="mb-1 block">
              Product/Service Type
              <span className="text-red-500">
                *
              </span>
            </Label>

            <Select
              options={[
                {
                  value: 'Stock',
                  label: 'Stock',
                },
                {
                  value: 'Non-stock',
                  label: 'Non-stock',
                },
                {
                  value: 'Service',
                  label: 'Service',
                },
                {
                  value: 'Combo',
                  label: 'Combo',
                },
              ]}
              {...selectPortalProps}
              isDisabled={
                isEditMode
              }
              value={{
                value:
                  productType,
                label:
                  productType,
              }}
              onChange={(opt) =>
                setProductType(
                  opt?.value
                )
              }
            />
          </div>

          <div>
            <Label className="mb-1 block">
              SKU
            </Label>

            <Input
              value={sku}
              onChange={(e) =>
                setSku(
                  e.target.value
                )
              }
              placeholder="SKU"
            />
          </div>

          <div>
            <Label className="mb-1 block">
              Barcode
            </Label>

            <Input
              value={barcode}
              onChange={(e) =>
                setBarcode(
                  e.target.value
                )
              }
              placeholder="Barcode"
            />
          </div>
        </div>
      </Section>

      {/* =======================================================
          Basics
      ======================================================== */}

      <Section
        title="Basics"
        hint="Core details customers and staff will see."
      >
        <div className="space-y-3">
          <div>
            <Label className="mb-1 block">
              Name
              <span className="text-red-500">
                *
              </span>
            </Label>

            <Input
              value={name}
              onChange={(e) =>
                setName(
                  e.target.value
                )
              }
              placeholder="Product name"
            />
          </div>

          <div>
            <Label className="mb-1 block">
              Description
            </Label>

            <Textarea
              value={description}
              onChange={(e) =>
                setDescription(
                  e.target.value
                )
              }
              rows={2}
            />
          </div>
        </div>
      </Section>

      {/* =======================================================
          Pricing & Inventory
      ======================================================== */}

      <Section
        title="Pricing & Inventory"
        hint="Where it lives and how it is priced."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block">
              Category
            </Label>

            <Select
              options={
                categoryOptions
              }
              {...selectPortalProps}
              value={
                categoryOptions.find(
                  (o) =>
                    o.value ===
                    categoryId
                ) || null
              }
              onChange={(opt) =>
                setCategoryId(
                  opt?.value ??
                  null
                )
              }
              isClearable
            />
          </div>

          <div>
            <Label className="mb-1 block">
              Brand
            </Label>

            <Select
              options={
                brandOptions
              }
              {...selectPortalProps}
              value={
                brandOptions.find(
                  (o) =>
                    o.value ===
                    brandId
                ) || null
              }
              onChange={(opt) =>
                setBrandId(
                  opt?.value ??
                  null
                )
              }
              isClearable
            />
          </div>

          {/* ===================================================
              Costing Price
          ==================================================== */}

          <div>
            <Label className="mb-1 block">
              Costing Price
              {productType ===
                'Stock' &&
                !isEditMode &&
                Number(
                  openingQuantity ||
                  0
                ) > 0 && (
                  <span className="text-red-500">
                    *
                  </span>
                )}
            </Label>

            <Input
              type="number"
              min="0"
              step="0.0001"
              value={
                costingPrice
              }
              onChange={(e) =>
                setCostingPrice(
                  e.target.value
                )
              }
              disabled={
                !canEditCostingPrice
              }
            />

            {!canEditCostingPrice &&
              isEditMode && (
                <p className="mt-1 text-xs text-amber-600">
                  This value is
                  locked because
                  the item has stock
                  quantity, stock
                  value, or
                  transaction
                  history.
                </p>
              )}

            {!isEditMode &&
              productType ===
              'Stock' &&
              Number(
                openingQuantity ||
                0
              ) > 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  This price will
                  also be used as the
                  opening inventory
                  unit cost.
                </p>
              )}
          </div>

          {/* ===================================================
              Sales Price
          ==================================================== */}

          <div>
            <Label className="mb-1 block">
              Base Sales Price
            </Label>

            <Input
              type="number"
              min="0"
              step="0.0001"
              value={salesPrice}
              onChange={(e) =>
                setSalesPrice(
                  e.target.value
                )
              }
            />
          </div>

          {/* ===================================================
              Stock-specific fields
          ==================================================== */}

          {productType ===
            'Stock' && (
              <>
                {/* Warehouse */}

                <div>
                  <Label className="mb-1 block">
                    Warehouse

                    {!isEditMode &&
                      Number(
                        openingQuantity ||
                        0
                      ) > 0 && (
                        <span className="text-red-500">
                          *
                        </span>
                      )}
                  </Label>

                  <Select
                    options={
                      warehouseOptions
                    }
                    {...selectPortalProps}
                    value={
                      warehouseOptions.find(
                        (o) =>
                          o.value ===
                          warehouseId
                      ) ||
                      null
                    }
                    onChange={(
                      opt
                    ) =>
                      setWarehouseId(
                        opt?.value ??
                        null
                      )
                    }
                    isClearable
                  />
                </div>

                {/* Opening Quantity */}

                {!isEditMode && (
                  <div>
                    <Label className="mb-1 block">
                      Opening
                      Quantity
                    </Label>

                    <Input
                      type="number"
                      min="0"
                      step="0.0001"
                      value={
                        openingQuantity
                      }
                      onChange={(
                        e
                      ) =>
                        setOpeningQuantity(
                          e.target
                            .value
                        )
                      }
                    />
                  </div>
                )}

                {/* ===============================================
                  NEW: Opening Stock Date
              ================================================ */}

                {!isEditMode &&
                  Number(
                    openingQuantity ||
                    0
                  ) > 0 && (
                    <div>
                      <Label className="mb-1 block">
                        Opening Stock
                        Date

                        <span className="text-red-500">
                          *
                        </span>
                      </Label>

                      <Input
                        type="date"
                        value={
                          openingDate
                        }
                        onChange={(
                          e
                        ) =>
                          setOpeningDate(
                            e.target
                              .value
                          )
                        }
                        required
                      />

                      <p className="mt-1 text-xs text-slate-500">
                        This date will
                        be used for the
                        opening stock
                        movement and
                        accounting
                        journal.
                      </p>
                    </div>
                  )}
              </>
            )}
        </div>
      </Section>

      {/* =======================================================
          VAT & Multi-UOM
      ======================================================== */}

      <Section
        title="VAT & Multi-UOM"
        hint="Set tax rates and additional units for sales."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="mb-1 block">
              VAT Rate (%)
            </Label>

            <Input
              type="number"
              value={vatRate}
              onChange={(e) =>
                setVatRate(
                  e.target.value
                )
              }
            />
          </div>

          <div>
            <Label className="mb-1 block">
              AIT Rate (%)
            </Label>

            <Input
              type="number"
              value={aitRate}
              onChange={(e) =>
                setAitRate(
                  e.target.value
                )
              }
            />
          </div>

          <div className="flex items-center gap-3 pt-5">
            <Switch
              checked={
                vatInclusive
              }
              onCheckedChange={
                setVatInclusive
              }
            />

            <span>
              Price is VAT
              Inclusive
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="font-semibold">
              Multi-UOM
              Configuration
            </Label>

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                setProductUoms(
                  (prev) => [
                    ...prev,

                    {
                      uid:
                        crypto.randomUUID(),

                      uom_id: '',

                      name: '',

                      symbol: '',

                      conversion_factor:
                        '',

                      sale_price:
                        salesPrice,

                      is_base_uom:
                        false,

                      is_default_sale_uom:
                        false,
                    },
                  ]
                )
              }
            >
              <PlusCircle
                size={14}
                className="mr-2"
              />

              Add UOM
            </Button>
          </div>

          <div className="space-y-3">
            {productUoms.map(
              (pu, idx) => (
                <div
                  key={pu.uid}
                  className="grid grid-cols-1 md:grid-cols-12 gap-2 border rounded-lg p-3 bg-slate-50 relative"
                >
                  {/* UOM Name */}

                  <div className="md:col-span-3">
                    <Label className="mb-1 block text-xs">
                      UOM Name
                    </Label>

                    <Input
                      value={
                        pu.name
                      }
                      onChange={(
                        e
                      ) =>
                        setProductUoms(
                          (
                            prev
                          ) =>
                            prev.map(
                              (
                                x,
                                i
                              ) =>
                                i ===
                                  idx
                                  ? {
                                    ...x,

                                    name:
                                      e
                                        .target
                                        .value,
                                  }
                                  : x
                            )
                        )
                      }
                      className="h-8"
                      placeholder="e.g. Piece"
                    />
                  </div>

                  {/* Symbol */}

                  <div className="md:col-span-1">
                    <Label className="mb-1 block text-xs">
                      Symbol
                    </Label>

                    <Input
                      value={
                        pu.symbol
                      }
                      onChange={(
                        e
                      ) =>
                        setProductUoms(
                          (
                            prev
                          ) =>
                            prev.map(
                              (
                                x,
                                i
                              ) =>
                                i ===
                                  idx
                                  ? {
                                    ...x,

                                    symbol:
                                      e
                                        .target
                                        .value,
                                  }
                                  : x
                            )
                        )
                      }
                      className="h-8"
                      placeholder="pcs"
                    />
                  </div>

                  {/* Conversion Factor */}

                  <div className="md:col-span-2">
                    <Label className="mb-1 block text-xs">
                      Factor
                    </Label>

                    <Input
                      type="number"
                      value={
                        pu.conversion_factor
                      }
                      readOnly={
                        pu.is_base_uom
                      }
                      onChange={(
                        e
                      ) =>
                        setProductUoms(
                          (
                            prev
                          ) =>
                            prev.map(
                              (
                                x,
                                i
                              ) =>
                                i ===
                                  idx
                                  ? {
                                    ...x,

                                    conversion_factor:
                                      e
                                        .target
                                        .value,
                                  }
                                  : x
                            )
                        )
                      }
                      className={`h-8 ${pu.is_base_uom
                          ? 'bg-slate-100 cursor-not-allowed'
                          : ''
                        }`}
                    />

                    {!pu.is_base_uom && (
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        1{' '}
                        {pu.name ||
                          'Unit'}{' '}
                        ={' '}
                        {pu.conversion_factor ||
                          '?'}{' '}
                        {productUoms.find(
                          (u) =>
                            u.is_base_uom
                        )
                          ?.name ||
                          'Base Unit'}
                      </p>
                    )}
                  </div>

                  {/* Sale Price */}

                  <div className="md:col-span-2">
                    <Label className="mb-1 block text-xs">
                      Sale Price
                    </Label>

                    <Input
                      type="number"
                      value={
                        pu.sale_price
                      }
                      onChange={(
                        e
                      ) =>
                        setProductUoms(
                          (
                            prev
                          ) =>
                            prev.map(
                              (
                                x,
                                i
                              ) =>
                                i ===
                                  idx
                                  ? {
                                    ...x,

                                    sale_price:
                                      e
                                        .target
                                        .value,
                                  }
                                  : x
                            )
                        )
                      }
                      className="h-8"
                    />
                  </div>

                  {/* Base */}

                  <div className="md:col-span-2 flex flex-col justify-center items-center gap-1">
                    <Label className="text-[10px] uppercase">
                      Base
                    </Label>

                    <div
                      className={`w-8 h-4 rounded-full flex items-center px-0.5 ${pu.is_base_uom
                          ? 'bg-primary'
                          : 'bg-slate-300'
                        } transition-colors cursor-not-allowed`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full bg-white transition-transform ${pu.is_base_uom
                            ? 'translate-x-4'
                            : 'translate-x-0'
                          }`}
                      />
                    </div>
                  </div>

                  {/* Default */}

                  <div className="md:col-span-1 flex flex-col justify-center items-center gap-1">
                    <Label className="text-[10px] uppercase">
                      Default
                    </Label>

                    <input
                      type="radio"
                      name="default_sale_uom"
                      checked={
                        pu.is_default_sale_uom
                      }
                      onChange={() =>
                        setProductUoms(
                          (
                            prev
                          ) =>
                            prev.map(
                              (
                                x,
                                i
                              ) => ({
                                ...x,

                                is_default_sale_uom:
                                  i ===
                                  idx,
                              })
                            )
                        )
                      }
                      className="w-4 h-4 accent-primary cursor-pointer"
                    />
                  </div>

                  {/* Delete */}

                  <div className="md:col-span-1 flex items-center justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 disabled:opacity-30"
                      disabled={
                        pu.is_base_uom
                      }
                      onClick={() =>
                        setProductUoms(
                          (
                            prev
                          ) =>
                            prev.filter(
                              (
                                _,
                                i
                              ) =>
                                i !==
                                idx
                            )
                        )
                      }
                    >
                      <Trash2
                        size={
                          16
                        }
                      />
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </Section>

      {/* =======================================================
          Dates & Extras
      ======================================================== */}

      <Section
        title="Dates & Extras"
        hint="Optional metadata for tracking."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block">
              Manufacturing
              Date
            </Label>

            <Input
              type="date"
              value={
                manufacturingDate
              }
              onChange={(e) =>
                setManufacturingDate(
                  e.target.value
                )
              }
            />
          </div>

          <div>
            <Label className="mb-1 block">
              Expiry Date
            </Label>

            <Input
              type="date"
              value={expiryDate}
              onChange={(e) =>
                setExpiryDate(
                  e.target.value
                )
              }
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2 mt-2">
          <div className="flex items-center space-x-3">
            <Switch
              id="hasWarranty"
              checked={
                hasWarranty
              }
              onCheckedChange={
                setHasWarranty
              }
            />

            <Label
              htmlFor="hasWarranty"
              className="font-semibold"
            >
              Has Warranty
            </Label>
          </div>

          {hasWarranty && (
            <div className="flex items-center gap-2">
              <Input
                id="warrantyDays"
                type="number"
                min="0"
                value={
                  warrantyDays
                }
                onChange={(
                  e
                ) =>
                  setWarrantyDays(
                    e.target.value
                  )
                }
                className="w-24 h-8"
                placeholder="Days"
              />

              <span className="text-sm text-slate-500">
                Days
              </span>
            </div>
          )}
        </div>
      </Section>

      {/* =======================================================
          Actions
      ======================================================== */}

      <div className="flex items-center justify-end gap-2 pt-4 border-t sticky bottom-0 bg-white pb-2">
        <Button
          type="button"
          variant="outline"
          onClick={
            onCancel
          }
        >
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={
            submitting
          }
        >
          <Save
            size={16}
            className="mr-2"
          />

          {submitting
            ? 'Saving...'
            : isEditMode
              ? 'Update Product'
              : 'Save Product'}
        </Button>
      </div>
    </form>
  );
}