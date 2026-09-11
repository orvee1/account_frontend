'use client';

import { toDateInput } from "@/utils/accounting-date.mjs";

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Download, Printer } from 'lucide-react';
import { fetchBalanceSheet } from '@/services/reports';

const EMPTY_BALANCE_SHEET = {
    assets: {
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
    liabilities: {
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
    equity: {
        commonStock: 0,
        retainedEarnings: 0,
        otherComprehensiveIncome: 0,
    },
};

const summaryToneClasses = {
    blue: {
        box: 'bg-blue-50 border-blue-300 print:bg-white print:border-gray-900',
        amount: 'text-blue-600 print:text-gray-900',
    },
    red: {
        box: 'bg-red-50 border-red-300 print:bg-white print:border-gray-900',
        amount: 'text-red-600 print:text-gray-900',
    },
    green: {
        box: 'bg-green-50 border-green-300 print:bg-white print:border-gray-900',
        amount: 'text-green-600 print:text-gray-900',
    },
};

function toNumber(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

function mergeAmounts(defaults, source = {}) {
    const merged = {};

    Object.keys(defaults).forEach((key) => {
        merged[key] = toNumber(source?.[key] ?? defaults[key]);
    });

    return merged;
}

function sumAmounts(source = {}) {
    return Object.values(source).reduce((total, value) => total + toNumber(value), 0);
}

function normalizeReportData(apiData = {}) {
    const assets = {
        current: mergeAmounts(EMPTY_BALANCE_SHEET.assets.current, apiData.assets?.current),
        fixed: mergeAmounts(EMPTY_BALANCE_SHEET.assets.fixed, apiData.assets?.fixed),
        other: mergeAmounts(EMPTY_BALANCE_SHEET.assets.other, apiData.assets?.other),
    };
    const liabilities = {
        current: mergeAmounts(EMPTY_BALANCE_SHEET.liabilities.current, apiData.liabilities?.current),
        longTerm: mergeAmounts(EMPTY_BALANCE_SHEET.liabilities.longTerm, apiData.liabilities?.longTerm),
    };
    const equity = mergeAmounts(EMPTY_BALANCE_SHEET.equity, apiData.equity);

    const currentAssets = sumAmounts(assets.current);
    const fixedAssets = sumAmounts(assets.fixed);
    const otherAssets = sumAmounts(assets.other);
    const totalAssets = currentAssets + fixedAssets + otherAssets;

    const currentLiabilities = sumAmounts(liabilities.current);
    const longTermLiabilities = sumAmounts(liabilities.longTerm);
    const totalLiabilities = currentLiabilities + longTermLiabilities;

    const totalEquity = sumAmounts(equity);

    return {
        asOfDate: apiData.as_of_date,
        assets,
        liabilities,
        equity,
        currentAssets,
        fixedAssets,
        otherAssets,
        totalAssets,
        currentLiabilities,
        longTermLiabilities,
        totalLiabilities,
        totalEquity,
        totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    };
}

function formatCurrency(value) {
    const amount = toNumber(value);
    const sign = amount < 0 ? '-' : '';

    return `${sign}$${Math.abs(amount).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function formatDate(value) {
    if (!value) return '';

    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function getBalanceSheetColumns(reportData) {
    return [
        {
            title: 'Assets',
            blocks: [
                {
                    type: 'group',
                    title: 'Current Assets',
                    lines: [
                        { label: 'Cash', amount: reportData.assets.current.cash },
                        { label: 'Accounts Receivable', amount: reportData.assets.current.accountsReceivable },
                        { label: 'Inventory', amount: reportData.assets.current.inventory },
                        { label: 'Prepaid Expenses', amount: reportData.assets.current.prepaidExpenses },
                    ],
                    total: { label: 'Total Current Assets', amount: reportData.currentAssets },
                },
                {
                    type: 'group',
                    title: 'Fixed Assets',
                    lines: [
                        {
                            label: 'Property, Plant & Equipment',
                            amount: reportData.assets.fixed.propertyPlantEquipment,
                        },
                        {
                            label: 'Accumulated Depreciation',
                            amount: reportData.assets.fixed.accumulatedDepreciation,
                        },
                        { label: 'Intangible Assets', amount: reportData.assets.fixed.intangibleAssets },
                    ],
                    total: { label: 'Total Fixed Assets', amount: reportData.fixedAssets },
                },
                {
                    type: 'group',
                    title: 'Other Assets',
                    lines: [
                        { label: 'Long-term Investments', amount: reportData.assets.other.longTermInvestments },
                        { label: 'Deferred Tax Assets', amount: reportData.assets.other.deferredTaxAssets },
                    ],
                    total: { label: 'Total Other Assets', amount: reportData.otherAssets },
                },
                {
                    type: 'summary',
                    label: 'TOTAL ASSETS',
                    amount: reportData.totalAssets,
                    tone: 'blue',
                },
            ],
        },
        {
            title: 'Liabilities & Equity',
            blocks: [
                {
                    type: 'group',
                    title: 'Current Liabilities',
                    lines: [
                        { label: 'Accounts Payable', amount: reportData.liabilities.current.accountsPayable },
                        { label: 'Short-term Debt', amount: reportData.liabilities.current.shortTermDebt },
                        { label: 'Accrued Expenses', amount: reportData.liabilities.current.accruedExpenses },
                        {
                            label: 'Current Portion of LT Debt',
                            amount: reportData.liabilities.current.currentPortionLTDebt,
                        },
                    ],
                    total: { label: 'Total Current Liabilities', amount: reportData.currentLiabilities },
                },
                {
                    type: 'group',
                    title: 'Long-term Liabilities',
                    lines: [
                        { label: 'Long-term Debt', amount: reportData.liabilities.longTerm.longTermDebt },
                        {
                            label: 'Deferred Tax Liabilities',
                            amount: reportData.liabilities.longTerm.deferredTaxLiabilities,
                        },
                    ],
                    total: { label: 'Total Long-term Liabilities', amount: reportData.longTermLiabilities },
                },
                {
                    type: 'summary',
                    label: 'TOTAL LIABILITIES',
                    amount: reportData.totalLiabilities,
                    tone: 'red',
                },
                {
                    type: 'group',
                    title: 'Equity',
                    lines: [
                        { label: 'Common Stock', amount: reportData.equity.commonStock },
                        { label: 'Retained Earnings', amount: reportData.equity.retainedEarnings },
                        {
                            label: 'Other Comprehensive Income',
                            amount: reportData.equity.otherComprehensiveIncome,
                        },
                    ],
                    total: { label: 'Total Equity', amount: reportData.totalEquity },
                },
                {
                    type: 'summary',
                    label: 'TOTAL LIABILITIES & EQUITY',
                    amount: reportData.totalLiabilitiesAndEquity,
                    tone: 'green',
                },
            ],
        },
    ];
}

function buildExportRows(reportData, meta) {
    const rows = [
        ['Company', meta.companyName],
        ['Report', 'Balance Sheet'],
        ['As of Date', formatDate(meta.asOfDate)],
        ['Generated On', meta.generatedDate],
        [],
        ['Section', 'Group', 'Line Item', 'Amount'],
    ];

    getBalanceSheetColumns(reportData).forEach((column) => {
        column.blocks.forEach((block) => {
            if (block.type === 'group') {
                block.lines.forEach((line) => {
                    rows.push([column.title, block.title, line.label, toNumber(line.amount)]);
                });
                rows.push([column.title, block.title, block.total.label, toNumber(block.total.amount)]);
                return;
            }

            rows.push([column.title, '', block.label, toNumber(block.amount)]);
        });
    });

    return rows;
}

function buildPrintableHtml(reportData, meta) {
    const columnsHtml = getBalanceSheetColumns(reportData)
        .map((column) => {
            const blocksHtml = column.blocks
                .map((block) => {
                    if (block.type === 'group') {
                        const linesHtml = block.lines
                            .map(
                                (line) => `
                                    <div class="line">
                                        <span>${escapeHtml(line.label)}</span>
                                        <span>${escapeHtml(formatCurrency(line.amount))}</span>
                                    </div>
                                `
                            )
                            .join('');

                        return `
                            <section class="group">
                                <h3>${escapeHtml(block.title)}</h3>
                                <div class="lines">
                                    ${linesHtml}
                                    <div class="line total">
                                        <span>${escapeHtml(block.total.label)}</span>
                                        <span>${escapeHtml(formatCurrency(block.total.amount))}</span>
                                    </div>
                                </div>
                            </section>
                        `;
                    }

                    return `
                        <div class="summary">
                            <span>${escapeHtml(block.label)}</span>
                            <span>${escapeHtml(formatCurrency(block.amount))}</span>
                        </div>
                    `;
                })
                .join('');

            return `
                <section class="panel">
                    <h2>${escapeHtml(column.title)}</h2>
                    ${blocksHtml}
                </section>
            `;
        })
        .join('');

    return `
        <!doctype html>
        <html>
            <head>
                <title>Balance Sheet - ${escapeHtml(formatDate(meta.asOfDate))}</title>
                <style>
                    @page { size: A4; margin: 14mm; }
                    * { box-sizing: border-box; }
                    body {
                        margin: 0;
                        color: #111827;
                        background: #ffffff;
                        font-family: Arial, Helvetica, sans-serif;
                        font-size: 12px;
                    }
                    .header {
                        text-align: center;
                        border-bottom: 1px solid #d1d5db;
                        padding-bottom: 16px;
                        margin-bottom: 20px;
                    }
                    .company {
                        margin: 0 0 4px;
                        font-size: 20px;
                        font-weight: 700;
                    }
                    .title {
                        margin: 0;
                        font-size: 26px;
                        font-weight: 800;
                    }
                    .date {
                        margin: 6px 0 0;
                        color: #4b5563;
                    }
                    .grid {
                        display: grid;
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        gap: 18px;
                    }
                    .panel {
                        border: 1px solid #d1d5db;
                        border-radius: 8px;
                        padding: 18px;
                        break-inside: avoid;
                    }
                    h2 {
                        margin: 0 0 16px;
                        color: #111827;
                        font-size: 18px;
                        font-weight: 800;
                        text-transform: uppercase;
                    }
                    h3 {
                        margin: 0 0 8px;
                        color: #1f2937;
                        font-size: 14px;
                        font-weight: 700;
                    }
                    .group {
                        margin-bottom: 18px;
                        break-inside: avoid;
                    }
                    .lines {
                        padding-left: 12px;
                    }
                    .line,
                    .summary {
                        display: flex;
                        justify-content: space-between;
                        gap: 16px;
                        line-height: 1.45;
                        margin-bottom: 6px;
                    }
                    .line span:last-child,
                    .summary span:last-child {
                        white-space: nowrap;
                        text-align: right;
                    }
                    .total {
                        border-top: 1px solid #d1d5db;
                        font-weight: 700;
                        margin-top: 8px;
                        padding-top: 8px;
                    }
                    .summary {
                        border: 2px solid #111827;
                        border-radius: 8px;
                        font-size: 14px;
                        font-weight: 800;
                        margin-top: 14px;
                        padding: 12px;
                    }
                    .footer {
                        border-top: 1px solid #d1d5db;
                        color: #4b5563;
                        margin-top: 22px;
                        padding-top: 12px;
                        text-align: center;
                    }
                    @media (max-width: 760px) {
                        .grid { grid-template-columns: 1fr; }
                    }
                </style>
            </head>
            <body>
                <header class="header">
                    <p class="company">${escapeHtml(meta.companyName)}</p>
                    <h1 class="title">Balance Sheet</h1>
                    <p class="date">As of ${escapeHtml(formatDate(meta.asOfDate))}</p>
                </header>
                <main class="grid">${columnsHtml}</main>
                <footer class="footer">Generated on ${escapeHtml(meta.generatedDate)}</footer>
            </body>
        </html>
    `;
}

export default function BalanceSheetPage() {
    const { user, loading } = useAuth();
    const [dateRange, setDateRange] = useState({
        asOfDate: toDateInput(),
    });
    const [isLoading, setIsLoading] = useState(true);
    const [reportData, setReportData] = useState(null);

    const companyName = user?.company?.name || user?.company_name || 'Company Name';
    const generatedDate = useMemo(() => new Date().toLocaleDateString('en-US'), [reportData]);
    const reportColumns = useMemo(
        () => (reportData ? getBalanceSheetColumns(reportData) : []),
        [reportData]
    );

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

            setReportData(normalizeReportData(response.data || {}));
        } catch (error) {
            console.error('Error loading report:', error);
            setReportData(normalizeReportData());
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        if (!reportData) return;

        const asOfDate = reportData.asOfDate || dateRange.asOfDate;
        const printWindow = window.open('', '_blank', 'height=720,width=960');

        if (!printWindow) {
            window.print();
            return;
        }

        printWindow.document.open();
        printWindow.document.write(
            buildPrintableHtml(reportData, {
                companyName,
                asOfDate,
                generatedDate,
            })
        );
        printWindow.document.close();

        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
        }, 250);
    };

    const handleExport = async () => {
        if (!reportData) return;

        try {
            const XLSX = await import('xlsx');
            const workbook = XLSX.utils.book_new();
            const asOfDate = reportData.asOfDate || dateRange.asOfDate;
            const worksheet = XLSX.utils.aoa_to_sheet(
                buildExportRows(reportData, {
                    companyName,
                    asOfDate,
                    generatedDate,
                })
            );

            worksheet['!cols'] = [{ wch: 24 }, { wch: 26 }, { wch: 34 }, { wch: 16 }];

            XLSX.utils.book_append_sheet(workbook, worksheet, 'Balance Sheet');
            XLSX.writeFile(workbook, `balance-sheet-${asOfDate}.xlsx`);
        } catch (error) {
            console.error('Error exporting balance sheet:', error);
            alert('Balance Sheet export failed. Please try again.');
        }
    };

    if (loading || isLoading) {
        return <div className="p-4 md:p-6">Loading...</div>;
    }

    if (!reportData) {
        return <div className="p-4 md:p-6">No data available</div>;
    }

    const asOfDate = reportData.asOfDate || dateRange.asOfDate;

    return (
        <div className="balance-sheet-page space-y-6">
            <div className="balance-sheet-no-print rounded-lg bg-white p-5 shadow print:hidden">
                <div className="flex flex-wrap items-end justify-end gap-4">
                    <div className="w-full sm:w-52">
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            As of Date
                        </label>
                        <input
                            type="date"
                            value={dateRange.asOfDate}
                            onChange={(event) => setDateRange({ asOfDate: event.target.value })}
                            className="h-11 w-full rounded-lg border border-gray-300 px-3 py-2"
                        />
                    </div>
                    <button
                        onClick={handlePrint}
                        className="flex h-11 items-center gap-2 rounded-lg bg-blue-600 px-4 text-white hover:bg-blue-700"
                    >
                        <Printer className="h-4 w-4" />
                        Print
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex h-11 items-center gap-2 rounded-lg bg-green-600 px-4 text-white hover:bg-green-700"
                    >
                        <Download className="h-4 w-4" />
                        Export
                    </button>
                </div>
            </div>

            <section className="balance-sheet-print-area rounded-lg bg-white shadow print:rounded-none print:shadow-none">
                <div className="border-b border-gray-200 px-6 py-8 text-center print:px-0 print:pb-4 print:pt-0">
                    <p className="text-xl font-bold text-gray-900">{companyName}</p>
                    <h2 className="mt-1 text-3xl font-extrabold text-gray-900">Balance Sheet</h2>
                    <p className="mt-2 text-sm text-gray-600">As of {formatDate(asOfDate)}</p>
                </div>

                <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-2 print:grid-cols-2 print:gap-4 print:px-0 print:py-4">
                    {reportColumns.map((column) => (
                        <div
                            key={column.title}
                            className="rounded-lg border border-gray-200 p-6 print:break-inside-avoid print:border-gray-300 print:p-4"
                        >
                            <h3 className="mb-6 text-2xl font-bold uppercase text-gray-900 print:text-lg">
                                {column.title}
                            </h3>

                            {column.blocks.map((block) =>
                                block.type === 'group' ? (
                                    <ReportGroup key={block.title} group={block} />
                                ) : (
                                    <SummaryBox
                                        key={block.label}
                                        label={block.label}
                                        amount={block.amount}
                                        tone={block.tone}
                                    />
                                )
                            )}
                        </div>
                    ))}
                </div>

                <div className="border-t border-gray-200 px-6 py-5 text-center text-sm text-gray-600 print:px-0 print:py-3">
                    <p>Generated on {generatedDate}</p>
                </div>
            </section>
        </div>
    );
}

function ReportGroup({ group }) {
    return (
        <div className="mb-6 break-inside-avoid print:mb-4">
            <h4 className="mb-3 text-lg font-semibold text-gray-800 print:text-sm">
                {group.title}
            </h4>
            <div className="space-y-2 sm:ml-4 print:ml-3">
                {group.lines.map((line) => (
                    <ReportLine key={line.label} label={line.label} amount={line.amount} />
                ))}
                <div className="mt-2 border-t border-gray-300 pt-2">
                    <ReportLine label={group.total.label} amount={group.total.amount} bold />
                </div>
            </div>
        </div>
    );
}

function ReportLine({ label, amount, bold = false }) {
    return (
        <div className="grid grid-cols-[minmax(0,1fr)_max-content] items-start gap-3 text-sm print:text-xs">
            <span className={bold ? 'font-bold text-gray-900' : 'text-gray-700'}>
                {label}
            </span>
            <span className={bold ? 'font-bold text-gray-900' : 'text-gray-700'}>
                {formatCurrency(amount)}
            </span>
        </div>
    );
}

function SummaryBox({ label, amount, tone = 'blue' }) {
    const classes = summaryToneClasses[tone] || summaryToneClasses.blue;

    return (
        <div className={`mb-6 rounded-lg border-2 p-4 print:mb-4 print:p-3 ${classes.box}`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-base font-bold text-gray-900 print:text-sm">{label}</span>
                <span className={`text-lg font-bold print:text-sm ${classes.amount}`}>
                    {formatCurrency(amount)}
                </span>
            </div>
        </div>
    );
}
