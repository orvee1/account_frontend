'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import {
    Download,
    Calendar,
    TrendingUp,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
} from 'recharts';

export default function PayrollReportPage() {
    const { user, loading } = useAuth();
    const [reports, setReports] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedDepartment, setSelectedDepartment] = useState('All');

    useEffect(() => {
        if (loading) return;
        if (user) {
            loadReports();
        } else {
            setIsLoading(false);
        }
    }, [user, loading]);

    const loadReports = async () => {
        try {
            setIsLoading(true);
            const mockReports = [
                {
                    month: 'January',
                    salary: 130000,
                    bonus: 5000,
                    deduction: 15800,
                    net: 119200,
                    employees: 3,
                    department: 'All',
                },
                {
                    month: 'February',
                    salary: 130000,
                    bonus: 3000,
                    deduction: 15800,
                    net: 117200,
                    employees: 3,
                    department: 'All',
                },
                {
                    month: 'March',
                    salary: 130000,
                    bonus: 0,
                    deduction: 15800,
                    net: 114200,
                    employees: 3,
                    department: 'All',
                },
                {
                    month: 'April',
                    salary: 135000,
                    bonus: 4000,
                    deduction: 16300,
                    net: 122700,
                    employees: 3,
                    department: 'All',
                },
                {
                    month: 'May',
                    salary: 135000,
                    bonus: 2000,
                    deduction: 16300,
                    net: 120700,
                    employees: 3,
                    department: 'All',
                },
                {
                    month: 'June',
                    salary: 135000,
                    bonus: 3500,
                    deduction: 16300,
                    net: 122200,
                    employees: 3,
                    department: 'All',
                },
            ];

            setReports(mockReports);
        } catch (error) {
            console.error('Error loading reports:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const departmentBreakdown = [
        { name: 'Sales', total: 45000, employees: 1 },
        { name: 'Finance', total: 50000, employees: 1 },
        { name: 'Operations', total: 35000, employees: 1 },
    ];

    const filteredReports = reports.filter((report) => {
        if (selectedDepartment === 'All') return true;
        return report.department === selectedDepartment;
    });

    const monthlyTrend = filteredReports.map((report) => ({
        month: report.month.slice(0, 3),
        salary: report.salary,
        net: report.net,
    }));

    const totalStats = {
        totalPayroll: filteredReports.reduce((sum, r) => sum + r.net, 0),
        totalSalary: filteredReports.reduce((sum, r) => sum + r.salary, 0),
        totalBonus: filteredReports.reduce((sum, r) => sum + r.bonus, 0),
        totalDeduction: filteredReports.reduce((sum, r) => sum + r.deduction, 0),
        avgMonthly: Math.round(
            filteredReports.reduce((sum, r) => sum + r.net, 0) / filteredReports.length
        ),
    };

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
                                    <p className="text-gray-600 mt-1">Monthly payroll analytics and summaries</p>
                                </div>
                                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    <Download className="w-5 h-5" />
                                    Export PDF
                                </button>
                            </div>

                            {/* Filters */}
                            <div className="bg-white rounded-lg shadow p-6 mb-6">
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Year
                                        </label>
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value={2024}>2024</option>
                                            <option value={2023}>2023</option>
                                            <option value={2022}>2022</option>
                                        </select>
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Department
                                        </label>
                                        <select
                                            value={selectedDepartment}
                                            onChange={(e) => setSelectedDepartment(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value="All">All Departments</option>
                                            {departmentBreakdown.map((dept) => (
                                                <option key={dept.name} value={dept.name}>
                                                    {dept.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Total Payroll</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        ৳{totalStats.totalPayroll.toLocaleString('en-US', {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0,
                                        })}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">{filteredReports.length} months</p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Avg Monthly</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        ৳{totalStats.avgMonthly.toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">Per Month</p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Total Salary</p>
                                    <p className="text-2xl font-bold text-purple-600">
                                        ৳{totalStats.totalSalary.toLocaleString('en-US', {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0,
                                        })}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">Base + Allowances</p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Total Bonus</p>
                                    <p className="text-2xl font-bold text-yellow-600">
                                        ৳{totalStats.totalBonus.toLocaleString('en-US', {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0,
                                        })}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">Additional Payments</p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Total Deduction</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        ৳{totalStats.totalDeduction.toLocaleString('en-US', {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0,
                                        })}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">Tax + Contributions</p>
                                </div>
                            </div>

                            {/* Charts */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                {/* Monthly Trend */}
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Trend</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <LineChart data={monthlyTrend}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="month" />
                                            <YAxis />
                                            <Tooltip
                                                formatter={(value) => `৳${value.toLocaleString()}`}
                                                labelFormatter={(label) => `Month: ${label}`}
                                            />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="salary"
                                                stroke="#8b5cf6"
                                                name="Total Salary"
                                                strokeWidth={2}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="net"
                                                stroke="#22c55e"
                                                name="Net Payroll"
                                                strokeWidth={2}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Department Breakdown */}
                                <div className="bg-white rounded-lg shadow p-6">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4">Department Wise Payroll</h3>
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={departmentBreakdown}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="name" />
                                            <YAxis />
                                            <Tooltip
                                                formatter={(value) => `৳${value.toLocaleString()}`}
                                                labelFormatter={(label) => `Department: ${label}`}
                                            />
                                            <Legend />
                                            <Bar dataKey="total" fill="#3b82f6" name="Total Salary" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Department Wise Summary Table */}
                            <div className="bg-white rounded-lg shadow mb-6">
                                <div className="p-6 border-b border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900">Department Wise Summary</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                    Department
                                                </th>
                                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                    Employees
                                                </th>
                                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                    Total Monthly Salary
                                                </th>
                                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                    Total YTD Salary
                                                </th>
                                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                    Avg Per Employee
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {departmentBreakdown.map((dept) => (
                                                <tr key={dept.name} className="border-b border-gray-200 hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                        {dept.name}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm text-gray-700">
                                                        {dept.employees}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm text-gray-700 font-medium">
                                                        ৳{dept.total.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm text-blue-600 font-bold">
                                                        ৳{(dept.total * 6).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm text-gray-700 font-medium">
                                                        ৳{(dept.total / dept.employees).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Monthly Detail Table */}
                            <div className="bg-white rounded-lg shadow">
                                <div className="p-6 border-b border-gray-200">
                                    <h3 className="text-lg font-bold text-gray-900">Monthly Detail</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-gray-50 border-b border-gray-200">
                                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                    Month
                                                </th>
                                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                    Total Salary
                                                </th>
                                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                    Bonus
                                                </th>
                                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                    Deduction
                                                </th>
                                                <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                    Net Payroll
                                                </th>
                                                <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">
                                                    Employees
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredReports.map((report) => (
                                                <tr key={report.month} className="border-b border-gray-200 hover:bg-gray-50">
                                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                        {report.month}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm text-gray-700 font-medium">
                                                        ৳{report.salary.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm text-green-600 font-medium">
                                                        ৳{report.bonus.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm text-red-600 font-medium">
                                                        ৳{report.deduction.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm text-blue-600 font-bold text-lg">
                                                        ৳{report.net.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-sm text-gray-700">
                                                        {report.employees}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}


