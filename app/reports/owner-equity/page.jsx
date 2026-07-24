'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import { Download, Printer } from 'lucide-react';
import { fetchOwnersEquity } from '@/services/reports';

export default function OwnerEquityPage() {
    const { user, loading } = useAuth();
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
    }, [user, loading, dateRange]);

    const loadReport = async () => {
        try {
            setIsLoading(true);
            const response = await fetchOwnersEquity({
                start_date: dateRange.fromDate,
                as_of_date: dateRange.toDate,
            });

            const items = response.data?.equity?.items || [];
            const commonStock = items
                .filter((i) => {
                    const name = (i.name || '').toLowerCase();
                    return name.includes('capital') || name.includes('share');
                })
                .reduce((sum, i) => sum + (i.amount || 0), 0);
            const retainedEarnings = items
                .filter((i) => (i.name || '').toLowerCase().includes('retained'))
                .reduce((sum, i) => sum + (i.amount || 0), 0);
            const otherEquity = items
                .filter((i) => {
                    const name = (i.name || '').toLowerCase();
                    return !name.includes('capital') && !name.includes('share') && !name.includes('retained');
                })
                .reduce((sum, i) => sum + (i.amount || 0), 0);

            const mockData = {
                beginningCommonStock: 0,
                commonStockIssued: 0,
                endingCommonStock: commonStock,
                beginningRetainedEarnings: 0,
                netIncome: response.data?.netIncome || 0,
                dividendsPaid: 0,
                otherAdjustments: 0,
                endingRetainedEarnings: retainedEarnings,
                beginningComprehensiveIncome: 0,
                comprehensiveIncome: 0,
                endingComprehensiveIncome: otherEquity,
            };

            const endingTotalEquity =
                mockData.endingCommonStock +
                mockData.endingRetainedEarnings +
                mockData.endingComprehensiveIncome;
            const beginningTotalEquity =
                mockData.beginningCommonStock +
                mockData.beginningRetainedEarnings +
                mockData.beginningComprehensiveIncome;
            const changeInEquity = endingTotalEquity - beginningTotalEquity;

            setReportData({
                ...mockData,
                endingTotalEquity,
                beginningTotalEquity,
                changeInEquity,
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
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

                            {/* Report */}
                            <div className="bg-white rounded-lg shadow p-8">
                                {/* Common Stock Section */}
                                <div className="mb-8">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Common Stock</h2>
                                    <div className="space-y-2 ml-4">
                                        <ReportLine
                                            label="Beginning Balance"
                                            amount={reportData.beginningCommonStock}
                                        />
                                        <ReportLine
                                            label="Stock Issued During Period"
                                            amount={reportData.commonStockIssued}
                                        />
                                        <div className="border-t border-gray-300 mt-2 pt-2">
                                            <ReportLine
                                                label="Ending Balance"
                                                amount={reportData.endingCommonStock}
                                                bold
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Retained Earnings Section */}
                                <div className="mb-8">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Retained Earnings</h2>
                                    <div className="space-y-2 ml-4">
                                        <ReportLine
                                            label="Beginning Balance"
                                            amount={reportData.beginningRetainedEarnings}
                                        />
                                        <ReportLine label="Add: Net Income" amount={reportData.netIncome} />
                                        <ReportLine
                                            label="Less: Dividends Paid"
                                            amount={-reportData.dividendsPaid}
                                        />
                                        <ReportLine
                                            label="Other Adjustments"
                                            amount={reportData.otherAdjustments}
                                        />
                                        <div className="border-t border-gray-300 mt-2 pt-2">
                                            <ReportLine
                                                label="Ending Balance"
                                                amount={reportData.endingRetainedEarnings}
                                                bold
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Other Comprehensive Income */}
                                <div className="mb-8">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                                        Other Comprehensive Income
                                    </h2>
                                    <div className="space-y-2 ml-4">
                                        <ReportLine
                                            label="Beginning Balance"
                                            amount={reportData.beginningComprehensiveIncome}
                                        />
                                        <ReportLine
                                            label="Comprehensive Income"
                                            amount={reportData.comprehensiveIncome}
                                        />
                                        <div className="border-t border-gray-300 mt-2 pt-2">
                                            <ReportLine
                                                label="Ending Balance"
                                                amount={reportData.endingComprehensiveIncome}
                                                bold
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Total Equity */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                                        <div className="flex justify-between mb-2">
                                            <span className="text-sm text-gray-600">Beginning Total Equity</span>
                                            <span className="font-bold text-blue-600">
                                                ${reportData.beginningTotalEquity.toLocaleString('en-US', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Ending Total Equity</span>
                                            <span className="font-bold text-blue-600">
                                                ${reportData.endingTotalEquity.toLocaleString('en-US', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    <div
                                        className={`p-4 rounded-lg border-2 ${reportData.changeInEquity >= 0
                                            ? 'bg-green-50 border-green-300'
                                            : 'bg-red-50 border-red-300'
                                            }`}
                                    >
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Change in Equity</span>
                                            <span
                                                className={`font-bold ${reportData.changeInEquity >= 0
                                                    ? 'text-green-600'
                                                    : 'text-red-600'
                                                    }`}
                                            >
                                                ${reportData.changeInEquity.toLocaleString('en-US', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

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

function ReportLine({ label, amount, bold = false }) {
    const isNegative = amount < 0;
    const displayAmount = Math.abs(amount);

    return (
        <div className="flex justify-between items-center">
            <span className={bold ? 'font-bold text-gray-900' : 'text-gray-700'}>
                {label}
            </span>
            <span className={bold ? 'font-bold text-gray-900' : 'text-gray-700'}>
                {isNegative ? '(' : ''}${displayAmount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}
                {isNegative ? ')' : ''}
            </span>
        </div>
    );
}



