"use client";

import { toDateInput } from "@/utils/accounting-date.mjs";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createSalesOrder, deleteSalesOrder, getSalesOrders } from "@/services/sales";
import { fetchCustomersClient } from "@/services/customer";
import { fetchProductsClient } from "@/services/product";

const EMPTY_ITEM = () => ({
  product_id: "",
  quantity: 1,
  unit_price: 0,
  discount_amount: 0,
  tax_amount: 0,
  description: "",
});

const toList = (res) => {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.data)) return res.data.data;
  return [];
};

export default function SalesOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");

  const [form, setForm] = useState({
    order_no: "",
    customer_id: "",
    order_date: toDateInput(),
    expected_delivery_date: "",
    notes: "",
    items: [EMPTY_ITEM()],
  });

  const refreshOrders = async () => {
    const res = await getSalesOrders();
    const list = toList(res);
    setOrders(list);
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [ordersRes, customersRes, productsRes] = await Promise.all([
          getSalesOrders(),
          fetchCustomersClient({ per_page: 1000 }),
          fetchProductsClient({ per_page: 1000 }),
        ]);

        if (!mounted) return;
        setOrders(toList(ordersRes));
        setCustomers(toList(customersRes));
        setProducts(toList(productsRes));
      } catch (e) {
        if (mounted) setLoadError("Failed to load sales orders");
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
    () => form.items.filter((i) => i.product_id),
    [form.items]
  );

  const filteredOrders = useMemo(() => {
    const term = appliedSearchTerm.trim().toLowerCase();
    if (!term) return orders;

    return orders.filter((order) =>
      [
        order.order_no,
        order.customer?.name,
        order.order_date,
        order.status,
        order.total_amount,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term))
    );
  }, [orders, appliedSearchTerm]);

  const updateItem = (idx, key, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => (i === idx ? { ...it, [key]: value } : it)),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!form.customer_id) {
      setFormError("Customer is required.");
      return;
    }
    if (items.length === 0) {
      setFormError("At least one item is required.");
      return;
    }

    const payload = {
      customer_id: Number(form.customer_id),
      order_no: form.order_no || undefined,
      order_date: form.order_date,
      expected_delivery_date: form.expected_delivery_date || null,
      notes: form.notes || null,
      items: items.map((i) => ({
        product_id: Number(i.product_id),
        quantity: Number(i.quantity || 0),
        unit_price: Number(i.unit_price || 0),
        discount_amount: Number(i.discount_amount || 0),
        tax_amount: Number(i.tax_amount || 0),
        description: i.description || null,
      })),
    };

    try {
      setSaving(true);
      await createSalesOrder(payload);
      await refreshOrders();
      setIsModalOpen(false);
      setForm({
        order_no: "",
        customer_id: "",
        order_date: toDateInput(),
        expected_delivery_date: "",
        notes: "",
        items: [EMPTY_ITEM()],
      });
    } catch (e) {
      setFormError("Failed to create sales order.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    await deleteSalesOrder(id);
    await refreshOrders();
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
            placeholder="Search by order or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && setAppliedSearchTerm(searchTerm)}
            className="mr-auto w-full sm:w-64 md:w-80"
          />
          <Button onClick={() => setAppliedSearchTerm(searchTerm)}>Search</Button>
          <Button onClick={() => setIsModalOpen(true)}>New Order</Button>
        </div>
      </div>

      {loadError && <p className="text-sm text-red-600">{loadError}</p>}

      <div className="overflow-x-auto border rounded-lg max-h-[65vh] overflow-y-auto">
        <table className="w-full min-w-[900px] text-sm text-left">
          <thead className="sticky top-0 z-20 text-xs uppercase bg-muted border-b border-slate-200">
            <tr>
              <th className="px-4 py-3">Order No</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Order Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="px-4 py-3">{o.order_no}</td>
                <td className="px-4 py-3">{o.customer?.name || "-"}</td>
                <td className="px-4 py-3">{o.order_date}</td>
                <td className="px-4 py-3">{o.status}</td>
                <td className="px-4 py-3 text-right">
                  {Number(o.total_amount || 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    className="px-2 py-1 rounded border text-red-600"
                    onClick={() => handleDelete(o.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  {appliedSearchTerm
                    ? `No sales orders found for "${appliedSearchTerm}".`
                    : "No sales orders found."}
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
              <h2 className="text-xl font-semibold">New Sales Order</h2>
              <button
                className="px-2 py-1 rounded border"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
            </div>

            {formError && <p className="text-sm text-red-600 mb-3">{formError}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Customer</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={form.customer_id}
                    onChange={(e) => setForm((p) => ({ ...p, customer_id: e.target.value }))}
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
                  <label className="text-sm font-medium">Order No (optional)</label>
                  <Input
                    value={form.order_no}
                    onChange={(e) => setForm((p) => ({ ...p, order_no: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Order Date</label>
                  <Input
                    type="date"
                    value={form.order_date}
                    onChange={(e) => setForm((p) => ({ ...p, order_date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Expected Delivery Date</label>
                  <Input
                    type="date"
                    value={form.expected_delivery_date}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, expected_delivery_date: e.target.value }))
                    }
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
                    <div className="md:col-span-4">
                      <label className="text-xs font-medium">Product</label>
                      <select
                        className="w-full border rounded px-2 py-1"
                        value={item.product_id}
                        onChange={(e) => updateItem(idx, "product_id", e.target.value)}
                      >
                        <option value="">Select product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
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
                    <div className="md:col-span-10">
                      <label className="text-xs font-medium">Description</label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                      />
                    </div>
                    <div className="md:col-span-2 flex items-end">
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
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Order"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
