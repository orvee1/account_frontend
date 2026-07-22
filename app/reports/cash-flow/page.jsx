'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import { Download, Printer } from 'lucide-react';
import { fetchCashFlow } from '@/services/reports';

export default function CashFlowPage() {
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
            const response = await fetchCashFlow({
                from_date: dateRange.fromDate,
                to_date: dateRange.toDate,
            });

            const mockData = {
                netIncome: response.data?.netIncome || 0,
                depreciation: response.data?.depreciation || 0,
                amortization: response.data?.amortization || 0,
                changeAccountsReceivable: response.data?.changeAccountsReceivable || 0,
                changeInventory: response.data?.changeInventory || 0,
                changeAccountsPayable: response.data?.changeAccountsPayable || 0,
                changeAccruedExpenses: response.data?.changeAccruedExpenses || 0,
                changeWorkingCapital: response.data?.changeWorkingCapital || 0,
                capitalExpenditures: response.data?.capitalExpenditures || 0,
                purchaseInvestments: response.data?.purchaseInvestments || 0,
                saleInvestments: response.data?.saleInvestments || 0,
                acquisitionOfAssets: response.data?.acquisitionOfAssets || 0,
                proceedsFromDebt: response.data?.proceedsFromDebt || 0,
                paymentOfDebt: response.data?.paymentOfDebt || 0,
                issuedCommonStock: response.data?.issuedCommonStock || 0,
                dividendsPaid: response.data?.dividendsPaid || 0,
                interestPaid: response.data?.interestPaid || 0,
                beginningCash: response.data?.beginningCash || 0,
            };

            // Calculate totals
            const operatingCashFlow =
                mockData.netIncome +
                mockData.depreciation +
                mockData.amortization +
                mockData.changeAccountsReceivable +
                mockData.changeInventory +
                mockData.changeAccountsPayable +
                mockData.changeAccruedExpenses +
                mockData.changeWorkingCapital;

            const investingCashFlow =
                mockData.capitalExpenditures +
                mockData.purchaseInvestments +
                mockData.saleInvestments +
                mockData.acquisitionOfAssets;

            const financingCashFlow =
                mockData.proceedsFromDebt +
                mockData.paymentOfDebt +
                mockData.issuedCommonStock +
                mockData.dividendsPaid +
                mockData.interestPaid;

            const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;
            const beginningCash = mockData.beginningCash || 0;
            const endingCash = beginningCash + netCashFlow;

            setReportData({
                ...mockData,
                operatingCashFlow,
                investingCashFlow,
                financingCashFlow,
                netCashFlow,
                beginningCash,
                endingCash,
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
                            <div className="bg-white rounded-lg shadow p-8 max-w-3xl mx-auto">
                                {/* Operating Activities */}
                                <div className="mb-8">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                                        CASH FLOWS FROM OPERATING ACTIVITIES
                                    </h2>
                                    <div className="space-y-2 ml-4">
                                        <ReportLine label="Net Income" amount={reportData.netIncome} />
                                        <div className="text-sm text-gray-600 mt-2 mb-2">Adjustments:</div>
                                        <ReportLine label="Depreciation" amount={reportData.depreciation} indent />
                                        <ReportLine label="Amortization" amount={reportData.amortization} indent />
                                        <ReportLine
                                            label="(Increase) Decrease in Accounts Receivable"
                                            amount={reportData.changeAccountsReceivable}
                                            indent
                                        />
                                        <ReportLine
                                            label="(Increase) Decrease in Inventory"
                                            amount={reportData.changeInventory}
                                            indent
                                        />
                                        <ReportLine
                                            label="Increase (Decrease) in Accounts Payable"
                                            amount={reportData.changeAccountsPayable}
                                            indent
                                        />
                                        <ReportLine
                                            label="Increase (Decrease) in Accrued Expenses"
                                            amount={reportData.changeAccruedExpenses}
                                            indent
                                        />
                                        <ReportLine
                                            label="Change in Working Capital"
                                            amount={reportData.changeWorkingCapital}
                                            indent
                                        />
                                        <div className="border-t border-gray-300 mt-2 pt-2">
                                            <ReportLine
                                                label="NET CASH FROM OPERATING ACTIVITIES"
                                                amount={reportData.operatingCashFlow}
                                                bold
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Investing Activities */}
                                <div className="mb-8">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                                        CASH FLOWS FROM INVESTING ACTIVITIES
                                    </h2>
                                    <div className="space-y-2 ml-4">
                                        <ReportLine
                                            label="Capital Expenditures"
                                            amount={reportData.capitalExpenditures}
                                        />
                                        <ReportLine
                                            label="Purchase of Investments"
                                            amount={reportData.purchaseInvestments}
                                        />
                                        <ReportLine
                                            label="Sale of Investments"
                                            amount={reportData.saleInvestments}
                                        />
                                        <ReportLine
                                            label="Acquisition of Assets"
                                            amount={reportData.acquisitionOfAssets}
                                        />
                                        <div className="border-t border-gray-300 mt-2 pt-2">
                                            <ReportLine
                                                label="NET CASH FROM INVESTING ACTIVITIES"
                                                amount={reportData.investingCashFlow}
                                                bold
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Financing Activities */}
                                <div className="mb-8">
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">
                                        CASH FLOWS FROM FINANCING ACTIVITIES
                                    </h2>
                                    <div className="space-y-2 ml-4">
                                        <ReportLine
                                            label="Proceeds from Debt"
                                            amount={reportData.proceedsFromDebt}
                                        />
                                        <ReportLine
                                            label="Payment of Debt"
                                            amount={reportData.paymentOfDebt}
                                        />
                                        <ReportLine
                                            label="Issued Common Stock"
                                            amount={reportData.issuedCommonStock}
                                        />
                                        <ReportLine
                                            label="Dividends Paid"
                                            amount={reportData.dividendsPaid}
                                        />
                                        <ReportLine label="Interest Paid" amount={reportData.interestPaid} />
                                        <div className="border-t border-gray-300 mt-2 pt-2">
                                            <ReportLine
                                                label="NET CASH FROM FINANCING ACTIVITIES"
                                                amount={reportData.financingCashFlow}
                                                bold
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Net Change in Cash */}
                                <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-300 mb-6">
                                    <ReportLine
                                        label="NET INCREASE (DECREASE) IN CASH"
                                        amount={reportData.netCashFlow}
                                        bold
                                    />
                                </div>

                                {/* Cash Reconciliation */}
                                <div className="space-y-2">
                                    <ReportLine label="Cash at Beginning of Period" amount={reportData.beginningCash} />
                                    <div className="border-t border-gray-300 pt-2">
                                        <ReportLine
                                            label="CASH AT END OF PERIOD"
                                            amount={reportData.endingCash}
                                            bold
                                        />
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

function ReportLine({ label, amount, bold = false, indent = false }) {
    const isNegative = amount < 0;
    const displayAmount = Math.abs(amount);

    return (
        <div className={`flex justify-between items-center ${indent ? 'ml-6' : ''}`}>
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



