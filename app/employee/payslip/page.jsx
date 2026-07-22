'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import {
    Download,
    Mail,
    FileText,
    Search,
} from 'lucide-react';

export default function PayslipPage() {
    const { user, loading } = useAuth();
    const [payslips, setPayslips] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPayslip, setSelectedPayslip] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMonth, setFilterMonth] = useState('all');

    useEffect(() => {
        if (loading) return;
        if (user) {
            loadPayslips();
        } else {
            setIsLoading(false);
        }
    }, [user, loading]);

    const loadPayslips = async () => {
        try {
            setIsLoading(true);
            const mockPayslips = [
                {
                    id: 1,
                    employeeId: 'EMP-001',
                    employeeName: 'Md Ahmed',
                    department: 'Sales',
                    position: 'Sales Manager',
                    month: 'January',
                    year: 2024,
                    baseSalary: 50000,
                    houseRent: 15000,
                    medical: 5000,
                    transport: 3000,
                    otherAllowance: 2000,
                    providentFund: 5000,
                    tax: 3500,
                    otherDeduction: 1000,
                    ytdSalary: 50000,
                    ytdTax: 3500,
                },
                {
                    id: 2,
                    employeeId: 'EMP-002',
                    employeeName: 'Fatima Akter',
                    department: 'Finance',
                    position: 'Senior Accountant',
                    month: 'January',
                    year: 2024,
                    baseSalary: 45000,
                    houseRent: 12000,
                    medical: 4500,
                    transport: 2500,
                    otherAllowance: 1500,
                    providentFund: 4500,
                    tax: 3000,
                    otherDeduction: 800,
                    ytdSalary: 45000,
                    ytdTax: 3000,
                },
                {
                    id: 3,
                    employeeId: 'EMP-003',
                    employeeName: 'Karim Hassan',
                    department: 'Operations',
                    position: 'Operations Officer',
                    month: 'January',
                    year: 2024,
                    baseSalary: 35000,
                    houseRent: 10000,
                    medical: 3500,
                    transport: 2000,
                    otherAllowance: 1000,
                    providentFund: 3500,
                    tax: 2500,
                    otherDeduction: 600,
                    ytdSalary: 35000,
                    ytdTax: 2500,
                },
                {
                    id: 4,
                    employeeId: 'EMP-001',
                    employeeName: 'Md Ahmed',
                    department: 'Sales',
                    position: 'Sales Manager',
                    month: 'February',
                    year: 2024,
                    baseSalary: 50000,
                    houseRent: 15000,
                    medical: 5000,
                    transport: 3000,
                    otherAllowance: 2000,
                    providentFund: 5000,
                    tax: 3500,
                    otherDeduction: 1000,
                    ytdSalary: 100000,
                    ytdTax: 7000,
                },
            ];
            setPayslips(mockPayslips);
        } catch (error) {
            console.error('Error loading payslips:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrintPayslip = (payslip) => {
        const printContent = generatePayslipHTML(payslip);
        const printWindow = window.open('', '', 'height=700,width=900');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    const generatePayslipHTML = (payslip) => {
        const gross =
            payslip.baseSalary +
            payslip.houseRent +
            payslip.medical +
            payslip.transport +
            payslip.otherAllowance;
        const deductions =
            payslip.providentFund + payslip.tax + payslip.otherDeduction;
        const net = gross - deductions;

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #1e40af; padding-bottom: 20px; }
          .company-name { font-size: 24px; font-weight: bold; color: #1e40af; }
          .payslip-title { font-size: 18px; font-weight: bold; margin-top: 10px; }
          .employee-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .info-box { background: #f3f4f6; padding: 10px; border-radius: 5px; }
          .label { font-size: 12px; color: #666; font-weight: bold; }
          .value { font-size: 14px; font-weight: bold; margin-top: 5px; }
          .earnings, .deductions { margin-bottom: 20px; }
          .section-title { font-size: 14px; font-weight: bold; background: #dbeafe; padding: 8px; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
          th, td { padding: 10px; text-align: right; border-bottom: 1px solid #e5e7eb; }
          th { background: #f3f4f6; text-align: left; }
          td { text-align: right; }
          .line-label { text-align: left; }
          .summary { background: #ecfdf5; padding: 15px; margin-top: 20px; border-radius: 5px; }
          .summary-line { display: flex; justify-content: space-between; margin: 8px 0; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">ACCOUNT SOFTWARE</div>
          <div class="payslip-title">PAYSLIP FOR ${payslip.month.toUpperCase()} ${payslip.year}</div>
        </div>

        <div class="employee-info">
          <div class="info-box">
            <div class="label">EMPLOYEE NAME</div>
            <div class="value">${payslip.employeeName}</div>
          </div>
          <div class="info-box">
            <div class="label">EMPLOYEE ID</div>
            <div class="value">${payslip.employeeId}</div>
          </div>
          <div class="info-box">
            <div class="label">DEPARTMENT</div>
            <div class="value">${payslip.department}</div>
          </div>
          <div class="info-box">
            <div class="label">POSITION</div>
            <div class="value">${payslip.position}</div>
          </div>
        </div>

        <div class="earnings">
          <div class="section-title">EARNINGS</div>
          <table>
            <tr>
              <td class="line-label">Basic Salary</td>
              <td>৳${payslip.baseSalary.toLocaleString()}</td>
            </tr>
            <tr>
              <td class="line-label">House Rent</td>
              <td>৳${payslip.houseRent.toLocaleString()}</td>
            </tr>
            <tr>
              <td class="line-label">Medical Allowance</td>
              <td>৳${payslip.medical.toLocaleString()}</td>
            </tr>
            <tr>
              <td class="line-label">Transport Allowance</td>
              <td>৳${payslip.transport.toLocaleString()}</td>
            </tr>
            <tr>
              <td class="line-label">Other Allowance</td>
              <td>৳${payslip.otherAllowance.toLocaleString()}</td>
            </tr>
            <tr style="border-bottom: 2px solid #666;">
              <th class="line-label">GROSS SALARY</th>
              <th style="text-align: right;">৳${gross.toLocaleString()}</th>
            </tr>
          </table>
        </div>

        <div class="deductions">
          <div class="section-title">DEDUCTIONS</div>
          <table>
            <tr>
              <td class="line-label">Provident Fund</td>
              <td>৳${payslip.providentFund.toLocaleString()}</td>
            </tr>
            <tr>
              <td class="line-label">Income Tax</td>
              <td>৳${payslip.tax.toLocaleString()}</td>
            </tr>
            <tr style="border-bottom: 2px solid #666;">
              <td class="line-label">Other Deduction</td>
              <td>৳${payslip.otherDeduction.toLocaleString()}</td>
            </tr>
            <tr>
              <th class="line-label">TOTAL DEDUCTIONS</th>
              <th style="text-align: right;">৳${deductions.toLocaleString()}</th>
            </tr>
          </table>
        </div>

        <div class="summary">
          <div class="summary-line">
            <span>Gross Salary:</span>
            <span>৳${gross.toLocaleString()}</span>
          </div>
          <div class="summary-line">
            <span>Total Deductions:</span>
            <span>৳${deductions.toLocaleString()}</span>
          </div>
          <div class="summary-line" style="font-size: 16px; color: #059669; margin-top: 15px;">
            <span>NET SALARY:</span>
            <span>৳${net.toLocaleString()}</span>
          </div>
          <div class="summary-line" style="margin-top: 15px; border-top: 1px solid #ccc; padding-top: 10px; font-size: 12px; color: #666;">
            <span>Year To Date Salary:</span>
            <span>৳${payslip.ytdSalary.toLocaleString()}</span>
          </div>
          <div class="summary-line" style="font-size: 12px; color: #666;">
            <span>Year To Date Tax:</span>
            <span>৳${payslip.ytdTax.toLocaleString()}</span>
          </div>
        </div>
      </body>
      </html>
    `;
    };

    const filteredPayslips = payslips.filter((payslip) => {
        const matchesSearch =
            payslip.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            payslip.employeeName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesMonth =
            filterMonth === 'all' || payslip.month === filterMonth;

        return matchesSearch && matchesMonth;
    });

    const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];

    const uniqueMonths = [...new Set(payslips.map((p) => p.month))];

    if (loading || isLoading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div>
            <div className="flex-1 flex flex-col bg-gray-50">
                <div className="flex flex-1">
                    <main className="flex-1 overflow-auto">
                        <div className="p-8">
                            {/* Header */}
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <p className="text-gray-600 mt-1">View and manage employee payslips</p>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Total Payslips</p>
                                    <p className="text-2xl font-bold text-gray-900">{payslips.length}</p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Unique Employees</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {[...new Set(payslips.map((p) => p.employeeId))].length}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Total Distributed</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        ৳
                                        {payslips
                                            .reduce(
                                                (sum, p) =>
                                                    sum +
                                                    (p.baseSalary +
                                                        p.houseRent +
                                                        p.medical +
                                                        p.transport +
                                                        p.otherAllowance -
                                                        p.providentFund -
                                                        p.tax -
                                                        p.otherDeduction),
                                                0
                                            )
                                            .toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="bg-white rounded-lg shadow p-6 mb-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            <Search className="w-4 h-4 inline mr-2" />
                                            Search by Employee ID or Name
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Search..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Filter by Month
                                        </label>
                                        <select
                                            value={filterMonth}
                                            onChange={(e) => setFilterMonth(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value="all">All Months</option>
                                            {uniqueMonths.map((month) => (
                                                <option key={month} value={month}>
                                                    {month}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Payslips Grid */}
                            {selectedPayslip ? (
                                <div className="bg-white rounded-lg shadow p-8">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            {selectedPayslip.employeeName} - {selectedPayslip.month}{' '}
                                            {selectedPayslip.year}
                                        </h2>
                                        <button
                                            onClick={() => setSelectedPayslip(null)}
                                            className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400"
                                        >
                                            Back to List
                                        </button>
                                    </div>

                                    {/* Payslip Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        {/* Employee Info */}
                                        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                                            <h3 className="text-sm font-bold text-gray-900 mb-4">EMPLOYEE INFORMATION</h3>
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">Name:</span>
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {selectedPayslip.employeeName}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">Employee ID:</span>
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {selectedPayslip.employeeId}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">Department:</span>
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {selectedPayslip.department}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600">Position:</span>
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {selectedPayslip.position}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between border-t border-gray-300 pt-3 mt-3">
                                                    <span className="text-sm font-bold text-gray-900">Period:</span>
                                                    <span className="text-sm font-bold text-gray-900">
                                                        {selectedPayslip.month} {selectedPayslip.year}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Calculation Summary */}
                                        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                                            <h3 className="text-sm font-bold text-gray-900 mb-4">SALARY SUMMARY</h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Base Salary:</span>
                                                    <span className="font-medium text-gray-900">
                                                        ৳{selectedPayslip.baseSalary.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Total Allowances:</span>
                                                    <span className="font-medium text-gray-900">
                                                        ৳
                                                        {(
                                                            selectedPayslip.houseRent +
                                                            selectedPayslip.medical +
                                                            selectedPayslip.transport +
                                                            selectedPayslip.otherAllowance
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between border-t border-green-300 pt-2 mt-2">
                                                    <span className="font-bold text-gray-900">Gross Salary:</span>
                                                    <span className="font-bold text-gray-900">
                                                        ৳
                                                        {(
                                                            selectedPayslip.baseSalary +
                                                            selectedPayslip.houseRent +
                                                            selectedPayslip.medical +
                                                            selectedPayslip.transport +
                                                            selectedPayslip.otherAllowance
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Total Deductions:</span>
                                                    <span className="font-medium text-red-600">
                                                        -৳
                                                        {(
                                                            selectedPayslip.providentFund +
                                                            selectedPayslip.tax +
                                                            selectedPayslip.otherDeduction
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between border-t border-green-300 pt-2 mt-2">
                                                    <span className="font-bold text-gray-900">Net Salary:</span>
                                                    <span className="font-bold text-green-700 text-lg">
                                                        ৳
                                                        {(
                                                            selectedPayslip.baseSalary +
                                                            selectedPayslip.houseRent +
                                                            selectedPayslip.medical +
                                                            selectedPayslip.transport +
                                                            selectedPayslip.otherAllowance -
                                                            selectedPayslip.providentFund -
                                                            selectedPayslip.tax -
                                                            selectedPayslip.otherDeduction
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Tables */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        {/* Earnings */}
                                        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                                            <h3 className="text-sm font-bold text-gray-900 mb-4">EARNINGS</h3>
                                            <table className="w-full text-sm">
                                                <tbody>
                                                    <tr className="border-b border-blue-300">
                                                        <td className="py-2 text-gray-600">Basic Salary</td>
                                                        <td className="py-2 text-right font-medium text-gray-900">
                                                            ৳{selectedPayslip.baseSalary.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                    <tr className="border-b border-blue-300">
                                                        <td className="py-2 text-gray-600">House Rent</td>
                                                        <td className="py-2 text-right font-medium text-gray-900">
                                                            ৳{selectedPayslip.houseRent.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                    <tr className="border-b border-blue-300">
                                                        <td className="py-2 text-gray-600">Medical Allowance</td>
                                                        <td className="py-2 text-right font-medium text-gray-900">
                                                            ৳{selectedPayslip.medical.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                    <tr className="border-b border-blue-300">
                                                        <td className="py-2 text-gray-600">Transport Allowance</td>
                                                        <td className="py-2 text-right font-medium text-gray-900">
                                                            ৳{selectedPayslip.transport.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-2 text-gray-600">Other Allowance</td>
                                                        <td className="py-2 text-right font-medium text-gray-900">
                                                            ৳{selectedPayslip.otherAllowance.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Deductions */}
                                        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                                            <h3 className="text-sm font-bold text-gray-900 mb-4">DEDUCTIONS</h3>
                                            <table className="w-full text-sm">
                                                <tbody>
                                                    <tr className="border-b border-red-300">
                                                        <td className="py-2 text-gray-600">Provident Fund</td>
                                                        <td className="py-2 text-right font-medium text-gray-900">
                                                            ৳{selectedPayslip.providentFund.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                    <tr className="border-b border-red-300">
                                                        <td className="py-2 text-gray-600">Income Tax</td>
                                                        <td className="py-2 text-right font-medium text-gray-900">
                                                            ৳{selectedPayslip.tax.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-2 text-gray-600">Other Deduction</td>
                                                        <td className="py-2 text-right font-medium text-gray-900">
                                                            ৳{selectedPayslip.otherDeduction.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* YTD Info */}
                                    <div className="bg-purple-50 p-6 rounded-lg border border-purple-200 mb-6">
                                        <h3 className="text-sm font-bold text-gray-900 mb-3">YEAR-TO-DATE INFORMATION</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-xs text-gray-600 mb-1">YTD Salary</p>
                                                <p className="text-lg font-bold text-gray-900">
                                                    ৳{selectedPayslip.ytdSalary.toLocaleString()}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600 mb-1">YTD Tax</p>
                                                <p className="text-lg font-bold text-gray-900">
                                                    ৳{selectedPayslip.ytdTax.toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handlePrintPayslip(selectedPayslip)}
                                            className="flex items-center gap-2 flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 justify-center"
                                        >
                                            <Download className="w-5 h-5" />
                                            Download PDF
                                        </button>
                                        <button className="flex items-center gap-2 flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 justify-center">
                                            <Mail className="w-5 h-5" />
                                            Email Payslip
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white rounded-lg shadow overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-100 border-b-2 border-gray-300">
                                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                    Employee
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                    Department
                                                </th>
                                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                    Month
                                                </th>
                                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                    Gross Salary
                                                </th>
                                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                    Deductions
                                                </th>
                                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                    Net Salary
                                                </th>
                                                <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredPayslips.map((payslip) => {
                                                const gross =
                                                    payslip.baseSalary +
                                                    payslip.houseRent +
                                                    payslip.medical +
                                                    payslip.transport +
                                                    payslip.otherAllowance;
                                                const deductions =
                                                    payslip.providentFund +
                                                    payslip.tax +
                                                    payslip.otherDeduction;
                                                const net = gross - deductions;
                                                return (
                                                    <tr
                                                        key={payslip.id}
                                                        className="border-b border-gray-200 hover:bg-gray-50 transition"
                                                    >
                                                        <td className="px-6 py-4 text-sm">
                                                            <p className="font-bold text-gray-900">{payslip.employeeName}</p>
                                                            <p className="text-xs text-gray-500">{payslip.employeeId}</p>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-700">
                                                            {payslip.department}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-gray-700">
                                                            {payslip.month} {payslip.year}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm text-blue-600 font-bold">
                                                            ৳{gross.toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm text-red-600 font-bold">
                                                            ৳{deductions.toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-right text-sm text-green-600 font-bold text-lg">
                                                            ৳{net.toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <div className="flex justify-center gap-2">
                                                                <button
                                                                    onClick={() => setSelectedPayslip(payslip)}
                                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                                                                    title="View Details"
                                                                >
                                                                    <FileText className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handlePrintPayslip(payslip)}
                                                                    className="p-2 text-green-600 hover:bg-green-100 rounded"
                                                                    title="Print/Download"
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                </button>
                                                                <button className="p-2 text-purple-600 hover:bg-purple-100 rounded" title="Send Email">
                                                                    <Mail className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}


