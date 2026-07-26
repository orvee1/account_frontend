'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import { Download, Printer } from 'lucide-react';
import { fetchTrialBalance } from '@/services/reports';

export default function TrialBalancePage() {
    const { user, loading } = useAuth();
    const [dateRange, setDateRange] = useState({
        asOfDate: new Date().toISOString().split('T')[0],
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
    }, [user, loading, dateRange]);

    const loadReport = async () => {
        try {
            setIsLoading(true);
            const response = await fetchTrialBalance({
                as_of_date: dateRange.asOfDate,
            });

            const accounts = response.data?.accounts || [];
            const totalDebit = response.data?.totalDebit ?? accounts.reduce((sum, acc) => sum + (acc.debit || 0), 0);
            const totalCredit = response.data?.totalCredit ?? accounts.reduce((sum, acc) => sum + (acc.credit || 0), 0);

            setReportData({
                accounts,
                totalDebit,
                totalCredit,
                isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
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
                            {/* Date Filter */}
                            <div className="bg-white rounded-lg shadow p-6 mb-6">
                                <div className="flex flex-wrap items-end justify-end gap-4">
                                    <div className="w-full sm:w-52">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        As of Date
                                    </label>
                                    <input
                                        type="date"
                                        value={dateRange.asOfDate}
                                        onChange={(e) => setDateRange({ asOfDate: e.target.value })}
                                        className="h-11 w-full px-3 py-2 border border-gray-300 rounded-lg"
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

                            {/* Balance Status */}
                            {!reportData.isBalanced && (
                                <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded mb-6">
                                    ⚠️ Trial Balance is NOT balanced. Difference: $
                                    {Math.abs(reportData.totalDebit - reportData.totalCredit).toFixed(2)}
                                </div>
                            )}

                            {/* Table */}
                            <div className="bg-white rounded-lg shadow overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Account Name
                                            </th>
                                            <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                Debit
                                            </th>
                                            <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                Credit
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.accounts.map((account, index) => (
                                            <tr
                                                key={index}
                                                className="border-b border-gray-200 hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-4 text-sm text-gray-700">{account.name}</td>
                                                <td className="px-6 py-4 text-right text-sm text-gray-700">
                                                    {account.debit > 0
                                                        ? '$' +
                                                        account.debit.toLocaleString('en-US', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })
                                                        : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-gray-700">
                                                    {account.credit > 0
                                                        ? '$' +
                                                        account.credit.toLocaleString('en-US', {
                                                            minimumFractionDigits: 2,
                                                            maximumFractionDigits: 2,
                                                        })
                                                        : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Total Row */}
                                        <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                                            <td className="px-6 py-4 text-sm text-gray-900">TOTAL</td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-900">
                                                $
                                                {reportData.totalDebit.toLocaleString('en-US', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-900">
                                                $
                                                {reportData.totalCredit.toLocaleString('en-US', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer */}
                            <div className="text-center text-sm text-gray-600 mt-8">
                                <p>
                                    {reportData.isBalanced
                                        ? '✓ Trial Balance is balanced'
                                        : '✗ Trial Balance is NOT balanced'}
                                </p>
                                <p>Generated on {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}


