'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import Link from 'next/link';
import { getSalesInvoices } from '@/services/sales';
import { useLanguage } from '@/contexts/LanguageContext';

export default function SalesPage() {
    const { user, loading } = useAuth();
    const { t } = useLanguage();
    const [invoices, setInvoices] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [paidAmount, setPaidAmount] = useState(0);
    const [pendingAmount, setPendingAmount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [appliedSearchTerm, setAppliedSearchTerm] = useState('');

    useEffect(() => {
        if (loading) return;
        if (user) {
            loadInvoices();
        } else {
            setIsLoading(false);
        }
    }, [user, loading]);

    const loadInvoices = async () => {
        try {
            const response = await getSalesInvoices({ per_page: 10 });
            setInvoices(response.data);

            // Calculate totals
            const total = response.data.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0);
            const paid = response.data.reduce((sum, inv) => sum + parseFloat(inv.paid_amount), 0);

            setTotalAmount(total);
            setPaidAmount(paid);
            setPendingAmount(total - paid);
        } catch (error) {
            console.error('Error loading invoices:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredInvoices = useMemo(() => {
        const term = appliedSearchTerm.trim().toLowerCase();
        if (!term) return invoices;

        return invoices.filter((invoice) =>
            [
                invoice.invoice_no,
                invoice.customer?.name,
                invoice.invoice_date,
                invoice.status,
                invoice.total_amount,
                invoice.paid_amount,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(term))
        );
    }, [invoices, appliedSearchTerm]);

    if (loading || isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <div className="flex-1 flex flex-col bg-gray-50">
                <div className="flex flex-1">
                    <main className="flex-1 overflow-auto">
                        <div className="p-8">
                            <div className="mb-6 flex justify-end">
                                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                                    <input
                                        type="text"
                                        placeholder="Search by invoice or customer..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && setAppliedSearchTerm(searchTerm)}
                                        className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm sm:w-64 md:w-80"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setAppliedSearchTerm(searchTerm)}
                                        className="h-10 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                                    >
                                        Search
                                    </button>
                                    <Link
                                        href="/sales/invoices/new"
                                        className="flex h-10 items-center rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                                    >
                                        Create Invoice
                                    </Link>
                                </div>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-2">Total Sales</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {totalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-2">Paid Amount</p>
                                    <p className="text-3xl font-bold text-green-600">
                                        {paidAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-2">Pending Amount</p>
                                    <p className="text-3xl font-bold text-red-600">
                                        {pendingAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-2">Total Invoices</p>
                                    <p className="text-3xl font-bold text-blue-600">{invoices.length}</p>
                                </div>
                            </div>

                            {/* Recent Invoices */}
                            <div className="bg-white rounded-lg shadow overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold text-gray-900">Recent Invoices</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice No</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {filteredInvoices.map((invoice) => (
                                                <tr key={invoice.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                        {invoice.invoice_no}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-700">
                                                        {invoice.customer?.name || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-700">
                                                        {new Date(invoice.invoice_date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                                        {parseFloat(invoice.total_amount).toLocaleString('en-US', {
                                                            style: 'currency',
                                                            currency: 'USD',
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                                        {parseFloat(invoice.paid_amount).toLocaleString('en-US', {
                                                            style: 'currency',
                                                            currency: 'USD',
                                                        })}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-medium ${invoice.status === 'paid'
                                                                ? 'bg-green-100 text-green-800'
                                                                : invoice.status === 'partially_paid'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-gray-100 text-gray-800'
                                                                }`}
                                                        >
                                                            {invoice.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <Link
                                                            href={`/sales/invoices/${invoice.id}`}
                                                            className="text-blue-600 hover:text-blue-900 font-medium"
                                                        >
                                                            View
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredInvoices.length === 0 && (
                                                <tr>
                                                    <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                                                        {appliedSearchTerm
                                                            ? `No invoices found for "${appliedSearchTerm}".`
                                                            : 'No invoices found.'}
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}


