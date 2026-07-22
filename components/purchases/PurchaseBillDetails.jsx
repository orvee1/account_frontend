"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
    ArrowLeft, 
    Printer, 
    Download, 
    Edit, 
    FileText, 
    Calendar, 
    User, 
    MapPin, 
    AlertCircle,
    CheckCircle2,
    Clock
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function PurchaseBillDetails({ bill }) {
    const router = useRouter();

    if (!bill) return null;

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
        }).format(amount || 0);
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'draft':
                return <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">Draft</Badge>;
            case 'confirmed':
                return <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300">Confirmed</Badge>;
            case 'cancelled':
                return <Badge variant="destructive">Cancelled</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getPaymentBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'unpaid':
                return <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">Unpaid</Badge>;
            case 'partial':
                return <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">Partial</Badge>;
            case 'paid':
                return <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">Paid</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-4">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <Button 
                    variant="ghost" 
                    onClick={() => router.back()}
                    className="flex items-center text-muted-foreground hover:text-primary"
                >
                    <ArrowLeft size={18} className="mr-2" /> Back to List
                </Button>
                <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Printer size={16} className="mr-2" /> Print
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                        <Download size={16} className="mr-2" /> PDF
                    </Button>
                    <Button 
                        variant="default" 
                        size="sm" 
                        className="flex-1 sm:flex-none bg-orange-600 hover:bg-orange-700"
                        onClick={() => router.push(`/purchases/${bill.id}/edit`)}
                    >
                        <Edit size={16} className="mr-2" /> Edit Bill
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <Card className="shadow-lg border-t-4 border-t-primary">
                <CardHeader className="pb-4">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <CardTitle className="text-3xl font-bold">{bill.bill_no}</CardTitle>
                                {getStatusBadge(bill.status)}
                                {getPaymentBadge(bill.payment_status)}
                            </div>
                            <p className="text-muted-foreground flex items-center">
                                <Calendar size={14} className="mr-1" /> Bill Date: {formatDate(bill.bill_date)}
                            </p>
                        </div>
                        <div className="text-right space-y-1">
                            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Amount</p>
                            <p className="text-3xl font-bold text-primary">{formatCurrency(bill.total_amount)}</p>
                        </div>
                    </div>
                </CardHeader>

                <Separator />

                <CardContent className="pt-6 space-y-8">
                    {/* Information Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {/* Vendor Info */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center">
                                <User size={16} className="mr-2" /> Vendor Information
                            </h3>
                            <div className="bg-muted/30 p-4 rounded-lg space-y-2 border border-border">
                                <p className="font-bold text-lg">{bill.vendor?.name}</p>
                                {bill.vendor?.phone_number && <p className="text-sm">Phone: {bill.vendor.phone_number}</p>}
                                {bill.vendor?.address && (
                                    <p className="text-sm flex items-start">
                                        <MapPin size={14} className="mr-1 mt-0.5 shrink-0" />
                                        {bill.vendor.address}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Bill Info */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center">
                                <FileText size={16} className="mr-2" /> Bill Details
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between py-1 border-b border-dashed">
                                    <span className="text-muted-foreground">Supplier Ref:</span>
                                    <span className="font-medium">{bill.supplier_ref_no || "N/A"}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-dashed">
                                    <span className="text-muted-foreground">Due Date:</span>
                                    <span className="font-medium">{formatDate(bill.due_date)}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-dashed">
                                    <span className="text-muted-foreground">VAT Mode:</span>
                                    <span className="font-medium uppercase">{bill.vat_mode}</span>
                                </div>
                            </div>
                        </div>

                        {/* Warehouse/Others */}
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center">
                                <MapPin size={16} className="mr-2" /> Warehouse & Other
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between py-1 border-b border-dashed">
                                    <span className="text-muted-foreground">Warehouse:</span>
                                    <span className="font-medium">{bill.warehouse?.name || "Main Warehouse"}</span>
                                </div>
                                <div className="flex justify-between py-1 border-b border-dashed">
                                    <span className="text-muted-foreground">Created By:</span>
                                    <span className="font-medium">{bill.creator?.name || "Admin"}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Line Items Table */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Bill Items</h3>
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th className="px-4 py-3 text-left">Product</th>
                                        <th className="px-4 py-3 text-right">Qty</th>
                                        <th className="px-4 py-3 text-left">Unit</th>
                                        <th className="px-4 py-3 text-right">Rate</th>
                                        <th className="px-4 py-3 text-right">Disc %</th>
                                        <th className="px-4 py-3 text-right">VAT %</th>
                                        <th className="px-4 py-3 text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bill.items?.map((item, idx) => (
                                        <tr key={idx} className="border-b last:border-0 hover:bg-muted/20">
                                            <td className="px-4 py-3 font-medium">{item.product?.name}</td>
                                            <td className="px-4 py-3 text-right">{item.quantity_in_purchase_uom}</td>
                                            <td className="px-4 py-3 text-left">{item.purchase_uom?.name || "Unit"}</td>
                                            <td className="px-4 py-3 text-right">{formatCurrency(item.unit_price_original)}</td>
                                            <td className="px-4 py-3 text-right">{item.trade_discount_pct + item.line_discount_pct}%</td>
                                            <td className="px-4 py-3 text-right">{item.vat_rate}%</td>
                                            <td className="px-4 py-3 text-right font-semibold">{formatCurrency(item.line_subtotal)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Totals Section */}
                    <div className="flex justify-end">
                        <div className="w-full sm:w-80 space-y-2 p-4 bg-muted/20 rounded-lg border">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal:</span>
                                <span>{formatCurrency(bill.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-green-600">
                                <span>Total Discount (-):</span>
                                <span>{formatCurrency(bill.trade_discount_amt + bill.line_discount_amt + bill.bill_discount_amt)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-semibold border-t pt-1">
                                <span>Taxable Amount:</span>
                                <span>{formatCurrency(bill.taxable_amount)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">VAT (+):</span>
                                <span>{formatCurrency(bill.vat_amount)}</span>
                            </div>
                            <div className="flex justify-between text-sm text-red-600">
                                <span>AIT (-):</span>
                                <span>{formatCurrency(bill.ait_amount)}</span>
                            </div>
                            <Separator className="my-1" />
                            <div className="flex justify-between text-lg font-bold text-primary">
                                <span>Grand Total:</span>
                                <span>{formatCurrency(bill.total_amount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {bill.notes && (
                        <div className="space-y-2 p-4 bg-amber-50/30 border border-amber-100 rounded-lg">
                            <h3 className="text-sm font-semibold flex items-center text-amber-800">
                                <AlertCircle size={14} className="mr-2" /> Notes / Remarks
                            </h3>
                            <p className="text-sm text-amber-900/80 whitespace-pre-line">{bill.notes}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
