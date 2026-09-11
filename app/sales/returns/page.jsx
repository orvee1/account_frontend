"use client";

import { toDateInput } from "@/utils/accounting-date.mjs";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createSalesReturnDirect, deleteSalesReturn, getSalesReturns, getSalesInvoices, getSalesInvoice } from "@/services/sales";
import { fetchCustomersClient } from "@/services/customer";
import { fetchProductsClient } from "@/services/product";

const EMPTY_ITEM = () => ({
  sales_invoice_item_id: "",
  product_id: "",
  quantity: 1,
  unit_price: 0,
  discount_amount: 0,
  tax_amount: 0,
});

const toList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

export default function SalesReturnsPage() {
  const [returns, setReturns] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [sourceLoading, setSourceLoading] = useState(false);
  const sourceRequest = useRef(0);
  const submission = useRef(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");

  const [form, setForm] = useState({
    return_no: "",
    customer_id: "",
    sales_invoice_id: "",
    return_date: toDateInput(),
    reason: "",
    notes: "",
    items: [EMPTY_ITEM()],
  });

  const refreshReturns = async () => {
    const res = await getSalesReturns();
    setReturns(toList(res));
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [returnsRes, customersRes, productsRes, invoicesRes] = await Promise.all([
          getSalesReturns(),
          fetchCustomersClient({ per_page: 1000 }),
          fetchProductsClient({ per_page: 1000 }),
          getSalesInvoices({ per_page: 1000 }),
        ]);

        if (!mounted) return;
        setReturns(toList(returnsRes));
        setCustomers(toList(customersRes));
        setProducts(toList(productsRes));
        setInvoices(toList(invoicesRes));
      } catch (e) {
        if (mounted) setLoadError("Failed to load sales returns");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const items = useMemo(
    () => form.items.filter((i) => i.product_id && i.sales_invoice_item_id),
    [form.items]
  );

  const filteredReturns = useMemo(() => {
    const term = appliedSearchTerm.trim().toLowerCase();
    if (!term) return returns;

    return returns.filter((item) =>
      [
        item.return_no,
        item.customer?.name,
        item.return_date,
        item.total_amount,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [returns, appliedSearchTerm]);

  const updateItem = (idx, key, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => (i === idx ? { ...it, [key]: value } : it)),
    }));
  };

  const selectInvoice = async (id) => {
    const request = ++sourceRequest.current;
    setForm(p => ({ ...p, sales_invoice_id: id, items: [EMPTY_ITEM()] }));
    setInvoiceItems([]);
    if (!id) return;
    setSourceLoading(true);
    try {
      const response = await getSalesInvoice(id);
      const invoice = response.data || response;
      if (!invoice.id) throw new Error('Could not load source invoice.');
      if (request === sourceRequest.current) setInvoiceItems(invoice.items || []);
    } catch (error) { if (request === sourceRequest.current) setFormError(error.response?.data?.message || error.message); }
    finally { if (request === sourceRequest.current) setSourceLoading(false); }
  };

  const selectInvoiceItem = (idx, id) => {
    const source = invoiceItems.find(item => String(item.id) === id);
    setForm(p => ({ ...p, items: p.items.map((item, i) => i !== idx ? item : source ? {
      ...EMPTY_ITEM(), sales_invoice_item_id: source.id, product_id: source.product_id,
      unit_price: Number(source.unit_price), quantity: 1,
    } : EMPTY_ITEM()) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.customer_id) {
      setFormError("Customer is required.");
      return;
    }
    if (items.length === 0) {
      setFormError("Select a source invoice and at least one item.");
      return;
    }

    const payload = {
      customer_id: Number(form.customer_id),
      sales_invoice_id: form.sales_invoice_id ? Number(form.sales_invoice_id) : null,
      return_no: form.return_no || undefined,
      return_date: form.return_date,
      reason: form.reason || null,
      notes: form.notes || null,
      items: items.map((i) => ({
        sales_invoice_item_id: Number(i.sales_invoice_item_id),
        product_id: Number(i.product_id),
        quantity: Number(i.quantity || 0),
        unit_price: Number(i.unit_price || 0),
        discount_amount: Number(i.discount_amount || 0),
        tax_amount: Number(i.tax_amount || 0),
      })),
    };

    try {
      setSaving(true);
      const fingerprint = JSON.stringify(payload);
      if (submission.current?.fingerprint !== fingerprint) submission.current = { fingerprint, key: crypto.randomUUID() };
      await createSalesReturnDirect(payload, submission.current.key);
      submission.current = null;
      await refreshReturns();
      setIsModalOpen(false);
      setForm({
        return_no: "",
        customer_id: "",
        sales_invoice_id: "",
        return_date: toDateInput(),
        reason: "",
        notes: "",
        items: [EMPTY_ITEM()],
      });
    } catch (e) {
      setFormError(e.response?.data?.message || "Failed to create sales return.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await deleteSalesReturn(id);
    await refreshReturns();
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="space-y-3">
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-end">
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          <Input
            placeholder="Search by return or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setAppliedSearchTerm(searchTerm)}
            className="mr-auto w-full sm:w-64 md:w-80"
          />
          <Button onClick={() => setAppliedSearchTerm(searchTerm)}>Search</Button>
          <Button onClick={() => setIsModalOpen(true)}>New Return</Button>
        </div>
      </div>

      {loadError && <p className="text-sm text-red-600">{loadError}</p>}

      <div className="overflow-x-auto border rounded-lg max-h-[65vh] overflow-y-auto">
        <table className="w-full min-w-[900px] text-sm text-left">
          <thead className="sticky top-0 z-20 text-xs uppercase bg-muted border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Return No</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Return Date</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReturns.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3">{r.return_no}</td>
                <td className="px-4 py-3">{r.customer?.name || "-"}</td>
                <td className="px-4 py-3">{r.return_date}</td>
                <td className="px-4 py-3 text-right">
                  {Number(r.total_amount || 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    className="px-2 py-1 rounded border text-red-600"
                    onClick={() => handleDelete(r.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filteredReturns.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  {appliedSearchTerm
                    ? `No sales returns found for "${appliedSearchTerm}".`
                    : "No sales returns found."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">New Sales Return</h2>
              <button
                className="px-2 py-1 rounded border"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
            </div>

            {formError && <p role="alert" className="text-sm text-red-600 mb-3">{formError}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Customer</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={form.customer_id}
                    onChange={(e) => { sourceRequest.current++; setSourceLoading(false); setInvoiceItems([]); setForm((p) => ({ ...p, customer_id: e.target.value, sales_invoice_id: "", items: [EMPTY_ITEM()] })); }}
                  >
                    <option value="">Select customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Return No (optional)</label>
                  <Input
                    value={form.return_no}
                    onChange={(e) => setForm((p) => ({ ...p, return_no: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Return Date</label>
                  <Input
                    type="date"
                    value={form.return_date}
                    onChange={(e) => setForm((p) => ({ ...p, return_date: e.target.value }))}
                  />
                </div>
                <div>
                  <label htmlFor="source-invoice" className="text-sm font-medium">Source Invoice</label>
                  <select id="source-invoice" required className="w-full border rounded px-3 py-2" value={form.sales_invoice_id} onChange={e => selectInvoice(e.target.value)}>
                    <option value="">Select invoice</option>
                    {invoices.filter(invoice => String(invoice.customer_id) === String(form.customer_id)).map(invoice => <option key={invoice.id} value={invoice.id}>{invoice.invoice_no}</option>)}
                  </select>
                  {sourceLoading && <p>Loading invoice items...</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Reason</label>
                  <Input
                    value={form.reason}
                    onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium">Notes</label>
                  <Input
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Items</h3>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setForm((p) => ({ ...p, items: [...p.items, EMPTY_ITEM()] }))}
                  >
                    Add Item
                  </Button>
                </div>

                {form.items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 border rounded p-3">
                    <div className="md:col-span-6">
                      <label htmlFor={`return-item-${idx}`} className="text-xs font-medium">Invoice Item</label>
                      <select id={`return-item-${idx}`} required disabled={!form.sales_invoice_id || sourceLoading} className="w-full border rounded px-2 py-1" value={item.sales_invoice_item_id} onChange={e => selectInvoiceItem(idx, e.target.value)}>
                        <option value="">Select invoiced item</option>
                        {invoiceItems.map(source => <option key={source.id} value={source.id}>{source.product?.name || products.find(p => p.id === source.product_id)?.name} - invoiced quantity {source.quantity}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium">Qty</label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium">Unit Price</label>
                      <Input
                        type="number"
                        value={item.unit_price}
                        onChange={(e) => updateItem(idx, "unit_price", e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium">Discount</label>
                      <Input
                        type="number"
                        value={item.discount_amount}
                        onChange={(e) => updateItem(idx, "discount_amount", e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium">Tax</label>
                      <Input
                        type="number"
                        value={item.tax_amount}
                        onChange={(e) => updateItem(idx, "tax_amount", e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-12 flex items-end justify-end">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            items: p.items.filter((_, i) => i !== idx),
                          }))
                        }
                        disabled={form.items.length === 1}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || sourceLoading}>
                  {saving ? "Saving..." : "Save Return"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
