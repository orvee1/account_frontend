'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { getSalesInvoices, deleteSalesInvoice } from '@/services/sales';
import { useLanguage } from '@/contexts/LanguageContext';

export default function InvoicesPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const { t } = useLanguage();
    const [invoices, setInvoices] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        if (!dataLoaded) {
            loadInvoices();
            setDataLoaded(true);
        }
    }, [dataLoaded, currentPage, searchTerm, statusFilter, dateFrom, dateTo]);

    const loadInvoices = async () => {
        try {
            setIsLoading(true);
            const params = {
                per_page: 20,
                page: currentPage,
            };
            if (searchTerm) params.q = searchTerm;
            if (statusFilter) params.status = statusFilter;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;

            console.log('Fetching sales invoices...');
            const response = await getSalesInvoices(params);
            console.log('Sales invoices response:', response);

            setInvoices(response.data || []);
            setTotalPages(response.meta?.last_page || 1);
        } catch (error) {
            console.error('Error loading invoices:', error);
            setInvoices([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this invoice?')) {
            try {
                await deleteSalesInvoice(id);
                loadInvoices();
            } catch (error) {
                console.error('Error deleting invoice:', error);
            }
        }
    };

    if (isLoading && invoices.length === 0) {
        return <div className="p-4 md:p-6 text-center">Loading invoices...</div>;
    }

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Filters */}
            <div className="flex justify-end mb-6">
                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="mr-auto h-10 w-full rounded-lg border border-gray-300 px-4 py-2 sm:w-64 md:w-80"
                    />
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="h-10 rounded-lg border border-gray-300 px-4 py-2"
                    >
                        <option value="">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="sent">Sent</option>
                        <option value="paid">Paid</option>
                        <option value="partially_paid">Partially Paid</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                    <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => {
                            setDateFrom(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="h-10 rounded-lg border border-gray-300 px-4 py-2"
                    />
                    <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => {
                            setDateTo(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="h-10 rounded-lg border border-gray-300 px-4 py-2"
                    />
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setStatusFilter('');
                            setDateFrom('');
                            setDateTo('');
                            setCurrentPage(1);
                        }}
                        className="h-10 rounded-lg bg-gray-200 px-4 py-2 text-gray-800 hover:bg-gray-300"
                    >
                        Reset
                    </button>
                    <Link
                        href="/sales/invoices/new"
                        className="flex h-10 items-center rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
                    >
                        Create Invoice
                    </Link>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Invoice No
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Amount
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Paid
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {invoices.map((invoice) => (
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
                                                    : invoice.status === 'sent'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {invoice.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm flex gap-2">
                                        <Link
                                            href={`/sales/invoices/${invoice.id}`}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            View
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(invoice.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
                <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg disabled:opacity-50"
                >
                    Previous
                </button>
                <span className="text-gray-600">
                    Page {currentPage} of {totalPages}
                </span>
                <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
}
