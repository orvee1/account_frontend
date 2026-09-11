'use client';

import { toDateInput } from "@/utils/accounting-date.mjs";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import {
    Edit2,
    Trash2,
    Plus,
    Mail,
    Phone,
    MapPin,
} from 'lucide-react';

export default function EmployeeDatabasePage() {
    const { user, loading } = useAuth();
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [filter, setFilter] = useState('active');
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        employeeId: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        dateOfJoining: toDateInput(),
        dateOfBirth: '',
        address: '',
        city: '',
        country: '',
        salaryGrade: '',
        bankAccount: '',
        bankName: '',
        status: 'active',
    });

    useEffect(() => {
        if (loading) return;
        if (user) {
            loadEmployees();
        } else {
            setIsLoading(false);
        }
    }, [user, loading]);

    const loadEmployees = async () => {
        try {
            setIsLoading(true);
            const mockEmployees = [
                {
                    id: 1,
                    employeeId: 'EMP-001',
                    firstName: 'Md',
                    lastName: 'Ahmed',
                    email: 'ahmed@company.com',
                    phone: '01712345678',
                    department: 'Sales',
                    position: 'Sales Manager',
                    dateOfJoining: '2022-01-15',
                    dateOfBirth: '1990-05-20',
                    address: 'House 12, Road 5',
                    city: 'Dhaka',
                    country: 'Bangladesh',
                    salaryGrade: 'Grade A',
                    bankAccount: '123456789',
                    bankName: 'Prime Bank',
                    status: 'active',
                },
                {
                    id: 2,
                    employeeId: 'EMP-002',
                    firstName: 'Fatima',
                    lastName: 'Akter',
                    email: 'fatima@company.com',
                    phone: '01798765432',
                    department: 'Finance',
                    position: 'Senior Accountant',
                    dateOfJoining: '2021-06-20',
                    dateOfBirth: '1988-08-15',
                    address: 'Apartment 5, Building A',
                    city: 'Dhaka',
                    country: 'Bangladesh',
                    salaryGrade: 'Grade B',
                    bankAccount: '987654321',
                    bankName: 'Community Bank',
                    status: 'active',
                },
                {
                    id: 3,
                    employeeId: 'EMP-003',
                    firstName: 'Karim',
                    lastName: 'Hassan',
                    email: 'karim@company.com',
                    phone: '01634567890',
                    department: 'Operations',
                    position: 'Operations Lead',
                    dateOfJoining: '2023-02-10',
                    dateOfBirth: '1995-03-10',
                    address: 'House 45, Road 8',
                    city: 'Dhaka',
                    country: 'Bangladesh',
                    salaryGrade: 'Grade C',
                    bankAccount: '456789123',
                    bankName: 'Prime Bank',
                    status: 'active',
                },
            ];
            setEmployees(mockEmployees);
        } catch (error) {
            console.error('Error loading employees:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingId) {
            setEmployees(
                employees.map((emp) =>
                    emp.id === editingId ? { ...formData, id: editingId } : emp
                )
            );
        } else {
            setEmployees([
                ...employees,
                { ...formData, id: Date.now() },
            ]);
        }
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            employeeId: '',
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            department: '',
            position: '',
            dateOfJoining: toDateInput(),
            dateOfBirth: '',
            address: '',
            city: '',
            country: '',
            salaryGrade: '',
            bankAccount: '',
            bankName: '',
            status: 'active',
        });
        setShowForm(false);
        setEditingId(null);
    };

    const handleEdit = (emp) => {
        setFormData(emp);
        setEditingId(emp.id);
        setShowForm(true);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure?')) {
            setEmployees(employees.filter((e) => e.id !== id));
        }
    };

    const filteredEmployees = employees
        .filter((e) => (filter === 'all' ? true : e.status === filter))
        .filter(
            (e) =>
                e.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.email.toLowerCase().includes(searchTerm.toLowerCase())
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
                                    <p className="text-gray-600 mt-1">Manage employee information</p>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Total Employees</p>
                                    <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Active</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {employees.filter((e) => e.status === 'active').length}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Inactive</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {employees.filter((e) => e.status === 'inactive').length}
                                    </p>
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="flex justify-end mb-6">
                                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                                    <div className="mr-auto w-full sm:w-64 md:w-80">
                                        <input
                                            type="text"
                                            placeholder="Search by ID, name, or email..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <select
                                        value={filter}
                                        onChange={(e) => setFilter(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="flex h-10 items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <Plus className="w-5 h-5" />
                                        Add Employee
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="bg-white rounded-lg shadow overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Employee ID
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Name
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Department
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Position
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Contact
                                            </th>
                                            <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredEmployees.map((emp) => (
                                            <tr
                                                key={emp.id}
                                                className="border-b border-gray-200 hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-4 text-sm font-bold text-blue-600">
                                                    {emp.employeeId}
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <p className="font-medium text-gray-900">
                                                        {emp.firstName} {emp.lastName}
                                                    </p>
                                                    <p className="text-xs text-gray-500">DOB: {emp.dateOfBirth}</p>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {emp.department}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {emp.position}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    <div className="flex flex-col gap-1">
                                                        <a href={`mailto:${emp.email}`} className="text-blue-600 hover:underline text-xs flex items-center gap-1">
                                                            <Mail className="w-3 h-3" /> {emp.email}
                                                        </a>
                                                        <a href={`tel:${emp.phone}`} className="text-blue-600 hover:underline text-xs flex items-center gap-1">
                                                            <Phone className="w-3 h-3" /> {emp.phone}
                                                        </a>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${emp.status === 'active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                            }`}
                                                    >
                                                        {emp.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(emp)}
                                                            className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(emp.id)}
                                                            className="p-2 text-red-600 hover:bg-red-100 rounded"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Form Modal */}
                            {showForm && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                            {editingId ? 'Edit Employee' : 'Add New Employee'}
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
                                                        Date of Joining
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={formData.dateOfJoining}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, dateOfJoining: e.target.value })
                                                        }
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        First Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.firstName}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, firstName: e.target.value })
                                                        }
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Last Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.lastName}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, lastName: e.target.value })
                                                        }
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Email
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, email: e.target.value })
                                                        }
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Phone
                                                    </label>
                                                    <input
                                                        type="tel"
                                                        value={formData.phone}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, phone: e.target.value })
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Date of Birth
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={formData.dateOfBirth}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, dateOfBirth: e.target.value })
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Department
                                                    </label>
                                                    <select
                                                        value={formData.department}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, department: e.target.value })
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    >
                                                        <option value="">Select Department</option>
                                                        <option value="Sales">Sales</option>
                                                        <option value="Finance">Finance</option>
                                                        <option value="Operations">Operations</option>
                                                        <option value="HR">HR</option>
                                                        <option value="IT">IT</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Position
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.position}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, position: e.target.value })
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Salary Grade
                                                    </label>
                                                    <select
                                                        value={formData.salaryGrade}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, salaryGrade: e.target.value })
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    >
                                                        <option value="">Select Grade</option>
                                                        <option value="Grade A">Grade A</option>
                                                        <option value="Grade B">Grade B</option>
                                                        <option value="Grade C">Grade C</option>
                                                        <option value="Grade D">Grade D</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Address
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.address}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, address: e.target.value })
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        City
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.city}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, city: e.target.value })
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Bank Name
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.bankName}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, bankName: e.target.value })
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Bank Account
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.bankAccount}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, bankAccount: e.target.value })
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Status
                                                    </label>
                                                    <select
                                                        value={formData.status}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, status: e.target.value })
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    >
                                                        <option value="active">Active</option>
                                                        <option value="inactive">Inactive</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 mt-6">
                                                <button
                                                    type="submit"
                                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                >
                                                    {editingId ? 'Update' : 'Add'} Employee
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


