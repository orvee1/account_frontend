'use client';

import { toDateInput } from "@/utils/accounting-date.mjs";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import {
    Edit2,
    Trash2,
    Plus,
} from 'lucide-react';

export default function SalarySetupPage() {
    const { user, loading } = useAuth();
    const [salarySetups, setSalarySetups] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        employeeId: '',
        employeeName: '',
        baseSalary: '',
        houseRent: '',
        medical: '',
        transport: '',
        otherAllowance: '',
        providentFund: '',
        tax: '',
        otherDeduction: '',
        effectiveDate: toDateInput(),
    });

    useEffect(() => {
        if (loading) return;
        if (user) {
            loadSalarySetups();
        } else {
            setIsLoading(false);
        }
    }, [user, loading]);

    const loadSalarySetups = async () => {
        try {
            setIsLoading(true);
            const mockSetups = [
                {
                    id: 1,
                    employeeId: 'EMP-001',
                    employeeName: 'Md Ahmed',
                    baseSalary: 50000,
                    houseRent: 15000,
                    medical: 5000,
                    transport: 3000,
                    otherAllowance: 2000,
                    providentFund: 5000,
                    tax: 3500,
                    otherDeduction: 1000,
                    effectiveDate: '2024-01-01',
                },
                {
                    id: 2,
                    employeeId: 'EMP-002',
                    employeeName: 'Fatima Akter',
                    baseSalary: 45000,
                    houseRent: 12000,
                    medical: 4500,
                    transport: 2500,
                    otherAllowance: 1500,
                    providentFund: 4500,
                    tax: 3000,
                    otherDeduction: 800,
                    effectiveDate: '2024-01-01',
                },
                {
                    id: 3,
                    employeeId: 'EMP-003',
                    employeeName: 'Karim Hassan',
                    baseSalary: 35000,
                    houseRent: 10000,
                    medical: 3500,
                    transport: 2000,
                    otherAllowance: 1000,
                    providentFund: 3500,
                    tax: 2500,
                    otherDeduction: 600,
                    effectiveDate: '2024-01-01',
                },
            ];
            setSalarySetups(mockSetups);
        } catch (error) {
            console.error('Error loading salary setups:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingId) {
            setSalarySetups(
                salarySetups.map((setup) =>
                    setup.id === editingId ? { ...formData, id: editingId } : setup
                )
            );
        } else {
            setSalarySetups([
                ...salarySetups,
                { ...formData, id: Date.now() },
            ]);
        }
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            employeeId: '',
            employeeName: '',
            baseSalary: '',
            houseRent: '',
            medical: '',
            transport: '',
            otherAllowance: '',
            providentFund: '',
            tax: '',
            otherDeduction: '',
            effectiveDate: toDateInput(),
        });
        setShowForm(false);
        setEditingId(null);
    };

    const handleEdit = (setup) => {
        setFormData(setup);
        setEditingId(setup.id);
        setShowForm(true);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure?')) {
            setSalarySetups(salarySetups.filter((s) => s.id !== id));
        }
    };

    const calculateGrossSalary = () => {
        return (
            (parseFloat(formData.baseSalary) || 0) +
            (parseFloat(formData.houseRent) || 0) +
            (parseFloat(formData.medical) || 0) +
            (parseFloat(formData.transport) || 0) +
            (parseFloat(formData.otherAllowance) || 0)
        );
    };

    const calculateDeductions = () => {
        return (
            (parseFloat(formData.providentFund) || 0) +
            (parseFloat(formData.tax) || 0) +
            (parseFloat(formData.otherDeduction) || 0)
        );
    };

    const calculateNetSalary = () => {
        return calculateGrossSalary() - calculateDeductions();
    };

    const filteredSetups = salarySetups.filter(
        (setup) =>
            setup.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            setup.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading || isLoading) {
        return <div className="p-4 md:p-6">Loading...</div>;
    }

    return (
        <div>
            <div className="flex-1 flex flex-col bg-gray-50">
                <div className="flex flex-1">
                    <main className="flex-1 overflow-auto">
                        <div className="p-4 md:p-6">
                            {/* Header */}
                            <div className="mb-6">
                                <div>
                                    <p className="text-gray-600 mt-1">Configure salary structure and allowances</p>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Total Employees Configured</p>
                                    <p className="text-2xl font-bold text-gray-900">{salarySetups.length}</p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Average Base Salary</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        ৳{(
                                            salarySetups.reduce((sum, s) => sum + s.baseSalary, 0) /
                                            salarySetups.length || 0
                                        ).toLocaleString('en-US', {
                                            minimumFractionDigits: 0,
                                            maximumFractionDigits: 0,
                                        })}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Total Monthly Payroll</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        ৳{salarySetups
                                            .reduce((sum, s) => {
                                                const gross =
                                                    s.baseSalary +
                                                    s.houseRent +
                                                    s.medical +
                                                    s.transport +
                                                    s.otherAllowance;
                                                const deductions =
                                                    s.providentFund + s.tax + s.otherDeduction;
                                                return sum + (gross - deductions);
                                            }, 0)
                                            .toLocaleString('en-US', {
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0,
                                            })}
                                    </p>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="flex justify-end mb-6">
                                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                                    <input
                                        type="text"
                                        placeholder="Search by employee ID or name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="mr-auto h-10 w-full px-4 py-2 border border-gray-300 rounded-lg sm:w-64 md:w-80"
                                    />
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="flex h-10 items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <Plus className="w-5 h-5" />
                                        New Setup
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="bg-white rounded-lg shadow overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Employee
                                            </th>
                                            <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                Base Salary
                                            </th>
                                            <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                Allowances
                                            </th>
                                            <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                Gross
                                            </th>
                                            <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                Deductions
                                            </th>
                                            <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                Net Salary
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Effective Date
                                            </th>
                                            <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredSetups.map((setup) => {
                                            const gross =
                                                setup.baseSalary +
                                                setup.houseRent +
                                                setup.medical +
                                                setup.transport +
                                                setup.otherAllowance;
                                            const deductions =
                                                setup.providentFund + setup.tax + setup.otherDeduction;
                                            const net = gross - deductions;
                                            return (
                                                <tr
                                                    key={setup.id}
                                                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                                                >
                                                    <td className="px-6 py-4 text-sm">
                                                        <p className="font-bold text-gray-900">{setup.employeeName}</p>
                                                        <p className="text-xs text-gray-500">{setup.employeeId}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm text-gray-900 font-medium">
                                                        ৳{setup.baseSalary.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm text-gray-900 font-medium">
                                                        ৳{(setup.houseRent + setup.medical + setup.transport + setup.otherAllowance).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm text-blue-600 font-bold">
                                                        ৳{gross.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm text-red-600 font-bold">
                                                        ৳{deductions.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-right text-sm text-green-600 font-bold">
                                                        ৳{net.toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-700">
                                                        {new Date(setup.effectiveDate).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex justify-center gap-2">
                                                            <button
                                                                onClick={() => handleEdit(setup)}
                                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(setup.id)}
                                                                className="p-2 text-red-600 hover:bg-red-100 rounded"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Form Modal */}
                            {showForm && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                            {editingId ? 'Edit Salary Setup' : 'New Salary Setup'}
                                        </h2>
                                        <form onSubmit={handleSubmit}>
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Employee ID
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.employeeId}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, employeeId: e.target.value })
                                                        }
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Employee Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.employeeName}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, employeeName: e.target.value })
                                                        }
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Effective Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={formData.effectiveDate}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, effectiveDate: e.target.value })
                                                        }
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                            </div>

                                            {/* Earnings */}
                                            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                <h3 className="text-sm font-bold text-gray-900 mb-3">Earnings</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Base Salary
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={formData.baseSalary}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, baseSalary: parseFloat(e.target.value) })
                                                            }
                                                            required
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            House Rent
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={formData.houseRent}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, houseRent: parseFloat(e.target.value) })
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Medical
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={formData.medical}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, medical: parseFloat(e.target.value) })
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Transport
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={formData.transport}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, transport: parseFloat(e.target.value) })
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                        />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Other Allowance
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={formData.otherAllowance}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, otherAllowance: parseFloat(e.target.value) })
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="mt-3 p-3 bg-white rounded border border-blue-300">
                                                    <p className="text-sm font-bold text-gray-900">
                                                        Gross Salary: ৳{calculateGrossSalary().toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Deductions */}
                                            <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                                                <h3 className="text-sm font-bold text-gray-900 mb-3">Deductions</h3>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Provident Fund
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={formData.providentFund}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, providentFund: parseFloat(e.target.value) })
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Tax
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={formData.tax}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, tax: parseFloat(e.target.value) })
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                        />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Other Deduction
                                                        </label>
                                                        <input
                                                            type="number"
                                                            value={formData.otherDeduction}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, otherDeduction: parseFloat(e.target.value) })
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="mt-3 p-3 bg-white rounded border border-red-300">
                                                    <p className="text-sm font-bold text-gray-900">
                                                        Total Deductions: ৳{calculateDeductions().toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Net Salary */}
                                            <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-300">
                                                <p className="text-lg font-bold text-green-700">
                                                    Net Salary: ৳{calculateNetSalary().toLocaleString()}
                                                </p>
                                            </div>

                                            <div className="flex gap-3 mt-6">
                                                <button
                                                    type="submit"
                                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                >
                                                    {editingId ? 'Update' : 'Create'} Setup
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={resetForm}
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


