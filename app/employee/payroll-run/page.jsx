'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import {
    Check,
    X,
    Download,
    RefreshCw,
} from 'lucide-react';

export default function PayrollRunPage() {
    const { user, loading } = useAuth();
    const [payrollRuns, setPayrollRuns] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        month: '',
        year: new Date().getFullYear(),
        salary: 0,
        bonus: 0,
        deduction: 0,
    });

    useEffect(() => {
        if (loading) return;
        if (user) {
            loadPayrollRuns();
        } else {
            setIsLoading(false);
        }
    }, [user, loading]);

    const loadPayrollRuns = async () => {
        try {
            setIsLoading(true);
            const mockRuns = [
                {
                    id: 1,
                    month: 'January',
                    year: 2024,
                    startDate: '2024-01-01',
                    endDate: '2024-01-31',
                    status: 'Processed',
                    totalEmployees: 3,
                    totalSalary: 130000,
                    totalBonus: 5000,
                    totalDeduction: 15800,
                    netPayroll: 119200,
                    processedDate: '2024-02-01',
                    processedBy: 'Admin User',
                },
                {
                    id: 2,
                    month: 'February',
                    year: 2024,
                    startDate: '2024-02-01',
                    endDate: '2024-02-29',
                    status: 'Processed',
                    totalEmployees: 3,
                    totalSalary: 130000,
                    totalBonus: 3000,
                    totalDeduction: 15800,
                    netPayroll: 117200,
                    processedDate: '2024-03-01',
                    processedBy: 'Admin User',
                },
                {
                    id: 3,
                    month: 'March',
                    year: 2024,
                    startDate: '2024-03-01',
                    endDate: '2024-03-31',
                    status: 'Draft',
                    totalEmployees: 3,
                    totalSalary: 130000,
                    totalBonus: 0,
                    totalDeduction: 15800,
                    netPayroll: 114200,
                    processedDate: null,
                    processedBy: null,
                },
            ];
            setPayrollRuns(mockRuns);
        } catch (error) {
            console.error('Error loading payroll runs:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const monthIndex = new Date(`${formData.month} 1, ${formData.year}`).getMonth() + 1;
        const monthName = new Date(formData.year, monthIndex - 1).toLocaleDateString('en-US', {
            month: 'long',
        });
        const daysInMonth = new Date(formData.year, monthIndex, 0).getDate();

        const newRun = {
            id: Date.now(),
            month: monthName,
            year: formData.year,
            startDate: `${formData.year}-${String(monthIndex).padStart(2, '0')}-01`,
            endDate: `${formData.year}-${String(monthIndex).padStart(2, '0')}-${daysInMonth}`,
            status: 'Draft',
            totalEmployees: 3,
            totalSalary: formData.salary,
            totalBonus: formData.bonus,
            totalDeduction: formData.deduction,
            netPayroll: formData.salary + formData.bonus - formData.deduction,
            processedDate: null,
            processedBy: null,
        };

        setPayrollRuns([newRun, ...payrollRuns]);
        setFormData({
            month: '',
            year: new Date().getFullYear(),
            salary: 0,
            bonus: 0,
            deduction: 0,
        });
        setShowForm(false);
    };

    const handleProcessPayroll = (id) => {
        if (confirm('Process payroll? This action cannot be undone.')) {
            setPayrollRuns(
                payrollRuns.map((run) =>
                    run.id === id
                        ? {
                            ...run,
                            status: 'Processed',
                            processedDate: new Date().toISOString().split('T')[0],
                            processedBy: user?.name || 'Admin User',
                        }
                        : run
                )
            );
        }
    };

    const handleUndo = (id) => {
        if (confirm('Undo payroll processing? This will revert to Draft status.')) {
            setPayrollRuns(
                payrollRuns.map((run) =>
                    run.id === id
                        ? {
                            ...run,
                            status: 'Draft',
                            processedDate: null,
                            processedBy: null,
                        }
                        : run
                )
            );
        }
    };

    const handleLock = (id) => {
        if (confirm('Lock payroll? Locked payroll cannot be modified.')) {
            setPayrollRuns(
                payrollRuns.map((run) =>
                    run.id === id
                        ? {
                            ...run,
                            status: 'Locked',
                        }
                        : run
                )
            );
        }
    };

    const filteredRuns = payrollRuns.filter((run) => {
        const matchesStatus = filterStatus === 'all' || run.status === filterStatus;
        const term = appliedSearchTerm.trim().toLowerCase();
        const matchesSearch =
            !term ||
            [
                run.month,
                run.year,
                run.status,
                run.startDate,
                run.endDate,
                run.processedBy,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(term));

        return matchesStatus && matchesSearch;
    });

    const totalPayroll = filteredRuns.reduce((sum, run) => sum + run.netPayroll, 0);
    const processedCount = filteredRuns.filter((run) => run.status === 'Processed').length;
    const draftCount = filteredRuns.filter((run) => run.status === 'Draft').length;

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
                                    <p className="text-gray-600 mt-1">Process monthly payroll for employees</p>
                                </div>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Total Payroll Runs</p>
                                    <p className="text-2xl font-bold text-gray-900">{filteredRuns.length}</p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Processed</p>
                                    <p className="text-2xl font-bold text-green-600">{processedCount}</p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Draft</p>
                                    <p className="text-2xl font-bold text-yellow-600">{draftCount}</p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Total Net Payroll</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        ৳{totalPayroll.toLocaleString('en-US', {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0,
                                        })}
                                    </p>
                                </div>
                            </div>

                            {/* Filter */}
                            <div className="bg-white rounded-lg shadow p-6 mb-6">
                                <div className="flex flex-wrap items-center justify-end gap-2">
                                    <input
                                        type="text"
                                        placeholder="Search payroll..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && setAppliedSearchTerm(searchTerm)}
                                        className="h-10 w-full rounded-md border border-gray-300 px-3 text-sm sm:w-64 md:w-80"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setAppliedSearchTerm(searchTerm)}
                                        className="h-10 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                                    >
                                        Search
                                    </button>
                                    {['all', 'Draft', 'Processed', 'Locked'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => setFilterStatus(status)}
                                            className={`h-10 px-4 rounded-md text-sm font-medium transition ${filterStatus === status
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                }`}
                                        >
                                            {status === 'all' ? 'All Status' : status}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        New Payroll
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="bg-white rounded-lg shadow overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Period
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Date Range
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
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRuns.map((run) => (
                                            <tr
                                                key={run.id}
                                                className="border-b border-gray-200 hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-4 text-sm">
                                                    <p className="font-bold text-gray-900">{run.month}</p>
                                                    <p className="text-xs text-gray-500">{run.year}</p>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {new Date(run.startDate).toLocaleDateString()} -{' '}
                                                    {new Date(run.endDate).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-gray-900 font-medium">
                                                    ৳{run.totalSalary.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-green-600 font-medium">
                                                    ৳{run.totalBonus.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-red-600 font-medium">
                                                    ৳{run.totalDeduction.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-blue-600 font-bold text-lg">
                                                    ৳{run.netPayroll.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-bold ${run.status === 'Processed'
                                                            ? 'bg-green-100 text-green-700'
                                                            : run.status === 'Draft'
                                                                ? 'bg-yellow-100 text-yellow-700'
                                                                : 'bg-gray-100 text-gray-700'
                                                            }`}
                                                    >
                                                        {run.status}
                                                    </span>
                                                    {run.processedDate && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {new Date(run.processedDate).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-1">
                                                        {run.status === 'Draft' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleProcessPayroll(run.id)}
                                                                    className="p-2 text-green-600 hover:bg-green-100 rounded"
                                                                    title="Process Payroll"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleLock(run.id)}
                                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                                                                    title="Lock Payroll"
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {run.status === 'Processed' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUndo(run.id)}
                                                                    className="p-2 text-orange-600 hover:bg-orange-100 rounded"
                                                                    title="Undo Processing"
                                                                >
                                                                    <RefreshCw className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleLock(run.id)}
                                                                    className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                                                                    title="Lock Payroll"
                                                                >
                                                                    <Download className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {run.status === 'Locked' && (
                                                            <span className="text-xs text-gray-500 font-bold">LOCKED</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredRuns.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                                                    {appliedSearchTerm
                                                        ? `No payroll runs found for "${appliedSearchTerm}".`
                                                        : 'No payroll runs found.'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Form Modal */}
                            {showForm && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Create New Payroll</h2>
                                        <form onSubmit={handleSubmit}>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Month
                                                </label>
                                                <select
                                                    value={formData.month}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, month: e.target.value })
                                                    }
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                >
                                                    <option value="">Select Month</option>
                                                    {[
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
                                                    ].map((m) => (
                                                        <option key={m} value={m}>
                                                            {m}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Year
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.year}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, year: parseInt(e.target.value) })
                                                    }
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Total Salary
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.salary}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, salary: parseFloat(e.target.value) })
                                                    }
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Total Bonus
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.bonus}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, bonus: parseFloat(e.target.value) })
                                                    }
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                            </div>
                                            <div className="mb-6">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Total Deduction
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.deduction}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, deduction: parseFloat(e.target.value) })
                                                    }
                                                    required
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                            </div>

                                            <div className="flex gap-3">
                                                <button
                                                    type="submit"
                                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                >
                                                    Create Payroll
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setShowForm(false)}
                                                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            )}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}


