'use client';

import { toDateInput } from "@/utils/accounting-date.mjs";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSalesCalculations } from '@/hooks/useSalesCalculations';
import { fetchProductsClient } from '@/services/product';
import { fetchCustomersClient } from '@/services/customer';
import { createSalesInvoice } from '@/services/sales';
import { server, responseData } from '@/services/server';

export default function EnhancedSalesInvoiceForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [settings, setSettings] = useState({
        sales_show_price_uom: true,
        sales_show_trade_discount: true,
        sales_show_line_discount: true,
        sales_show_vat: true,
        sales_show_ait: true,
        sales_show_cogs: false,
        sales_show_gross_profit: false,
    });

    const [formData, setFormData] = useState({
        customer_id: '',
        invoice_date: toDateInput(),
        due_date: '',
        vat_mode: 'exclusive',
        invoice_discount_amt: 0,
        invoice_discount_account_id: '',
        notes: '',
        items: [
            {
                product_id: '',
                sale_uom_id: '',
                price_uom_id: '',
                quantity: 1,
                unit_price: 0,
                trade_discount_pct: 0,
                line_discount_pct: 0,
                line_discount_amt: 0,
                vat_rate: 0,
                ait_rate: 0,
                description: '',
                // Helper fields for UI/Logic
                saleUom: null,
                priceUom: null,
                productUoms: [],
            }
        ]
    });

    const { items: calculatedItems, totals } = useSalesCalculations(formData, settings);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            
            const [productsData, customersData, settingsRes, accountsRes] = await Promise.all([
                fetchProductsClient({ per_page: 100 }),
                fetchCustomersClient({ per_page: 100 }),
                server.get('/settings/sales-form-config'),
                server.get('/chart-accounts/options'),
            ]);

            const settingsData = await responseData(settingsRes);
            const accountsData = await responseData(accountsRes);

            // Handle Products (paginated or flat)
            const productList = productsData.data || productsData;
            setProducts(Array.isArray(productList) ? productList : []);

            // Handle Customers (paginated or flat)
            const customerList = customersData.data || customersData;
            setCustomers(Array.isArray(customerList) ? customerList : []);

            // Handle Settings
            if (settingsData.ok) setSettings(settingsData.data);
            
            // Handle Accounts (flat list from our new endpoint)
            const accountList = accountsData.data?.data || accountsData.data;
            setAccounts(Array.isArray(accountList) ? accountList : []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleProductChange = (index, productId) => {
        const product = products.find(p => p.id == productId);
        if (!product) return;

        const defaultUom = product.product_uoms?.find(u => u.is_default_sale_uom) || product.product_uoms?.[0];

        const newItems = [...formData.items];
        newItems[index] = {
            ...newItems[index],
            product_id: productId,
            productUoms: product.product_uoms || [],
            saleUom: defaultUom,
            priceUom: defaultUom,
            sale_uom_id: defaultUom?.id || '',
            price_uom_id: defaultUom?.id || '',
            unit_price: defaultUom?.sale_price || 0,
            vat_rate: product.vat_rate || 0,
            ait_rate: product.ait_rate || 0,
            weighted_avg_cost: product.weighted_avg_cost || 0,
        };

        setFormData({ ...formData, items: newItems });
    };

    const handleSaleUomChange = (index, uomId) => {
        const newItems = [...formData.items];
        const uom = newItems[index].productUoms.find(u => u.id == uomId);
        
        newItems[index] = {
            ...newItems[index],
            sale_uom_id: uomId,
            saleUom: uom,
            price_uom_id: uomId, // Price UOM follows Sale UOM by default
            priceUom: uom,
            unit_price: uom?.sale_price || 0,
        };
        
        setFormData({ ...formData, items: newItems });
    };

    const handlePriceUomChange = (index, uomId) => {
        const newItems = [...formData.items];
        const uom = newItems[index].productUoms.find(u => u.id == uomId);
        
        newItems[index] = {
            ...newItems[index],
            price_uom_id: uomId,
            priceUom: uom,
            unit_price: uom?.sale_price || 0,
        };
        
        setFormData({ ...formData, items: newItems });
    };

    const handleItemFieldChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;
        setFormData({ ...formData, items: newItems });
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, {
                product_id: '',
                sale_uom_id: '',
                price_uom_id: '',
                quantity: 1,
                unit_price: 0,
                trade_discount_pct: 0,
                line_discount_pct: 0,
                line_discount_amt: 0,
                vat_rate: 0,
                ait_rate: 0,
                description: '',
                saleUom: null,
                priceUom: null,
                productUoms: [],
            }]
        });
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await createSalesInvoice(formData);
            router.push('/sales/invoices');
        } catch (error) {
            console.error('Error saving invoice:', error);
            alert('Failed to save invoice: ' + (error.response?.data?.message || error.message));
        }
    };

    if (isLoading) return <div>Loading...</div>;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Customer</label>
                        <select
                            required
                            value={formData.customer_id}
                            onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                            className="mt-1 block w-full border rounded-md p-2"
                        >
                            <option value="">Select Customer</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Invoice Date</label>
                        <input
                            type="date"
                            required
                            value={formData.invoice_date}
                            onChange={(e) => setFormData({ ...formData, invoice_date: e.target.value })}
                            className="mt-1 block w-full border rounded-md p-2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">VAT Mode</label>
                        <select
                            value={formData.vat_mode}
                            onChange={(e) => setFormData({ ...formData, vat_mode: e.target.value })}
                            className="mt-1 block w-full border rounded-md p-2"
                        >
                            <option value="exclusive">VAT Exclusive</option>
                            <option value="inclusive">VAT Inclusive</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white overflow-x-auto rounded-lg shadow-sm border">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sale UOM</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                            {settings.sales_show_price_uom && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate UOM</th>}
                            {settings.sales_show_trade_discount && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trade Disc %</th>}
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Net Rate</th>
                            {settings.sales_show_line_discount && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Line Disc %</th>}
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                            {settings.sales_show_vat && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">VAT %</th>}
                            {settings.sales_show_ait && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AIT %</th>}
                            {(settings.sales_show_cogs || settings.sales_show_gross_profit) && <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Internal</th>}
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {calculatedItems.map((item, index) => (
                            <tr key={index}>
                                <td className="px-2 py-2 min-w-[200px]">
                                    <select
                                        value={item.product_id}
                                        onChange={(e) => handleProductChange(index, e.target.value)}
                                        className="w-full border rounded p-1 text-sm"
                                    >
                                        <option value="">Select Product</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </td>
                                <td className="px-2 py-2 w-24">
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => handleItemFieldChange(index, 'quantity', e.target.value)}
                                        className="w-full border rounded p-1 text-sm text-right"
                                    />
                                </td>
                                <td className="px-2 py-2 w-32">
                                    <select
                                        value={item.sale_uom_id}
                                        onChange={(e) => handleSaleUomChange(index, e.target.value)}
                                        className="w-full border rounded p-1 text-sm"
                                    >
                                        {item.productUoms.map(u => <option key={u.id} value={u.id}>{u.uom?.name}</option>)}
                                    </select>
                                </td>
                                <td className="px-2 py-2 w-32">
                                    <input
                                        type="number"
                                        value={item.unit_price}
                                        onChange={(e) => handleItemFieldChange(index, 'unit_price', e.target.value)}
                                        className="w-full border rounded p-1 text-sm text-right"
                                    />
                                </td>
                                {settings.sales_show_price_uom && (
                                    <td className="px-2 py-2 w-32">
                                        <select
                                            value={item.price_uom_id}
                                            onChange={(e) => handlePriceUomChange(index, e.target.value)}
                                            className="w-full border rounded p-1 text-sm"
                                        >
                                            {item.productUoms.map(u => <option key={u.id} value={u.id}>{u.uom?.name}</option>)}
                                        </select>
                                    </td>
                                )}
                                {settings.sales_show_trade_discount && (
                                    <td className="px-2 py-2 w-24">
                                        <input
                                            type="number"
                                            value={item.trade_discount_pct}
                                            onChange={(e) => handleItemFieldChange(index, 'trade_discount_pct', e.target.value)}
                                            className="w-full border rounded p-1 text-sm text-right"
                                        />
                                    </td>
                                )}
                                <td className="px-2 py-2 w-24 bg-gray-50 text-right text-sm">
                                    {item.net_unit_price}
                                </td>
                                {settings.sales_show_line_discount && (
                                    <td className="px-2 py-2 w-24">
                                        <input
                                            type="number"
                                            value={item.line_discount_pct}
                                            onChange={(e) => handleItemFieldChange(index, 'line_discount_pct', e.target.value)}
                                            className="w-full border rounded p-1 text-sm text-right"
                                        />
                                    </td>
                                )}
                                <td className="px-2 py-2 w-32 bg-gray-50 text-right text-sm font-medium">
                                    {item.line_subtotal}
                                </td>
                                {settings.sales_show_vat && (
                                    <td className="px-2 py-2 w-20">
                                        <input
                                            type="number"
                                            value={item.vat_rate}
                                            onChange={(e) => handleItemFieldChange(index, 'vat_rate', e.target.value)}
                                            className="w-full border rounded p-1 text-sm text-right"
                                        />
                                    </td>
                                )}
                                {settings.sales_show_ait && (
                                    <td className="px-2 py-2 w-20">
                                        <input
                                            type="number"
                                            value={item.ait_rate}
                                            onChange={(e) => handleItemFieldChange(index, 'ait_rate', e.target.value)}
                                            className="w-full border rounded p-1 text-sm text-right"
                                        />
                                    </td>
                                )}
                                {(settings.sales_show_cogs || settings.sales_show_gross_profit) && (
                                    <td className="px-2 py-2 text-xs text-gray-500 bg-gray-50">
                                        {settings.sales_show_cogs && <div>C: {item.cogs}</div>}
                                        {settings.sales_show_gross_profit && <div>GP: {item.gross_profit}</div>}
                                    </td>
                                )}
                                <td className="px-2 py-2 text-right">
                                    <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700">×</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-4 bg-gray-50 border-t">
                    <button type="button" onClick={addItem} className="text-blue-600 font-medium text-sm">+ Add Row</button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="w-full md:w-1/2 space-y-4">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <label className="block text-sm font-medium text-gray-700">Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="mt-1 block w-full border rounded-md p-2 h-24"
                        ></textarea>
                    </div>
                </div>
                <div className="w-full md:w-1/3 space-y-2 bg-white p-6 rounded-lg shadow-sm border">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium">{totals.subtotal}</span>
                    </div>
                    {settings.sales_show_trade_discount && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Trade Discount:</span>
                            <span className="text-red-600">-{totals.totalTradeDiscount}</span>
                        </div>
                    )}
                    {settings.sales_show_line_discount && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Line Discount:</span>
                            <span className="text-red-600">-{totals.totalLineDiscount}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm border-t pt-2">
                        <span className="text-gray-600 font-semibold">Taxable Amount:</span>
                        <span className="font-semibold">{totals.totalTaxableAmount}</span>
                    </div>
                    {settings.sales_show_vat && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total VAT:</span>
                            <span className="font-medium">{totals.totalVat}</span>
                        </div>
                    )}
                    {settings.sales_show_ait && (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Total AIT:</span>
                            <span className="text-gray-500">{totals.totalAit}</span>
                        </div>
                    )}
                    <div className="space-y-2 border-t pt-2">
                        <label className="block text-xs font-medium text-gray-500">Invoice Discount</label>
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={formData.invoice_discount_amt}
                                onChange={(e) => setFormData({ ...formData, invoice_discount_amt: e.target.value })}
                                className="w-1/3 border rounded p-1 text-sm"
                                placeholder="Amt"
                            />
                            <select
                                value={formData.invoice_discount_account_id}
                                onChange={(e) => setFormData({ ...formData, invoice_discount_account_id: e.target.value })}
                                className="w-2/3 border rounded p-1 text-sm"
                            >
                                <option value="">Select Discount Account</option>
                                {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-between text-lg border-t-2 border-double pt-2 mt-4">
                        <span className="font-bold">Grand Total:</span>
                        <span className="font-bold text-blue-700">{totals.grandTotal}</span>
                    </div>
                    {settings.sales_show_gross_profit && (
                        <div className="flex justify-between text-xs text-green-600 mt-2 italic">
                            <span>Estimated Gross Profit:</span>
                            <span>{totals.totalGrossProfit}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-4">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="px-8 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold"
                >
                    Save Invoice
                </button>
            </div>
        </form>
    );
}
