'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Download, Printer } from 'lucide-react';
import { fetchBalanceSheet } from '@/services/reports';

export default function BalanceSheetPage() {
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
            const response = await fetchBalanceSheet({
                as_of_date: dateRange.asOfDate,
            });

            const apiData = response.data || {};
            const mockData = {
                assets: apiData.assets || {
                    current: {
                        cash: 0,
                        accountsReceivable: 0,
                        inventory: 0,
                        prepaidExpenses: 0,
                    },
                    fixed: {
                        propertyPlantEquipment: 0,
                        accumulatedDepreciation: 0,
                        intangibleAssets: 0,
                    },
                    other: {
                        longTermInvestments: 0,
                        deferredTaxAssets: 0,
                    },
                },
                liabilities: apiData.liabilities || {
                    current: {
                        accountsPayable: 0,
                        shortTermDebt: 0,
                        accruedExpenses: 0,
                        currentPortionLTDebt: 0,
                    },
                    longTerm: {
                        longTermDebt: 0,
                        deferredTaxLiabilities: 0,
                    },
                },
                equity: apiData.equity || {
                    commonStock: 0,
                    retainedEarnings: 0,
                    otherComprehensiveIncome: 0,
                },
            };

            const currentAssets = Object.values(mockData.assets.current).reduce((a, b) => a + b, 0);
            const fixedAssets =
                mockData.assets.fixed.propertyPlantEquipment +
                mockData.assets.fixed.accumulatedDepreciation +
                mockData.assets.fixed.intangibleAssets;
            const otherAssets = Object.values(mockData.assets.other).reduce((a, b) => a + b, 0);
            const totalAssets = currentAssets + fixedAssets + otherAssets;

            const currentLiabilities = Object.values(mockData.liabilities.current).reduce(
                (a, b) => a + b,
                0
            );
            const longTermLiabilities = Object.values(mockData.liabilities.longTerm).reduce(
                (a, b) => a + b,
                0
            );
            const totalLiabilities = currentLiabilities + longTermLiabilities;

            const totalEquity = Object.values(mockData.equity).reduce((a, b) => a + b, 0);

            setReportData({
                ...mockData,
                currentAssets,
                fixedAssets,
                otherAssets,
                totalAssets,
                currentLiabilities,
                longTermLiabilities,
                totalLiabilities,
                totalEquity,
                totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
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

                            {/* Report */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Assets */}
                                <div className="bg-white rounded-lg shadow p-8">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">ASSETS</h2>

                                    {/* Current Assets */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                            Current Assets
                                        </h3>
                                        <div className="space-y-2 ml-4">
                                            <ReportLine label="Cash" amount={reportData.assets.current.cash} />
                                            <ReportLine
                                                label="Accounts Receivable"
                                                amount={reportData.assets.current.accountsReceivable}
                                            />
                                            <ReportLine
                                                label="Inventory"
                                                amount={reportData.assets.current.inventory}
                                            />
                                            <ReportLine
                                                label="Prepaid Expenses"
                                                amount={reportData.assets.current.prepaidExpenses}
                                            />
                                            <div className="border-t border-gray-300 mt-2 pt-2">
                                                <ReportLine
                                                    label="Total Current Assets"
                                                    amount={reportData.currentAssets}
                                                    bold
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Fixed Assets */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                            Fixed Assets
                                        </h3>
                                        <div className="space-y-2 ml-4">
                                            <ReportLine
                                                label="Property, Plant & Equipment"
                                                amount={reportData.assets.fixed.propertyPlantEquipment}
                                            />
                                            <ReportLine
                                                label="Accumulated Depreciation"
                                                amount={reportData.assets.fixed.accumulatedDepreciation}
                                            />
                                            <ReportLine
                                                label="Intangible Assets"
                                                amount={reportData.assets.fixed.intangibleAssets}
                                            />
                                            <div className="border-t border-gray-300 mt-2 pt-2">
                                                <ReportLine
                                                    label="Total Fixed Assets"
                                                    amount={reportData.fixedAssets}
                                                    bold
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Other Assets */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                            Other Assets
                                        </h3>
                                        <div className="space-y-2 ml-4">
                                            <ReportLine
                                                label="Long-term Investments"
                                                amount={reportData.assets.other.longTermInvestments}
                                            />
                                            <ReportLine
                                                label="Deferred Tax Assets"
                                                amount={reportData.assets.other.deferredTaxAssets}
                                            />
                                            <div className="border-t border-gray-300 mt-2 pt-2">
                                                <ReportLine
                                                    label="Total Other Assets"
                                                    amount={reportData.otherAssets}
                                                    bold
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Total Assets */}
                                    <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300">
                                        <div className="flex justify-between">
                                            <span className="text-lg font-bold text-gray-900">TOTAL ASSETS</span>
                                            <span className="text-lg font-bold text-blue-600">
                                                ${reportData.totalAssets.toLocaleString('en-US', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Liabilities and Equity */}
                                <div className="bg-white rounded-lg shadow p-8">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                        LIABILITIES & EQUITY
                                    </h2>

                                    {/* Current Liabilities */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                            Current Liabilities
                                        </h3>
                                        <div className="space-y-2 ml-4">
                                            <ReportLine
                                                label="Accounts Payable"
                                                amount={reportData.liabilities.current.accountsPayable}
                                            />
                                            <ReportLine
                                                label="Short-term Debt"
                                                amount={reportData.liabilities.current.shortTermDebt}
                                            />
                                            <ReportLine
                                                label="Accrued Expenses"
                                                amount={reportData.liabilities.current.accruedExpenses}
                                            />
                                            <ReportLine
                                                label="Current Portion of LT Debt"
                                                amount={reportData.liabilities.current.currentPortionLTDebt}
                                            />
                                            <div className="border-t border-gray-300 mt-2 pt-2">
                                                <ReportLine
                                                    label="Total Current Liabilities"
                                                    amount={reportData.currentLiabilities}
                                                    bold
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Long-term Liabilities */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                                            Long-term Liabilities
                                        </h3>
                                        <div className="space-y-2 ml-4">
                                            <ReportLine
                                                label="Long-term Debt"
                                                amount={reportData.liabilities.longTerm.longTermDebt}
                                            />
                                            <ReportLine
                                                label="Deferred Tax Liabilities"
                                                amount={reportData.liabilities.longTerm.deferredTaxLiabilities}
                                            />
                                            <div className="border-t border-gray-300 mt-2 pt-2">
                                                <ReportLine
                                                    label="Total Long-term Liabilities"
                                                    amount={reportData.longTermLiabilities}
                                                    bold
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Total Liabilities */}
                                    <div className="bg-red-50 p-4 rounded-lg mb-6 border-2 border-red-300">
                                        <div className="flex justify-between">
                                            <span className="text-lg font-bold text-gray-900">
                                                TOTAL LIABILITIES
                                            </span>
                                            <span className="text-lg font-bold text-red-600">
                                                ${reportData.totalLiabilities.toLocaleString('en-US', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Equity */}
                                    <div className="mb-6">
                                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Equity</h3>
                                        <div className="space-y-2 ml-4">
                                            <ReportLine
                                                label="Common Stock"
                                                amount={reportData.equity.commonStock}
                                            />
                                            <ReportLine
                                                label="Retained Earnings"
                                                amount={reportData.equity.retainedEarnings}
                                            />
                                            <ReportLine
                                                label="Other Comprehensive Income"
                                                amount={reportData.equity.otherComprehensiveIncome}
                                            />
                                            <div className="border-t border-gray-300 mt-2 pt-2">
                                                <ReportLine
                                                    label="Total Equity"
                                                    amount={reportData.totalEquity}
                                                    bold
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Total Liabilities and Equity */}
                                    <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                                        <div className="flex justify-between">
                                            <span className="text-lg font-bold text-gray-900">
                                                TOTAL LIABILITIES & EQUITY
                                            </span>
                                            <span className="text-lg font-bold text-green-600">
                                                ${reportData.totalLiabilitiesAndEquity.toLocaleString('en-US', {
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
    return (
        <div className="flex justify-between items-center">
            <span className={bold ? 'font-bold text-gray-900' : 'text-gray-700'}>
                {label}
            </span>
            <span className={bold ? 'font-bold text-gray-900' : 'text-gray-700'}>
                ${amount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}
            </span>
        </div>
    );
}


