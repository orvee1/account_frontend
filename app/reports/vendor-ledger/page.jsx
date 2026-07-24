'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import { Download, Printer } from 'lucide-react';
import { fetchVendorLedger } from '@/services/reports';

export default function VendorLedgerPage() {
    const { user, loading } = useAuth();
    const [filterVendor, setFilterVendor] = useState('all');
    const [dateRange, setDateRange] = useState({
        fromDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0],
    });
    const [isLoading, setIsLoading] = useState(true);
    const [reportData, setReportData] = useState(null);

    useEffect(() => {
        if (loading) return;
        if (user) {
            loadReport();
        } else {
            setIsLoading(false);
        }
    }, [user, loading, filterVendor, dateRange]);

    const loadReport = async () => {
        try {
            setIsLoading(true);
            const response = await fetchVendorLedger({
                from_date: dateRange.fromDate,
                to_date: dateRange.toDate,
            });

            const allTransactions = response.data?.vendorTransactions || [];
            const allSummaries = response.data?.vendorSummaries || [];

            let filtered = allTransactions;
            if (filterVendor !== 'all') {
                filtered = filtered.filter((v) => v.vendor === filterVendor);
            }

            setReportData({
                vendorTransactions: filtered,
                vendorSummaries: allSummaries,
                totalOutstanding: response.data?.totalOutstanding || 0,
                allVendors: response.data?.allVendors || [],
            });
        } catch (error) {
            console.error('Error loading report:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        alert('Export functionality coming soon');
    };

    if (loading || isLoading) {
        return <div className="p-4 md:p-6">Loading...</div>;
    }

    if (!reportData) {
        return <div className="p-4 md:p-6">No data available</div>;
    }

    return (
        <div>
            <div className="flex-1 flex flex-col bg-gray-50">
                <div className="flex flex-1">
                    <main className="flex-1 overflow-auto">
                        <div className="p-4 md:p-6">
                            {/* Filters */}
                            <div className="bg-white rounded-lg shadow p-6 mb-6">
                                <div className="flex flex-wrap items-end justify-end gap-4">
                                    <div className="w-full sm:w-56">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Vendor
                                        </label>
                                        <select
                                            value={filterVendor}
                                            onChange={(e) => setFilterVendor(e.target.value)}
                                            className="h-11 px-3 py-2 border border-gray-300 rounded-lg w-full"
                                        >
                                            <option value="all">All Vendors</option>
                                            {reportData.allVendors.map((v) => (
                                                <option key={v} value={v}>
                                                    {v}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-full sm:w-52">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            From Date
                                        </label>
                                        <input
                                            type="date"
                                            value={dateRange.fromDate}
                                            onChange={(e) =>
                                                setDateRange({ ...dateRange, fromDate: e.target.value })
                                            }
                                            className="h-11 px-3 py-2 border border-gray-300 rounded-lg w-full"
                                        />
                                    </div>
                                    <div className="w-full sm:w-52">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            To Date
                                        </label>
                                        <input
                                            type="date"
                                            value={dateRange.toDate}
                                            onChange={(e) => setDateRange({ ...dateRange, toDate: e.target.value })}
                                            className="h-11 px-3 py-2 border border-gray-300 rounded-lg w-full"
                                        />
                                    </div>
                                    <button
                                        onClick={handlePrint}
                                        className="flex h-11 items-center gap-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <Printer className="w-4 h-4" />
                                        Print
                                    </button>
                                    <button
                                        onClick={handleExport}
                                        className="flex h-11 items-center gap-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        <Download className="w-4 h-4" />
                                        Export
                                    </button>
                                </div>
                            </div>

                            {/* Summary Card */}
                            <div className="bg-white rounded-lg shadow p-6 mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium mb-1">Total Vendors</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {reportData.allVendors.length}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium mb-1">Total Outstanding</p>
                                        <p className="text-2xl font-bold text-red-600">
                                            $
                                            {reportData.totalOutstanding.toLocaleString('en-US', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-gray-600 text-sm font-medium mb-1">Report Period</p>
                                        <p className="text-sm text-gray-700">
                                            {new Date(dateRange.fromDate).toLocaleDateString()} -{' '}
                                            {new Date(dateRange.toDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Vendor Summary Table */}
                            <div className="bg-white rounded-lg shadow mb-8 overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Vendor Name
                                            </th>
                                            <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                Total Purchases
                                            </th>
                                            <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                Total Payments
                                            </th>
                                            <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                Outstanding Balance
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.vendorSummaries.map((summary, index) => (
                                            <tr
                                                key={index}
                                                className="border-b border-gray-200 hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {summary.vendor}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-gray-700">
                                                    $
                                                    {summary.totalPurchases.toLocaleString('en-US', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-gray-700">
                                                    $
                                                    {summary.totalPayments.toLocaleString('en-US', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </td>
                                                <td
                                                    className={`px-6 py-4 text-right text-sm font-semibold ${summary.outstanding > 0
                                                        ? 'text-red-600'
                                                        : 'text-green-600'
                                                        }`}
                                                >
                                                    $
                                                    {summary.outstanding.toLocaleString('en-US', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Detailed Transactions by Vendor */}
                            {reportData.vendorTransactions.map((vendor, vendorIndex) => (
                                <div key={vendorIndex} className="bg-white rounded-lg shadow mb-6 overflow-x-auto">
                                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                        <h3 className="text-lg font-bold text-gray-900">{vendor.vendor}</h3>
                                    </div>
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-100 border-b border-gray-300">
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900">
                                                    Date
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900">
                                                    Reference
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-900">
                                                    Description
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-900">
                                                    Debit
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-900">
                                                    Credit
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-900">
                                                    Balance
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {vendor.transactions.map((transaction, txnIndex) => (
                                                <tr
                                                    key={txnIndex}
                                                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                                                >
                                                    <td className="px-6 py-3 text-xs text-gray-700">
                                                        {new Date(transaction.date).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-3 text-xs text-gray-700">
                                                        {transaction.ref}
                                                    </td>
                                                    <td className="px-6 py-3 text-xs text-gray-700">
                                                        {transaction.description}
                                                    </td>
                                                    <td className="px-6 py-3 text-right text-xs text-gray-700">
                                                        {transaction.debit > 0
                                                            ? '$' +
                                                            transaction.debit.toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })
                                                            : '-'}
                                                    </td>
                                                    <td className="px-6 py-3 text-right text-xs text-gray-700">
                                                        {transaction.credit > 0
                                                            ? '$' +
                                                            transaction.credit.toLocaleString('en-US', {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            })
                                                            : '-'}
                                                    </td>
                                                    <td
                                                        className={`px-6 py-3 text-right text-xs font-semibold ${transaction.balance < 0
                                                            ? 'text-red-600'
                                                            : 'text-green-600'
                                                            }`}
                                                    >
                                                        ${Math.abs(transaction.balance).toLocaleString(
                                                            'en-US',
                                                            {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            }
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ))}

                            {/* Footer */}
                            <div className="text-center text-sm text-gray-600 mt-8">
                                <p>Generated on {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}



