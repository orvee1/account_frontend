'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import {
    Edit2,
    Trash2,
    Plus,
} from 'lucide-react';
import { createRecurringTransaction, deleteRecurringTransaction, fetchRecurringTransactions, updateRecurringTransaction } from '@/services/transactions';

export default function RecurringAdjustmentsPage() {
    const { user, loading } = useAuth();
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        number: '',
        description: '',
        type: 'recurring',
        frequency: 'monthly',
        nextDate: new Date().toISOString().split('T')[0],
        amount: '',
        debitAccount: '',
        creditAccount: '',
        status: 'active',
    });

    useEffect(() => {
        if (loading) return;
        if (user) {
            loadItems();
        } else {
            setIsLoading(false);
        }
    }, [user, loading]);

    const loadItems = async () => {
        try {
            setIsLoading(true);
            const response = await fetchRecurringTransactions();
            const data = response.data?.data || response.data || [];
            const mapped = data.map((item) => ({
                id: item.id,
                date: item.start_date || item.next_date || item.created_at,
                number: item.transaction_number,
                description: item.description || '',
                type: item.type || 'recurring',
                frequency: item.frequency || null,
                nextDate: item.next_date || null,
                amount: Number(item.amount || 0),
                debitAccount: item.fromAccount?.name || item.from_account_name || '',
                creditAccount: item.toAccount?.name || item.to_account_name || '',
                status: item.status || (item.is_active ? 'active' : 'inactive'),
                lastApplied: item.start_date || null,
            }));
            setItems(mapped);
        } catch (error) {
            console.error('Error loading items:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            transaction_number: formData.number || undefined,
            type: formData.type,
            frequency: formData.type === 'recurring' ? formData.frequency : null,
            from_account_name: formData.debitAccount,
            to_account_name: formData.creditAccount,
            amount: formData.amount,
            description: formData.description,
            start_date: formData.date,
            next_date: formData.type === 'recurring' ? formData.nextDate : null,
            status: formData.status,
            is_active: formData.status === 'active',
        };

        if (editingId) {
            const response = await updateRecurringTransaction(editingId, payload);
            if (response.ok) {
                await loadItems();
            }
        } else {
            const response = await createRecurringTransaction(payload);
            if (response.ok) {
                await loadItems();
            }
        }
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            number: '',
            description: '',
            type: 'recurring',
            frequency: 'monthly',
            nextDate: new Date().toISOString().split('T')[0],
            amount: '',
            debitAccount: '',
            creditAccount: '',
            status: 'active',
        });
        setShowForm(false);
        setEditingId(null);
    };

    const handleEdit = (item) => {
        setFormData(item);
        setEditingId(item.id);
        setShowForm(true);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this item?')) {
            deleteRecurringTransaction(id).then(() => loadItems());
        }
    };

    const filteredItems = items
        .filter((item) => (filter === 'all' ? true : item.status === filter))
        .filter(
            (item) =>
                item.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description.toLowerCase().includes(searchTerm.toLowerCase())
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
                                    <p className="text-gray-600 mt-1">
                                        Manage recurring transactions and period adjustments
                                    </p>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Total Items</p>
                                    <p className="text-2xl font-bold text-gray-900">{items.length}</p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Active Recurring</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {items.filter((i) => i.type === 'recurring' && i.status === 'active').length}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Total Adjustments</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        ${items
                                            .filter((i) => i.type === 'adjustment')
                                            .reduce((sum, i) => sum + i.amount, 0)
                                            .toLocaleString('en-US', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Inactive</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {items.filter((i) => i.status !== 'active').length}
                                    </p>
                                </div>
                            </div>

                            {/* Filters and Search */}
                            <div className="flex justify-end mb-6">
                                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                                    <div className="mr-auto w-full sm:w-64 md:w-80">
                                        <input
                                            type="text"
                                            placeholder="Search by number or description..."
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
                                        <option value="completed">Completed</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="flex h-10 items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <Plus className="w-5 h-5" />
                                        New Entry
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="bg-white rounded-lg shadow overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Number
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Description
                                            </th>
                                            <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">
                                                Type
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Frequency
                                            </th>
                                            <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                Amount
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
                                        {filteredItems.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="border-b border-gray-200 hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-4 text-sm font-medium text-blue-600">
                                                    {item.number}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    <div>
                                                        <p className="font-medium">{item.description}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {item.debitAccount} ↔ {item.creditAccount}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span
                                                        className={`px-2 py-1 rounded text-xs font-semibold ${item.type === 'recurring'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-purple-100 text-purple-800'
                                                            }`}
                                                    >
                                                        {item.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {item.frequency ? (
                                                        <div>
                                                            <p>{item.frequency}</p>
                                                            <p className="text-xs text-gray-500">
                                                                Next: {new Date(item.nextDate).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                    ${item.amount.toLocaleString('en-US', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${item.status === 'active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : item.status === 'completed'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                            }`}
                                                    >
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(item)}
                                                            className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(item.id)}
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
                                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full mx-4">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                            {editingId ? 'Edit Entry' : 'New Entry'}
                                        </h2>
                                        <form onSubmit={handleSubmit}>
                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Date
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={formData.date}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, date: e.target.value })
                                                        }
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Number
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.number}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, number: e.target.value })
                                                        }
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Description
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.description}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, description: e.target.value })
                                                        }
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Type
                                                    </label>
                                                    <select
                                                        value={formData.type}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, type: e.target.value })
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    >
                                                        <option value="recurring">Recurring</option>
                                                        <option value="adjustment">Adjustment</option>
                                                    </select>
                                                </div>
                                                {formData.type === 'recurring' && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Frequency
                                                        </label>
                                                        <select
                                                            value={formData.frequency}
                                                            onChange={(e) =>
                                                                setFormData({ ...formData, frequency: e.target.value })
                                                            }
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                        >
                                                            <option value="monthly">Monthly</option>
                                                            <option value="quarterly">Quarterly</option>
                                                            <option value="semi-annual">Semi-annual</option>
                                                            <option value="annual">Annual</option>
                                                        </select>
                                                    </div>
                                                )}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Amount
                                                    </label>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={formData.amount}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, amount: parseFloat(e.target.value) })
                                                        }
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Debit Account
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.debitAccount}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, debitAccount: e.target.value })
                                                        }
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Credit Account
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.creditAccount}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, creditAccount: e.target.value })
                                                        }
                                                        required
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
                                                        <option value="completed">Completed</option>
                                                        <option value="inactive">Inactive</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 mt-6">
                                                <button
                                                    type="submit"
                                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                >
                                                    {editingId ? 'Update' : 'Create'} Entry
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


