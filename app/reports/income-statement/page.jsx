'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import { Download, Printer } from 'lucide-react';
import { fetchIncomeStatement } from '@/services/reports';

export default function IncomeStatementPage() {
    const { user, loading } = useAuth();
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
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
            const response = await fetchIncomeStatement({
                start_date: dateRange.startDate,
                end_date: dateRange.endDate,
            });

            const apiData = response.data || {};
            const mockData = {
                revenue: apiData.revenue || {
                    salesRevenue: 0,
                    serviceRevenue: 0,
                    otherIncome: 0,
                },
                costOfGoods: apiData.costOfGoods || {
                    costOfSales: 0,
                    directCosts: 0,
                },
                expenses: apiData.expenses || {
                    salaries: 0,
                    rent: 0,
                    utilities: 0,
                    marketing: 0,
                    depreciation: 0,
                    otherExpenses: 0,
                },
            };

            const totalRevenue = Object.values(mockData.revenue).reduce((a, b) => a + b, 0);
            const costOfGoods = Object.values(mockData.costOfGoods).reduce((a, b) => a + b, 0);
            const grossProfit = totalRevenue - costOfGoods;
            const totalExpenses = Object.values(mockData.expenses).reduce((a, b) => a + b, 0);
            const netIncome = grossProfit - totalExpenses;

            setReportData({
                ...mockData,
                totalRevenue,
                costOfGoods,
                grossProfit,
                grossProfitPercentage: ((grossProfit / totalRevenue) * 100).toFixed(2),
                totalExpenses,
                netIncome,
                netIncomePercentage: ((netIncome / totalRevenue) * 100).toFixed(2),
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
        // TODO: Implement export to PDF/Excel
        alert('Export functionality coming soon');
    };

    if (loading || isLoading) {
        return <div className="p-8">Loading...</div>;
    }

    if (!reportData) {
        return <div className="p-8">No data available</div>;
    }

    return (
        <div>
            <div className="flex-1 flex flex-col bg-gray-50">
                <div className="flex flex-1">
                    <main className="flex-1 overflow-auto">
                        <div className="p-8">
                            {/* Date Range Filter */}
                            <div className="bg-white rounded-lg shadow p-6 mb-6">
                                <div className="flex flex-wrap items-end justify-end gap-4">
                                    <div className="w-full sm:w-52">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Start Date
                                        </label>
                                        <input
                                            type="date"
                                            value={dateRange.startDate}
                                            onChange={(e) =>
                                                setDateRange({ ...dateRange, startDate: e.target.value })
                                            }
                                            className="h-11 w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div className="w-full sm:w-52">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            End Date
                                        </label>
                                        <input
                                            type="date"
                                            value={dateRange.endDate}
                                            onChange={(e) =>
                                                setDateRange({ ...dateRange, endDate: e.target.value })
                                            }
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
                            <div className="bg-white rounded-lg shadow print:shadow-none">
                                <div className="p-8">
                                    {/* Company Header */}
                                    <div className="text-center mb-8 print:mb-4">
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {user?.company?.name || 'Company Name'}
                                        </h2>
                                        <p className="text-gray-600">Income Statement (Profit & Loss)</p>
                                    </div>

                                    {/* Revenue Section */}
                                    <div className="mb-8">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue</h3>
                                        <div className="space-y-2 ml-4">
                                            <ReportLine
                                                label="Sales Revenue"
                                                amount={reportData.revenue.salesRevenue}
                                            />
                                            <ReportLine
                                                label="Service Revenue"
                                                amount={reportData.revenue.serviceRevenue}
                                            />
                                            <ReportLine
                                                label="Other Income"
                                                amount={reportData.revenue.otherIncome}
                                            />
                                            <div className="border-t border-gray-300 mt-2 pt-2">
                                                <ReportLine
                                                    label="Total Revenue"
                                                    amount={reportData.totalRevenue}
                                                    bold
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cost of Goods Sold */}
                                    <div className="mb-8">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                                            Cost of Goods Sold
                                        </h3>
                                        <div className="space-y-2 ml-4">
                                            <ReportLine
                                                label="Cost of Sales"
                                                amount={reportData.costOfGoods.costOfSales}
                                            />
                                            <ReportLine
                                                label="Direct Costs"
                                                amount={reportData.costOfGoods.directCosts}
                                            />
                                            <div className="border-t border-gray-300 mt-2 pt-2">
                                                <ReportLine
                                                    label="Total COGS"
                                                    amount={reportData.costOfGoods}
                                                    bold
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Gross Profit */}
                                    <div className="mb-8 bg-blue-50 p-4 rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-bold text-gray-900">Gross Profit</span>
                                            <div className="text-right">
                                                <p className="text-xl font-bold text-blue-600">
                                                    ${reportData.grossProfit.toLocaleString('en-US', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {reportData.grossProfitPercentage}% of revenue
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Operating Expenses */}
                                    <div className="mb-8">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                                            Operating Expenses
                                        </h3>
                                        <div className="space-y-2 ml-4">
                                            <ReportLine label="Salaries" amount={reportData.expenses.salaries} />
                                            <ReportLine label="Rent" amount={reportData.expenses.rent} />
                                            <ReportLine label="Utilities" amount={reportData.expenses.utilities} />
                                            <ReportLine label="Marketing" amount={reportData.expenses.marketing} />
                                            <ReportLine
                                                label="Depreciation"
                                                amount={reportData.expenses.depreciation}
                                            />
                                            <ReportLine
                                                label="Other Expenses"
                                                amount={reportData.expenses.otherExpenses}
                                            />
                                            <div className="border-t border-gray-300 mt-2 pt-2">
                                                <ReportLine
                                                    label="Total Operating Expenses"
                                                    amount={reportData.totalExpenses}
                                                    bold
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Net Income */}
                                    <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xl font-bold text-gray-900">Net Income</span>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-green-600">
                                                    ${reportData.netIncome.toLocaleString('en-US', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {reportData.netIncomePercentage}% of revenue
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="mt-8 pt-8 border-t border-gray-300 text-center text-sm text-gray-600">
                                        <p>Generated on {new Date().toLocaleDateString()}</p>
                                        <p>This is a confidential document for authorized personnel only</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

function ReportLine({ label, amount, bold = false }) {
    const formattedAmount = (() => {
        if (typeof amount === 'number') return amount;
        if (!amount || typeof amount !== 'object') return 0;
        return Object.values(amount).reduce((a, b) => a + (Number(b) || 0), 0);
    })();
    return (
        <div className="flex justify-between items-center">
            <span className={bold ? 'font-bold text-gray-900' : 'text-gray-700'}>
                {label}
            </span>
            <span className={bold ? 'font-bold text-gray-900' : 'text-gray-700'}>
                ${formattedAmount.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}
            </span>
        </div>
    );
}


