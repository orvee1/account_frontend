"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { fetchProducts } from '@/services/product';
import { createPurchaseBill, updatePurchaseBill, fetchPurchaseBill, fetchPurchaseFormConfig } from '@/services/purchase';
import { fetchVendors } from '@/services/vendor';
import { server, responseData } from '@/services/server';
import { Loader2, PackagePlus as PackageIcon, PlusCircle, Save, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { usePurchaseCalculations } from '@/hooks/usePurchaseCalculations';

export default function PurchaseBillForm({ billId = null }) {
  const { toast } = useToast();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [accounts, setAccounts] = useState([]);
  
  const [settings, setSettings] = useState({
    purchase_show_price_uom: true,
    purchase_show_trade_discount: true,
    purchase_show_vat: true,
    purchase_show_ait: true,
    is_vat_registered: true,
  });

  const [formData, setFormData] = useState({
    vendor_id: '',
    bill_no: `BILL-${String(Date.now()).slice(-6)}`,
    bill_date: new Date().toISOString().split('T')[0],
    due_date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    supplier_ref_no: '',
    vat_mode: 'exclusive',
    bill_discount_amt: 0,
    bill_discount_account_id: '',
    notes: '',
    status: 'confirmed',
    items: [
        {
            product_id: '',
            purchase_uom_id: '',
            price_uom_id: '',
            quantity: 1,
            unit_price: 0,
            trade_discount_pct: 0,
            vat_rate: 0,
            ait_rate: 0,
            // Helper fields for UI/Logic
            purchaseUom: null,
            priceUom: null,
            productUoms: [],
        }
    ]
  });

  const { items: calculatedItems, totals } = usePurchaseCalculations(formData, settings);

  // Fetch Data from API on Mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const fetchPromises = [
          fetchProducts(),
          fetchVendors(),
          fetchPurchaseFormConfig(),
          server.get('/chart-accounts/options'),
        ];

        if (billId) {
          fetchPromises.push(fetchPurchaseBill(billId));
        }

        const [productsRes, vendorsRes, settingsRes, accountsRes, billRes] = await Promise.all(fetchPromises);
        
        const accountsData = await responseData(accountsRes);
        
        let productList = [];
        if (productsRes?.ok && productsRes?.data) {
          productList = Array.isArray(productsRes.data) 
            ? productsRes.data 
            : (productsRes.data.data ? productsRes.data.data : []);
          setProducts(productList);
        }
        
        if (vendorsRes?.ok && vendorsRes?.data) {
          const vendorList = Array.isArray(vendorsRes.data) 
            ? vendorsRes.data 
            : (vendorsRes.data.data ? vendorsRes.data.data : []);
          setVendors(vendorList);
        }

        if (settingsRes?.ok) {
          setSettings(prev => ({ ...prev, ...settingsRes.data }));
        }

        const accountList = accountsData.data?.data || accountsData.data;
        setAccounts(Array.isArray(accountList) ? accountList : []);

        if (billId && billRes?.ok) {
          const bill = billRes.data;
          setFormData({
            vendor_id: String(bill.vendor_id),
            bill_no: bill.bill_no,
            bill_date: bill.bill_date,
            due_date: bill.due_date,
            supplier_ref_no: bill.supplier_ref_no || '',
            vat_mode: bill.vat_mode || 'exclusive',
            bill_discount_amt: bill.bill_discount_amt,
            bill_discount_account_id: String(bill.bill_discount_account_id || ''),
            notes: bill.notes || '',
            status: bill.status,
            items: bill.items.map(item => {
                const product = productList.find(p => p.id === item.product_id);
                const productUoms = product?.product_uoms || [];
                return {
                    product_id: String(item.product_id),
                    purchase_uom_id: String(item.purchase_uom_id),
                    price_uom_id: String(item.price_uom_id),
                    quantity: item.quantity_in_purchase_uom,
                    unit_price: item.unit_price_original,
                    trade_discount_pct: item.trade_discount_pct,
                    line_discount_pct: item.line_discount_pct,
                    line_discount_amt: item.line_discount_amt,
                    vat_rate: item.vat_rate,
                    ait_rate: item.ait_rate,
                    productUoms: productUoms,
                    purchaseUom: productUoms.find(u => u.id === item.purchase_uom_id),
                    priceUom: productUoms.find(u => u.id === item.price_uom_id),
                };
            })
          });
        }

      } catch (error) {
        console.error("Failed to load data", error);
        toast({ 
          title: "Error", 
          description: "Failed to load required data.", 
          variant: "destructive" 
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [toast, billId]);

  const handleProductChange = (index, productId) => {
    const product = products.find(p => p.id == productId);
    if (!product) return;

    const productUoms = product.product_uoms || [];
    // Looking for is_default_purchase_uom or fallback to base/first
    const defaultUom = productUoms.find(u => u.is_default_purchase_uom) || productUoms[0];

    const newItems = [...formData.items];
    newItems[index] = {
        ...newItems[index],
        product_id: productId,
        productUoms: productUoms,
        purchaseUom: defaultUom,
        priceUom: defaultUom,
        purchase_uom_id: defaultUom?.id || '',
        price_uom_id: defaultUom?.id || '',
        unit_price: defaultUom?.purchase_price || defaultUom?.sale_price || 0,
        vat_rate: product.vat_rate || 0,
        ait_rate: product.ait_rate || 0,
    };

    setFormData({ ...formData, items: newItems });
  };

  const handlePurchaseUomChange = (index, uomId) => {
    const newItems = [...formData.items];
    const uom = newItems[index].productUoms.find(u => u.id == uomId);
    
    newItems[index] = {
        ...newItems[index],
        purchase_uom_id: uomId,
        purchaseUom: uom,
        price_uom_id: uomId, // Bill Unit follows Unit by default
        priceUom: uom,
        unit_price: uom?.purchase_price || uom?.sale_price || 0,
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
        unit_price: uom?.purchase_price || uom?.sale_price || 0,
    };
    
    setFormData({ ...formData, items: newItems });
  };

  const handleItemFieldChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    setFormData({ ...formData, items: newItems });
  };

  const handleAddLineItem = () => {
    setFormData({
        ...formData,
        items: [...formData.items, {
            product_id: '',
            purchase_uom_id: '',
            price_uom_id: '',
            quantity: 1,
            unit_price: 0,
            trade_discount_pct: 0,
            vat_rate: 0,
            ait_rate: 0,
            purchaseUom: null,
            priceUom: null,
            productUoms: [],
        }]
    });
  };

  const handleRemoveLineItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSaveBill = async (isDraft = false) => {
    if (!formData.vendor_id) {
      toast({ title: "Validation Error", description: "Please select a vendor.", variant: "destructive" });
      return;
    }
    
    if (formData.items.some(item => !item.product_id || (parseFloat(item.quantity) <= 0))) { 
       toast({ title: "Validation Error", description: "Please ensure all line items have a product and valid qty.", variant: "destructive" });
       return;
    }

    setIsSaving(true);
    try {
      const payload = {
          ...formData,
          status: isDraft ? 'draft' : 'confirmed'
      };

      const result = billId 
        ? await updatePurchaseBill(billId, payload)
        : await createPurchaseBill(payload);
      
      if (result.ok) {
        toast({ 
          title: "Success", 
          description: `Bill ${formData.bill_no} has been saved successfully.`, 
          className: 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-200'
        });
        
        router.push('/purchases');
      } else {
        throw new Error(result.data?.message || "Failed to save purchase bill");
      }
    } catch (error) {
      console.error("Save Error:", error);
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save purchase bill.", 
        variant: "destructive" 
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1 md:p-2">
      <Card className="shadow-xl border-border dark:border-dark-border bg-card dark:bg-dark-card">
        <CardHeader className="p-6 border-b border-border dark:border-dark-border">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                 <CardTitle className="text-3xl font-bold text-primary dark:text-dark-primary flex items-center">
                    <PackageIcon size={32} className="mr-3 text-accent dark:text-dark-accent" /> {billId ? 'Edit Purchase Bill' : 'New Purchase Bill'}
                </CardTitle>
                <div className="text-muted-foreground dark:text-dark-muted-foreground font-mono text-sm bg-muted dark:bg-dark-muted px-2 py-1 rounded self-start sm:self-center">
                    {formData.bill_no}
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="vendor" className="font-semibold">Vendor <span className="text-destructive dark:text-red-400">*</span></Label>
              <Select onValueChange={(val) => setFormData({...formData, vendor_id: val})} value={String(formData.vendor_id)}>
                <SelectTrigger id="vendor"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                <SelectContent>
                  {vendors.map(v => (
                    <SelectItem key={v.id} value={String(v.id)}>{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="billDate" className="font-semibold">Bill Date</Label>
              <DatePicker date={new Date(formData.bill_date)} setDate={(date) => setFormData({...formData, bill_date: date.toISOString().split('T')[0]})}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="font-semibold">Due Date</Label>
              <DatePicker date={formData.due_date ? new Date(formData.due_date) : null} setDate={(date) => setFormData({...formData, due_date: date ? date.toISOString().split('T')[0] : ''})}/>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
             <div className="space-y-2">
                <Label htmlFor="bill_no" className="font-semibold">Bill Number</Label>
                <Input id="bill_no" value={formData.bill_no} onChange={(e) => setFormData({...formData, bill_no: e.target.value})} />
             </div>
             <div className="space-y-2">
                <Label htmlFor="supplier_ref_no" className="font-semibold">Supplier Ref No</Label>
                <Input id="supplier_ref_no" value={formData.supplier_ref_no} onChange={(e) => setFormData({...formData, supplier_ref_no: e.target.value})} placeholder="Optional" />
             </div>
             <div className="space-y-2">
                <Label htmlFor="vat_mode" className="font-semibold">VAT Mode</Label>
                <Select onValueChange={(val) => setFormData({...formData, vat_mode: val})} value={formData.vat_mode}>
                    <SelectTrigger id="vat_mode"><SelectValue placeholder="Select VAT Mode" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="exclusive">VAT Exclusive</SelectItem>
                        <SelectItem value="inclusive">VAT Inclusive</SelectItem>
                    </SelectContent>
                </Select>
             </div>
          </div>

          <div className="overflow-x-auto bg-background dark:bg-dark-background p-4 rounded-lg border border-border dark:border-dark-border shadow-inner">
            <table className="w-full min-w-[1500px]">
              <thead className="border-b-2 border-primary dark:border-dark-primary">
                <tr>
                  <th className="p-3 text-left text-sm font-semibold text-primary dark:text-dark-primary w-[15%]">Product/Service</th>
                  <th className="p-3 text-left text-sm font-semibold text-primary dark:text-dark-primary w-[6%]">Qty</th>
                  <th className="p-3 text-left text-sm font-semibold text-primary dark:text-dark-primary w-[8%]">Unit</th>
                  <th className="p-3 text-left text-sm font-semibold text-primary dark:text-dark-primary w-[8%]">Rate</th>
                  {settings.purchase_show_price_uom && <th className="p-3 text-left text-sm font-semibold text-primary dark:text-dark-primary w-[8%]">Bill Unit</th>}
                  {settings.purchase_show_trade_discount && <th className="p-3 text-left text-sm font-semibold text-primary dark:text-dark-primary w-[6%]">Trade Disc %</th>}
                  <th className="p-3 text-left text-sm font-semibold text-primary dark:text-dark-primary w-[8%]">Net Rate</th>
                  <th className="p-3 text-left text-sm font-semibold text-primary dark:text-dark-primary w-[10%]">Subtotal</th>
                  {settings.purchase_show_vat && <th className="p-3 text-left text-sm font-semibold text-primary dark:text-dark-primary w-[6%]">VAT %</th>}
                  {settings.purchase_show_ait && <th className="p-3 text-left text-sm font-semibold text-primary dark:text-dark-primary w-[6%]">AIT %</th>}
                  <th className="p-3 text-left text-sm font-semibold text-primary dark:text-dark-primary w-[8%]">Net Unit Cost</th>
                  <th className="p-3 text-center text-sm font-semibold text-primary dark:text-dark-primary w-[5%]"></th>
                </tr>
              </thead>
              <tbody>
                {calculatedItems.map((item, index) => (
                  <tr key={index} className="border-b border-border dark:border-dark-border last:border-b-0 hover:bg-muted/50 dark:hover:bg-dark-muted/50 transition-colors">
                    <td className="p-2">
                      <Select value={String(item.product_id)} onValueChange={(value) => handleProductChange(index, value)}>
                        <SelectTrigger className="text-sm"><SelectValue placeholder="Select product" /></SelectTrigger>
                        <SelectContent>
                          {products.map(p => (
                            <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-2">
                      <Input type="number" value={item.quantity} onChange={(e) => handleItemFieldChange(index, 'quantity', e.target.value)} placeholder="1" className="w-full text-sm text-right" min="0" step="any"/>
                    </td>
                    <td className="p-2">
                       <Select value={String(item.purchase_uom_id)} onValueChange={(value) => handlePurchaseUomChange(index, value)} disabled={!item.product_id}>
                         <SelectTrigger className="text-sm"><SelectValue placeholder="Unit" /></SelectTrigger>
                         <SelectContent>{item.productUoms?.map(u => (<SelectItem key={u.id} value={String(u.id)}>{u.uom?.name || u.name}</SelectItem>))}</SelectContent>
                       </Select>
                    </td>
                    <td className="p-2">
                      <Input type="number" value={item.unit_price} onChange={(e) => handleItemFieldChange(index, 'unit_price', e.target.value)} placeholder="0.00" className="w-full text-sm text-right" min="0" step="0.01"/>
                    </td>
                    {settings.purchase_show_price_uom && (
                        <td className="p-2">
                        <Select value={String(item.price_uom_id)} onValueChange={(value) => handlePriceUomChange(index, value)} disabled={!item.product_id}>
                            <SelectTrigger className="text-sm"><SelectValue placeholder="Unit" /></SelectTrigger>
                            <SelectContent>{item.productUoms?.map(u => (<SelectItem key={u.id} value={String(u.id)}>{u.uom?.name || u.name}</SelectItem>))}</SelectContent>
                        </Select>
                        </td>
                    )}
                    {settings.purchase_show_trade_discount && (
                        <td className="p-2">
                        <Input type="number" value={item.trade_discount_pct} onChange={(e) => handleItemFieldChange(index, 'trade_discount_pct', e.target.value)} placeholder="0" className="w-full text-sm text-right" min="0" max="100"/>
                        </td>
                    )}
                    <td className="p-2 text-right text-sm font-medium bg-muted/30 dark:bg-dark-muted/30">
                        {item.net_unit_price}
                    </td>
                    <td className="p-2 text-right text-sm font-medium bg-muted/30 dark:bg-dark-muted/30">
                      {item.line_subtotal}
                    </td>
                    {settings.purchase_show_vat && (
                         <td className="p-2">
                            <Input type="number" value={item.vat_rate} onChange={(e) => handleItemFieldChange(index, 'vat_rate', e.target.value)} placeholder="0" className="w-full text-sm text-right" min="0" max="100"/>
                         </td>
                    )}
                    {settings.purchase_show_ait && (
                         <td className="p-2">
                            <Input type="number" value={item.ait_rate} onChange={(e) => handleItemFieldChange(index, 'ait_rate', e.target.value)} placeholder="0" className="w-full text-sm text-right" min="0" max="100"/>
                         </td>
                    )}
                    <td className="p-2 text-right text-sm font-medium bg-muted/30 dark:bg-dark-muted/30">
                        {item.net_unit_cost}
                    </td>
                    <td className="p-2 text-center">
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveLineItem(index)} className="text-destructive dark:text-red-400 hover:text-destructive/80 h-8 w-8">
                        <Trash2 size={16} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button onClick={handleAddLineItem} variant="outline" className="mt-4 text-accent dark:text-dark-accent border-accent dark:border-dark-accent hover:bg-accent/10 dark:hover:bg-dark-accent/10 shadow-sm">
              <PlusCircle size={18} className="mr-2" /> Add Line Item
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6 items-start">
             <div>
                <Label htmlFor="notes" className="font-semibold">Notes/Remarks</Label>
                <Textarea id="notes" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Enter any notes or remarks for this bill..." className="mt-1 min-h-[100px]" />
              </div>
            <div className="space-y-3 p-4 bg-muted/70 dark:bg-dark-muted/70 rounded-lg shadow-inner border border-border dark:border-dark-border">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Gross Subtotal:</span>
                <span className="font-semibold">{Number(totals.subtotal).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
              </div>
              {settings.purchase_show_trade_discount && (
                <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">Trade Discount (-):</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">-{Number(totals.totalTradeDiscount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                </div>
              )}
              
              <div className="border-t border-border dark:border-dark-border my-1 pt-1 flex justify-between items-center text-sm font-bold">
                <span>Taxable Amount:</span>
                <span>{Number(totals.totalTaxableAmount).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
              </div>

              {settings.purchase_show_vat && (
                <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">Input VAT (+):</span>
                    <span className="font-semibold">{Number(totals.totalVat).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                </div>
              )}

              {settings.purchase_show_ait && (
                <div className="flex justify-between items-center text-sm">
                    <span className="font-medium">AIT Payable (-):</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">-{Number(totals.totalAit).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                </div>
              )}

              <div className="space-y-2 border-t border-border dark:border-dark-border pt-2">
                <Label htmlFor="bill_discount_amt" className="text-xs font-medium text-muted-foreground">Bill Discount (-)</Label>
                <div className="flex gap-2">
                    <Input 
                        id="bill_discount_amt"
                        type="number" 
                        value={formData.bill_discount_amt} 
                        onChange={(e) => setFormData({...formData, bill_discount_amt: e.target.value})} 
                        placeholder="0.00" 
                        className="w-1/3 text-sm text-right" 
                        min="0" step="0.01"
                    />
                    <Select onValueChange={(val) => setFormData({...formData, bill_discount_account_id: val})} value={String(formData.bill_discount_account_id)}>
                        <SelectTrigger className="w-2/3 text-sm"><SelectValue placeholder="Discount Account" /></SelectTrigger>
                        <SelectContent>
                            {accounts.map(a => (
                                <SelectItem key={a.id} value={String(a.id)}>{a.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
              </div>

              <hr className="border-border dark:border-dark-border my-2"/>
              <div className="flex justify-between items-center text-xl text-primary dark:text-dark-primary font-bold">
                <span>Grand Total:</span>
                <span>{Number(totals.grandTotal).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-muted/30 dark:bg-dark-muted/30 rounded-b-lg p-6 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 border-t border-border dark:border-dark-border">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button className="w-full sm:w-auto bg-secondary text-secondary-foreground hover:bg-secondary-hover dark:bg-dark-secondary dark:text-dark-secondary-foreground dark:hover:bg-dark-secondary-hover flex items-center shadow hover:shadow-md" onClick={() => handleSaveBill(true)} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={18} className="mr-2" />} Save as Draft
          </Button>
          <Button className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary-hover dark:bg-dark-primary dark:text-dark-primary-foreground dark:hover:bg-dark-primary-hover flex items-center shadow hover:shadow-md" onClick={() => handleSaveBill(false)} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save size={18} className="mr-2" />} Save Bill
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
