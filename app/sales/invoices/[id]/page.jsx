'use client';

import { toDateInput } from "@/utils/accounting-date.mjs";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getSalesInvoice, recordSalesPayment, createSalesReturn } from '@/services/sales';

export default function InvoiceDetailPage() {
    const params = useParams();
    const [invoice, setInvoice] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('');
    const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

    useEffect(() => {
        if (!dataLoaded) {
            loadInvoice();
            setDataLoaded(true);
        }
    }, [dataLoaded, params.id]);

    const loadInvoice = async () => {
        try {
            setIsLoading(true);
            console.log('Loading invoice:', params.id);
            const response = await getSalesInvoice(params.id);
            console.log('Invoice response:', response);
            setInvoice(response.data || null);
        } catch (error) {
            console.error('Error loading invoice:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        if (!paymentAmount || !paymentMethod) {
            alert('Please enter amount and select payment method');
            return;
        }

        try {
            setIsSubmittingPayment(true);
            await recordSalesPayment(params.id, {
                amount: parseFloat(paymentAmount),
                payment_method: paymentMethod,
                payment_date: toDateInput(),
            });
            setPaymentAmount('');
            setPaymentMethod('');
            loadInvoice(); // Reload invoice data
        } catch (error) {
            console.error('Error recording payment:', error);
            alert('Error recording payment');
        } finally {
            setIsSubmittingPayment(false);
        }
    };

    if (isLoading && !invoice) {
        return <div className="p-8 text-center">Loading invoice...</div>;
    }

    if (!invoice) {
        return <div className="p-8 text-center text-red-600">Invoice not found</div>;
    }

    const pendingAmount = invoice.total_amount - invoice.paid_amount;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{invoice.invoice_no}</h1>
                    <p className="text-gray-600 mt-1">
                        {new Date(invoice.invoice_date).toLocaleDateString()}
                    </p>
                </div>
                <Link
                    href="/sales/invoices"
                    className="text-blue-600 hover:text-blue-900"
                >
                    Back to Invoices
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Invoice Details */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoice Details</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Customer</p>
                                <p className="text-lg font-medium text-gray-900">
                                    {invoice.customer?.name || 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Due Date</p>
                                <p className="text-lg font-medium text-gray-900">
                                    {invoice.due_date
                                        ? new Date(invoice.due_date).toLocaleDateString()
                                        : 'Not set'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Items */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-xl font-semibold text-gray-900">Items</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Product
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Qty
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Unit Price
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Amount
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {invoice.items?.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {item.product?.name || 'Unknown'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {item.quantity}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {parseFloat(item.unit_price).toLocaleString('en-US', {
                                                    style: 'currency',
                                                    currency: 'USD',
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {parseFloat(item.line_total).toLocaleString('en-US', {
                                                    style: 'currency',
                                                    currency: 'USD',
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Payments */}
                    {invoice.payments && invoice.payments.length > 0 && (
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="text-xl font-semibold text-gray-900">Payment History</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Date
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Amount
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                Method
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {invoice.payments.map((payment) => (
                                            <tr key={payment.id}>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {new Date(payment.payment_date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                    {parseFloat(payment.amount).toLocaleString('en-US', {
                                                        style: 'currency',
                                                        currency: 'USD',
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {payment.payment_method || 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Totals */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium text-gray-900">
                                    {parseFloat(invoice.subtotal).toLocaleString('en-US', {
                                        style: 'currency',
                                        currency: 'USD',
                                    })}
                                </span>
                            </div>
                            {invoice.discount_total > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Discount</span>
                                    <span className="font-medium text-gray-900">
                                        -{parseFloat(invoice.discount_total).toLocaleString('en-US', {
                                            style: 'currency',
                                            currency: 'USD',
                                        })}
                                    </span>
                                </div>
                            )}
                            {invoice.tax_amount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Tax</span>
                                    <span className="font-medium text-gray-900">
                                        {parseFloat(invoice.tax_amount).toLocaleString('en-US', {
                                            style: 'currency',
                                            currency: 'USD',
                                        })}
                                    </span>
                                </div>
                            )}
                            <div className="border-t pt-3 flex justify-between">
                                <span className="font-semibold text-gray-900">Total</span>
                                <span className="font-bold text-lg text-gray-900">
                                    {parseFloat(invoice.total_amount).toLocaleString('en-US', {
                                        style: 'currency',
                                        currency: 'USD',
                                    })}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm bg-blue-50 p-3 rounded">
                                <span className="text-gray-600">Paid</span>
                                <span className="font-medium text-blue-900">
                                    {parseFloat(invoice.paid_amount).toLocaleString('en-US', {
                                        style: 'currency',
                                        currency: 'USD',
                                    })}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm bg-red-50 p-3 rounded">
                                <span className="text-gray-600">Pending</span>
                                <span className="font-medium text-red-900">
                                    {pendingAmount.toLocaleString('en-US', {
                                        style: 'currency',
                                        currency: 'USD',
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Record Payment */}
                    {pendingAmount > 0 && (
                        <div className="bg-white rounded-lg shadow p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Payment</h3>
                            <form onSubmit={handleRecordPayment} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Amount
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={paymentAmount}
                                        onChange={(e) => setPaymentAmount(e.target.value)}
                                        max={pendingAmount}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Payment Method
                                    </label>
                                    <select
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="">Select Method</option>
                                        <option value="cash">Cash</option>
                                        <option value="bank_transfer">Bank Transfer</option>
                                        <option value="check">Check</option>
                                        <option value="card">Card</option>
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmittingPayment}
                                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                                >
                                    {isSubmittingPayment ? 'Processing...' : 'Record Payment'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Status Badge */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
                        <span
                            className={`px-4 py-2 rounded-full text-sm font-medium ${invoice.status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : invoice.status === 'partially_paid'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : invoice.status === 'sent'
                                        ? 'bg-blue-100 text-blue-800'
                                        : 'bg-gray-100 text-gray-800'
                                }`}
                        >
                            {invoice.status}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
