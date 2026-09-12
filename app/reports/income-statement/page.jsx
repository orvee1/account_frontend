'use client';

import { toDateInput } from '@/utils/accounting-date.mjs';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import {
    Download,
    Printer,
} from 'lucide-react';

import {
    fetchIncomeStatement,
} from '@/services/reports';

/*
|--------------------------------------------------------------------------
| Empty Report Shape
|--------------------------------------------------------------------------
*/

const EMPTY_REPORT = {
    revenue: {
        salesRevenue: 0,
        serviceRevenue: 0,
        otherIncome: 0,
    },

    costOfGoods: {
        costOfSales: 0,
        directCosts: 0,
    },

    expenses: {
        salaries: 0,
        rent: 0,
        utilities: 0,
        marketing: 0,
        depreciation: 0,
        otherExpenses: 0,
    },

    salesBreakdown: {
        grossSales: 0,
        salesReturns: 0,
        netSales: 0,

        grossCostOfSales: 0,
        salesReturnCostReversal: 0,
        netCostOfSales: 0,
    },
};

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function toNumber(value) {
    const number = Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
}

function roundMoney(value) {
    return Math.round(
        (toNumber(value) + Number.EPSILON) * 100
    ) / 100;
}

function formatCurrency(value) {
    const amount = toNumber(value);

    const sign =
        amount < 0
            ? '-'
            : '';

    return `${sign}৳${Math.abs(amount).toLocaleString(
        'en-US',
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }
    )}`;
}

function formatDate(value) {
    if (!value) {
        return '';
    }

    const date = new Date(
        `${value}T00:00:00`
    );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }

    return date.toLocaleDateString(
        'en-US',
        {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }
    );
}

/*
|--------------------------------------------------------------------------
| Normalize API Response
|--------------------------------------------------------------------------
|
| Backend now returns:
|
| revenue
| costOfGoods
| expenses
| salesBreakdown
|
| salesBreakdown contains:
|
| grossSales
| salesReturns
| netSales
| grossCostOfSales
| salesReturnCostReversal
| netCostOfSales
|
*/

function normalizeReportData(
    apiData = {}
) {
    const revenue = {
        salesRevenue:
            toNumber(
                apiData.revenue?.salesRevenue
            ),

        serviceRevenue:
            toNumber(
                apiData.revenue?.serviceRevenue
            ),

        otherIncome:
            toNumber(
                apiData.revenue?.otherIncome
            ),
    };

    const costOfGoods = {
        costOfSales:
            toNumber(
                apiData.costOfGoods?.costOfSales
            ),

        directCosts:
            toNumber(
                apiData.costOfGoods?.directCosts
            ),
    };

    const expenses = {
        salaries:
            toNumber(
                apiData.expenses?.salaries
            ),

        rent:
            toNumber(
                apiData.expenses?.rent
            ),

        utilities:
            toNumber(
                apiData.expenses?.utilities
            ),

        marketing:
            toNumber(
                apiData.expenses?.marketing
            ),

        depreciation:
            toNumber(
                apiData.expenses?.depreciation
            ),

        otherExpenses:
            toNumber(
                apiData.expenses?.otherExpenses
            ),
    };

    /*
    |--------------------------------------------------------------------------
    | Sales Breakdown
    |--------------------------------------------------------------------------
    |
    | Fallback behaviour is intentionally retained so the page still works
    | if an older backend response does not contain salesBreakdown.
    |
    */

    const hasBreakdown =
        apiData.salesBreakdown &&
        typeof apiData.salesBreakdown ===
        'object';

    const salesBreakdown = {
        grossSales:
            hasBreakdown
                ? toNumber(
                    apiData.salesBreakdown
                        ?.grossSales
                )
                : revenue.salesRevenue,

        salesReturns:
            hasBreakdown
                ? toNumber(
                    apiData.salesBreakdown
                        ?.salesReturns
                )
                : 0,

        netSales:
            hasBreakdown
                ? toNumber(
                    apiData.salesBreakdown
                        ?.netSales
                )
                : revenue.salesRevenue,

        grossCostOfSales:
            hasBreakdown
                ? toNumber(
                    apiData.salesBreakdown
                        ?.grossCostOfSales
                )
                : costOfGoods.costOfSales,

        salesReturnCostReversal:
            hasBreakdown
                ? toNumber(
                    apiData.salesBreakdown
                        ?.salesReturnCostReversal
                )
                : 0,

        netCostOfSales:
            hasBreakdown
                ? toNumber(
                    apiData.salesBreakdown
                        ?.netCostOfSales
                )
                : costOfGoods.costOfSales,
    };

    /*
    |--------------------------------------------------------------------------
    | Revenue
    |--------------------------------------------------------------------------
    |
    | Net Sales is used in the P&L total.
    |
    | Gross Sales - Sales Return = Net Sales
    |
    */

    const totalRevenue =
        salesBreakdown.netSales +
        revenue.serviceRevenue +
        revenue.otherIncome;

    /*
    |--------------------------------------------------------------------------
    | Cost of Goods Sold
    |--------------------------------------------------------------------------
    |
    | Net Cost of Sales is used in financial profit calculation.
    |
    | Gross COGS - COGS Reversal = Net COGS
    |
    */

    const totalCostOfGoods =
        salesBreakdown.netCostOfSales +
        costOfGoods.directCosts;

    const grossProfit =
        totalRevenue -
        totalCostOfGoods;

    /*
    |--------------------------------------------------------------------------
    | Operating Expenses
    |--------------------------------------------------------------------------
    */

    const totalExpenses =
        Object.values(
            expenses
        ).reduce(
            (total, value) =>
                total +
                toNumber(value),
            0
        );

    /*
    |--------------------------------------------------------------------------
    | Net Income
    |--------------------------------------------------------------------------
    */

    const netIncome =
        grossProfit -
        totalExpenses;

    /*
    |--------------------------------------------------------------------------
    | Percentages
    |--------------------------------------------------------------------------
    */

    const grossProfitPercentage =
        totalRevenue === 0
            ? 0
            : (
                (
                    grossProfit /
                    totalRevenue
                ) *
                100
            );

    const netIncomePercentage =
        totalRevenue === 0
            ? 0
            : (
                (
                    netIncome /
                    totalRevenue
                ) *
                100
            );

    return {
        period: {
            startDate:
                apiData.period
                    ?.start_date ||
                '',

            endDate:
                apiData.period
                    ?.end_date ||
                '',
        },

        revenue,

        costOfGoods,

        expenses,

        salesBreakdown,

        totalRevenue:
            roundMoney(
                totalRevenue
            ),

        totalCostOfGoods:
            roundMoney(
                totalCostOfGoods
            ),

        grossProfit:
            roundMoney(
                grossProfit
            ),

        grossProfitPercentage:
            roundMoney(
                grossProfitPercentage
            ),

        totalExpenses:
            roundMoney(
                totalExpenses
            ),

        netIncome:
            roundMoney(
                netIncome
            ),

        netIncomePercentage:
            roundMoney(
                netIncomePercentage
            ),
    };
}

/*
|--------------------------------------------------------------------------
| Excel Export Rows
|--------------------------------------------------------------------------
*/

function buildExportRows({
    reportData,
    companyName,
    startDate,
    endDate,
}) {
    return [
        [
            'Company',
            companyName,
        ],

        [
            'Report',
            'Income Statement (Profit & Loss)',
        ],

        [
            'Period',
            `${formatDate(startDate)} - ${formatDate(endDate)}`,
        ],

        [],

        [
            'Section',
            'Line Item',
            'Amount',
        ],

        /*
        |--------------------------------------------------------------------------
        | Revenue
        |--------------------------------------------------------------------------
        */

        [
            'Revenue',
            'Gross Sales',
            reportData.salesBreakdown
                .grossSales,
        ],

        [
            'Revenue',
            'Less: Sales Return',
            -reportData.salesBreakdown
                .salesReturns,
        ],

        [
            'Revenue',
            'Net Sales',
            reportData.salesBreakdown
                .netSales,
        ],

        [
            'Revenue',
            'Service Revenue',
            reportData.revenue
                .serviceRevenue,
        ],

        [
            'Revenue',
            'Other Income',
            reportData.revenue
                .otherIncome,
        ],

        [
            'Revenue',
            'Total Revenue',
            reportData.totalRevenue,
        ],

        [],

        /*
        |--------------------------------------------------------------------------
        | Cost of Goods Sold
        |--------------------------------------------------------------------------
        */

        [
            'Cost of Goods Sold',
            'Gross Cost of Sales',
            reportData.salesBreakdown
                .grossCostOfSales,
        ],

        [
            'Cost of Goods Sold',
            'Less: Sales Return COGS Reversal',
            -reportData.salesBreakdown
                .salesReturnCostReversal,
        ],

        [
            'Cost of Goods Sold',
            'Net Cost of Sales',
            reportData.salesBreakdown
                .netCostOfSales,
        ],

        [
            'Cost of Goods Sold',
            'Direct Costs',
            reportData.costOfGoods
                .directCosts,
        ],

        [
            'Cost of Goods Sold',
            'Total COGS',
            reportData.totalCostOfGoods,
        ],

        [],

        [
            'Profit',
            'Gross Profit',
            reportData.grossProfit,
        ],

        [],

        /*
        |--------------------------------------------------------------------------
        | Operating Expenses
        |--------------------------------------------------------------------------
        */

        [
            'Operating Expenses',
            'Salaries',
            reportData.expenses
                .salaries,
        ],

        [
            'Operating Expenses',
            'Rent',
            reportData.expenses
                .rent,
        ],

        [
            'Operating Expenses',
            'Utilities',
            reportData.expenses
                .utilities,
        ],

        [
            'Operating Expenses',
            'Marketing',
            reportData.expenses
                .marketing,
        ],

        [
            'Operating Expenses',
            'Depreciation',
            reportData.expenses
                .depreciation,
        ],

        [
            'Operating Expenses',
            'Other Expenses',
            reportData.expenses
                .otherExpenses,
        ],

        [
            'Operating Expenses',
            'Total Operating Expenses',
            reportData.totalExpenses,
        ],

        [],

        [
            'Profit',
            'Net Income',
            reportData.netIncome,
        ],
    ];
}

/*
|--------------------------------------------------------------------------
| Income Statement Page
|--------------------------------------------------------------------------
*/

export default function IncomeStatementPage() {
    const {
        user,
        loading,
    } = useAuth();

    const [
        dateRange,
        setDateRange,
    ] = useState({
        startDate:
            toDateInput(
                new Date(
                    new Date()
                        .getFullYear(),
                    0,
                    1
                )
            ),

        endDate:
            toDateInput(),
    });

    const [
        isLoading,
        setIsLoading,
    ] = useState(true);

    const [
        reportData,
        setReportData,
    ] = useState(null);

    /*
    |--------------------------------------------------------------------------
    | Company Name
    |--------------------------------------------------------------------------
    */

    const companyName =
        user?.company?.name ||
        user?.company_name ||
        'Company Name';

    /*
    |--------------------------------------------------------------------------
    | Generated Date
    |--------------------------------------------------------------------------
    */

    const generatedDate =
        useMemo(
            () =>
                new Date()
                    .toLocaleDateString(
                        'en-US'
                    ),
            [reportData]
        );

    /*
    |--------------------------------------------------------------------------
    | Load Report
    |--------------------------------------------------------------------------
    */

    useEffect(
        () => {
            if (loading) {
                return;
            }

            if (user) {
                loadReport();
            } else {
                setIsLoading(
                    false
                );
            }
        },
        [
            user,
            loading,
            dateRange,
        ]
    );

    const loadReport =
        async () => {
            try {
                setIsLoading(
                    true
                );

                const response =
                    await fetchIncomeStatement({
                        start_date:
                            dateRange
                                .startDate,

                        end_date:
                            dateRange
                                .endDate,
                    });

                const apiData =
                    response.data ||
                    {};

                setReportData(
                    normalizeReportData(
                        apiData
                    )
                );
            } catch (error) {
                console.error(
                    'Error loading income statement:',
                    error
                );

                setReportData(
                    normalizeReportData(
                        EMPTY_REPORT
                    )
                );
            } finally {
                setIsLoading(
                    false
                );
            }
        };

    /*
    |--------------------------------------------------------------------------
    | Print
    |--------------------------------------------------------------------------
    */

    const handlePrint =
        () => {
            window.print();
        };

    /*
    |--------------------------------------------------------------------------
    | Excel Export
    |--------------------------------------------------------------------------
    */

    const handleExport =
        async () => {
            if (!reportData) {
                return;
            }

            try {
                const XLSX =
                    await import(
                        'xlsx'
                    );

                const workbook =
                    XLSX.utils
                        .book_new();

                const rows =
                    buildExportRows({
                        reportData,

                        companyName,

                        startDate:
                            reportData
                                .period
                                .startDate ||
                            dateRange
                                .startDate,

                        endDate:
                            reportData
                                .period
                                .endDate ||
                            dateRange
                                .endDate,
                    });

                const worksheet =
                    XLSX.utils
                        .aoa_to_sheet(
                            rows
                        );

                /*
                 * Column widths
                 */
                worksheet['!cols'] = [
                    {
                        wch: 24,
                    },

                    {
                        wch: 38,
                    },

                    {
                        wch: 18,
                    },
                ];

                XLSX.utils
                    .book_append_sheet(
                        workbook,
                        worksheet,
                        'Income Statement'
                    );

                XLSX.writeFile(
                    workbook,
                    `income-statement-${dateRange.startDate}-to-${dateRange.endDate}.xlsx`
                );
            } catch (error) {
                console.error(
                    'Error exporting income statement:',
                    error
                );

                alert(
                    'Income Statement export failed. Please try again.'
                );
            }
        };

    /*
    |--------------------------------------------------------------------------
    | Loading State
    |--------------------------------------------------------------------------
    */

    if (
        loading ||
        isLoading
    ) {
        return (
            <div className="p-4 md:p-6">
                Loading...
            </div>
        );
    }

    if (!reportData) {
        return (
            <div className="p-4 md:p-6">
                No data available
            </div>
        );
    }

    const reportStartDate =
        reportData
            .period
            .startDate ||
        dateRange
            .startDate;

    const reportEndDate =
        reportData
            .period
            .endDate ||
        dateRange
            .endDate;

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <div>
            <div className="flex-1 flex flex-col bg-gray-50">

                <div className="flex flex-1">

                    <main className="flex-1 overflow-auto">

                        <div className="p-4 md:p-6">

                            {/* =================================================
                                Date Range Filter
                            ================================================= */}

                            <div className="print:hidden bg-white rounded-lg shadow p-6 mb-6">

                                <div className="flex flex-wrap items-end justify-end gap-4">

                                    {/* Start Date */}

                                    <div className="w-full sm:w-52">

                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Start Date
                                        </label>

                                        <input
                                            type="date"
                                            value={
                                                dateRange
                                                    .startDate
                                            }
                                            onChange={(e) =>
                                                setDateRange({
                                                    ...dateRange,

                                                    startDate:
                                                        e.target
                                                            .value,
                                                })
                                            }
                                            className="h-11 w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>

                                    {/* End Date */}

                                    <div className="w-full sm:w-52">

                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            End Date
                                        </label>

                                        <input
                                            type="date"
                                            value={
                                                dateRange
                                                    .endDate
                                            }
                                            onChange={(e) =>
                                                setDateRange({
                                                    ...dateRange,

                                                    endDate:
                                                        e.target
                                                            .value,
                                                })
                                            }
                                            className="h-11 w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>

                                    {/* Print */}

                                    <button
                                        type="button"
                                        onClick={
                                            handlePrint
                                        }
                                        className="flex h-11 items-center gap-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <Printer className="w-4 h-4" />

                                        Print
                                    </button>

                                    {/* Export */}

                                    <button
                                        type="button"
                                        onClick={
                                            handleExport
                                        }
                                        className="flex h-11 items-center gap-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        <Download className="w-4 h-4" />

                                        Export
                                    </button>
                                </div>
                            </div>

                            {/* =================================================
                                Report
                            ================================================= */}

                            <div className="bg-white rounded-lg shadow print:shadow-none print:rounded-none">

                                <div className="p-8 print:p-0">

                                    {/* =========================================
                                        Company Header
                                    ========================================== */}

                                    <div className="text-center mb-8 print:mb-6">

                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {companyName}
                                        </h2>

                                        <p className="mt-1 text-lg font-semibold text-gray-700">
                                            Income Statement
                                            {' '}
                                            (Profit & Loss)
                                        </p>

                                        <p className="mt-2 text-sm text-gray-600">
                                            {formatDate(
                                                reportStartDate
                                            )}
                                            {' '}
                                            to
                                            {' '}
                                            {formatDate(
                                                reportEndDate
                                            )}
                                        </p>
                                    </div>

                                    {/* =========================================
                                        Revenue Section
                                    ========================================== */}

                                    <div className="mb-8 break-inside-avoid">

                                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                                            Revenue
                                        </h3>

                                        <div className="space-y-2 ml-4">

                                            {/* Gross Sales */}

                                            <ReportLine
                                                label="Gross Sales"
                                                amount={
                                                    reportData
                                                        .salesBreakdown
                                                        .grossSales
                                                }
                                            />

                                            {/* Sales Return */}

                                            <ReportLine
                                                label="Less: Sales Return"
                                                amount={
                                                    -reportData
                                                        .salesBreakdown
                                                        .salesReturns
                                                }
                                            />

                                            {/* Net Sales */}

                                            <div className="border-t border-gray-200 mt-2 pt-2">

                                                <ReportLine
                                                    label="Net Sales"
                                                    amount={
                                                        reportData
                                                            .salesBreakdown
                                                            .netSales
                                                    }
                                                    bold
                                                />
                                            </div>

                                            {/* Service Revenue */}

                                            <ReportLine
                                                label="Service Revenue"
                                                amount={
                                                    reportData
                                                        .revenue
                                                        .serviceRevenue
                                                }
                                            />

                                            {/* Other Income */}

                                            <ReportLine
                                                label="Other Income"
                                                amount={
                                                    reportData
                                                        .revenue
                                                        .otherIncome
                                                }
                                            />

                                            {/* Total Revenue */}

                                            <div className="border-t border-gray-300 mt-2 pt-2">

                                                <ReportLine
                                                    label="Total Revenue"
                                                    amount={
                                                        reportData
                                                            .totalRevenue
                                                    }
                                                    bold
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* =========================================
                                        Cost of Goods Sold
                                    ========================================== */}

                                    <div className="mb-8 break-inside-avoid">

                                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                                            Cost of Goods Sold
                                        </h3>

                                        <div className="space-y-2 ml-4">

                                            {/* Gross COGS */}

                                            <ReportLine
                                                label="Gross Cost of Sales"
                                                amount={
                                                    reportData
                                                        .salesBreakdown
                                                        .grossCostOfSales
                                                }
                                            />

                                            {/* Return Cost Reversal */}

                                            <ReportLine
                                                label="Less: Sales Return COGS Reversal"
                                                amount={
                                                    -reportData
                                                        .salesBreakdown
                                                        .salesReturnCostReversal
                                                }
                                            />

                                            {/* Net Cost of Sales */}

                                            <div className="border-t border-gray-200 mt-2 pt-2">

                                                <ReportLine
                                                    label="Net Cost of Sales"
                                                    amount={
                                                        reportData
                                                            .salesBreakdown
                                                            .netCostOfSales
                                                    }
                                                    bold
                                                />
                                            </div>

                                            {/* Direct Costs */}

                                            <ReportLine
                                                label="Direct Costs"
                                                amount={
                                                    reportData
                                                        .costOfGoods
                                                        .directCosts
                                                }
                                            />

                                            {/* Total COGS */}

                                            <div className="border-t border-gray-300 mt-2 pt-2">

                                                <ReportLine
                                                    label="Total COGS"
                                                    amount={
                                                        reportData
                                                            .totalCostOfGoods
                                                    }
                                                    bold
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* =========================================
                                        Gross Profit
                                    ========================================== */}

                                    <div className="mb-8 bg-blue-50 border border-blue-200 p-4 rounded-lg break-inside-avoid print:bg-white">

                                        <div className="flex justify-between items-center gap-4">

                                            <span className="text-lg font-bold text-gray-900">
                                                Gross Profit
                                            </span>

                                            <div className="text-right">

                                                <p className="text-xl font-bold text-blue-600 print:text-gray-900">
                                                    {formatCurrency(
                                                        reportData
                                                            .grossProfit
                                                    )}
                                                </p>

                                                <p className="text-sm text-gray-600">
                                                    {reportData
                                                        .grossProfitPercentage
                                                        .toFixed(
                                                            2
                                                        )}
                                                    % of revenue
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* =========================================
                                        Operating Expenses
                                    ========================================== */}

                                    <div className="mb-8 break-inside-avoid">

                                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                                            Operating Expenses
                                        </h3>

                                        <div className="space-y-2 ml-4">

                                            <ReportLine
                                                label="Salaries"
                                                amount={
                                                    reportData
                                                        .expenses
                                                        .salaries
                                                }
                                            />

                                            <ReportLine
                                                label="Rent"
                                                amount={
                                                    reportData
                                                        .expenses
                                                        .rent
                                                }
                                            />

                                            <ReportLine
                                                label="Utilities"
                                                amount={
                                                    reportData
                                                        .expenses
                                                        .utilities
                                                }
                                            />

                                            <ReportLine
                                                label="Marketing"
                                                amount={
                                                    reportData
                                                        .expenses
                                                        .marketing
                                                }
                                            />

                                            <ReportLine
                                                label="Depreciation"
                                                amount={
                                                    reportData
                                                        .expenses
                                                        .depreciation
                                                }
                                            />

                                            <ReportLine
                                                label="Other Expenses"
                                                amount={
                                                    reportData
                                                        .expenses
                                                        .otherExpenses
                                                }
                                            />

                                            <div className="border-t border-gray-300 mt-2 pt-2">

                                                <ReportLine
                                                    label="Total Operating Expenses"
                                                    amount={
                                                        reportData
                                                            .totalExpenses
                                                    }
                                                    bold
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* =========================================
                                        Net Income
                                    ========================================== */}

                                    <div className="bg-green-50 p-4 rounded-lg border-2 border-green-300 break-inside-avoid print:bg-white print:border-gray-900">

                                        <div className="flex justify-between items-center gap-4">

                                            <span className="text-xl font-bold text-gray-900">
                                                Net Income
                                            </span>

                                            <div className="text-right">

                                                <p className="text-2xl font-bold text-green-600 print:text-gray-900">
                                                    {formatCurrency(
                                                        reportData
                                                            .netIncome
                                                    )}
                                                </p>

                                                <p className="text-sm text-gray-600">
                                                    {reportData
                                                        .netIncomePercentage
                                                        .toFixed(
                                                            2
                                                        )}
                                                    % of revenue
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* =========================================
                                        Footer
                                    ========================================== */}

                                    <div className="mt-8 pt-8 border-t border-gray-300 text-center text-sm text-gray-600 print:mt-6 print:pt-4">

                                        <p>
                                            Generated on{' '}
                                            {generatedDate}
                                        </p>

                                        <p>
                                            This is a confidential document for authorized personnel only
                                        </p>
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

/*
|--------------------------------------------------------------------------
| Report Line
|--------------------------------------------------------------------------
*/

function ReportLine({
    label,
    amount,
    bold = false,
}) {
    const formattedAmount =
        (() => {
            if (
                typeof amount ===
                'number'
            ) {
                return amount;
            }

            if (
                !amount ||
                typeof amount !==
                'object'
            ) {
                return 0;
            }

            return Object.values(
                amount
            ).reduce(
                (
                    total,
                    value
                ) =>
                    total +
                    toNumber(value),
                0
            );
        })();

    return (
        <div className="grid grid-cols-[minmax(0,1fr)_max-content] items-start gap-4">

            <span
                className={
                    bold
                        ? 'font-bold text-gray-900'
                        : 'text-gray-700'
                }
            >
                {label}
            </span>

            <span
                className={
                    bold
                        ? 'font-bold text-gray-900'
                        : 'text-gray-700'
                }
            >
                {formatCurrency(
                    formattedAmount
                )}
            </span>
        </div>
    );
}