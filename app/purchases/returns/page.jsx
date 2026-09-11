"use client";

import { toDateInput } from "@/utils/accounting-date.mjs";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const api = "/api/backend";
const list = response => response.data?.data || response.data || [];
const emptyItem = () => ({ product_id: "", qty_unit_id: "", rate_unit_id: "", qty: 1, rate_per_unit: 0 });
const emptyForm = () => ({ vendor_id: "", return_no: "", return_date: toDateInput(), warehouse_id: "", notes: "", items: [emptyItem()] });

export default function PurchaseReturnsPage() {
  const [returns, setReturns] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const submission = useRef(null);
  const refresh = async () => setReturns(list(await axios.get(`${api}/purchase-returns`)));

  useEffect(() => {
    let active = true;
    Promise.all(["purchase-returns", "vendors", "products", "warehouses"].map(path => axios.get(`${api}/${path}`, { params: { per_page: 1000 } })))
      .then(responses => { if (active) { setReturns(list(responses[0])); setVendors(list(responses[1])); setProducts(list(responses[2])); setWarehouses(list(responses[3])); } })
      .catch(e => { if (active) setError(e.response?.data?.message || "Could not load purchase returns."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const updateItem = (index, values) => setForm(p => ({ ...p, items: p.items.map((item, i) => i === index ? { ...item, ...values } : item) }));
  const selectProduct = (index, id) => {
    const product = products.find(p => String(p.id) === id);
    const unit = product?.units?.find(u => Number(u.factor) === 1) || product?.units?.[0];
    updateItem(index, { product_id: id, qty_unit_id: unit?.id || "", rate_unit_id: unit?.id || "", rate_per_unit: Number(product?.costing_price || 0) });
  };
  const save = async event => {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    const payload = { ...form, vendor_id: Number(form.vendor_id), warehouse_id: Number(form.warehouse_id), items: form.items.map(item => Object.fromEntries(Object.entries(item).map(([key, value]) => [key, Number(value)]))) };
    const fingerprint = JSON.stringify(payload);
    if (submission.current?.fingerprint !== fingerprint) submission.current = { fingerprint, key: crypto.randomUUID() };
    try {
      await axios.post(`${api}/purchase-returns`, payload, { headers: { "Idempotency-Key": submission.current.key } });
      setOpen(false); setForm(emptyForm()); submission.current = null;
      await refresh();
    } catch (e) { setError(e.response?.data?.message || "Could not save purchase return. Your entries have been retained."); }
    finally { setBusy(false); }
  };
  const remove = async id => {
    if (!window.confirm("Reverse the stock and accounting effects of this return?")) return;
    setBusy(true); setError("");
    try { await axios.delete(`${api}/purchase-returns/${id}`); await refresh(); }
    catch (e) { setError(e.response?.data?.message || "Could not reverse purchase return."); }
    finally { setBusy(false); }
  };

  return <div className="p-4 md:p-6 space-y-5">
    <div className="flex justify-between items-center"><h1 className="text-2xl font-semibold">Purchase Returns</h1><Button disabled={loading || busy} onClick={() => { setError(""); setOpen(true); }}>New Purchase Return</Button></div>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {loading ? <p>Loading purchase returns…</p> : <div className="overflow-x-auto border rounded"><table className="w-full text-left"><thead><tr>{["Return", "Supplier", "Date", "Amount", "Action"].map(title => <th className="p-3" key={title}>{title}</th>)}</tr></thead><tbody>{returns.map(item => <tr className="border-t" key={item.id}><td className="p-3">{item.return_no}</td><td>{item.vendor?.name}</td><td>{item.return_date?.slice(0, 10)}</td><td>{Number(item.total_amount).toLocaleString()}</td><td><Button variant="outline" disabled={busy} onClick={() => remove(item.id)}>Reverse</Button></td></tr>)}</tbody></table>{!returns.length && <p className="p-4">No purchase returns yet.</p>}</div>}
    {open && <form onSubmit={save} className="border rounded-lg p-5 space-y-4 bg-white">
      <h2 className="text-lg font-semibold">New Purchase Return</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <label>Supplier<select aria-label="Supplier" required className="block w-full border rounded p-2" value={form.vendor_id} onChange={e => setForm(p => ({ ...p, vendor_id: e.target.value }))}><option value="">Select supplier</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}</select></label>
        <label>Return Number<Input aria-label="Return Number" required value={form.return_no} onChange={e => setForm(p => ({ ...p, return_no: e.target.value }))} /></label>
        <label>Return Date<Input aria-label="Return Date" required type="date" value={form.return_date} onChange={e => setForm(p => ({ ...p, return_date: e.target.value }))} /></label>
        <label>Warehouse<select aria-label="Warehouse" required className="block w-full border rounded p-2" value={form.warehouse_id} onChange={e => setForm(p => ({ ...p, warehouse_id: e.target.value }))}><option value="">Select warehouse</option>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></label>
      </div>
      {form.items.map((item, index) => {
        const units = products.find(p => String(p.id) === String(item.product_id))?.units || [];
        return <fieldset key={index} className="grid md:grid-cols-3 gap-3 border rounded p-3"><legend>Item {index + 1}</legend>
          <label>Product<select aria-label="Product" required className="block w-full border rounded p-2" value={item.product_id} onChange={e => selectProduct(index, e.target.value)}><option value="">Select product</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <label>Quantity<Input aria-label="Quantity" required type="number" min="0.0001" step="any" value={item.qty} onChange={e => updateItem(index, { qty: e.target.value })} /></label>
          <label>Quantity Unit<select aria-label="Quantity Unit" required className="block w-full border rounded p-2" value={item.qty_unit_id} onChange={e => updateItem(index, { qty_unit_id: e.target.value })}><option value="">Select unit</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
          <label>Return Rate<Input aria-label="Return Rate" required type="number" min="0" step="any" value={item.rate_per_unit} onChange={e => updateItem(index, { rate_per_unit: e.target.value })} /></label>
          <label>Rate Unit<select aria-label="Rate Unit" required className="block w-full border rounded p-2" value={item.rate_unit_id} onChange={e => updateItem(index, { rate_unit_id: e.target.value })}><option value="">Select unit</option>{units.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
          <Button type="button" variant="outline" disabled={form.items.length === 1 || busy} onClick={() => setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== index) }))}>Remove Item</Button>
        </fieldset>;
      })}
      <Button type="button" variant="outline" disabled={busy} onClick={() => setForm(p => ({ ...p, items: [...p.items, emptyItem()] }))}>Add Item</Button>
      <label className="block">Notes<Input aria-label="Notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} /></label>
      <div className="flex gap-2"><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save Purchase Return"}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button></div>
    </form>}
  </div>;
}
