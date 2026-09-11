'use client';

import { toDateInput } from "@/utils/accounting-date.mjs";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import {
    Edit2,
    Trash2,
    Plus,
} from 'lucide-react';
import { createTransactionTransfer, deleteTransactionTransfer, fetchTransactionTransfers, updateTransactionTransfer } from '@/services/transactions';

export default function TransactionTransferPage() {
    const { user, loading } = useAuth();
    const [transfers, setTransfers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        date: toDateInput(),
        transferNumber: '',
        fromAccount: '',
        toAccount: '',
        amount: '',
        description: '',
        reference: '',
        status: 'draft',
    });

    useEffect(() => {
        if (loading) return;
        if (user) {
            loadTransfers();
        } else {
            setIsLoading(false);
        }
    }, [user, loading]);

    const loadTransfers = async () => {
        try {
            setIsLoading(true);
            const response = await fetchTransactionTransfers();
            const data = response.data?.data || response.data || [];
            const mapped = data.map((transfer) => ({
                id: transfer.id,
                date: transfer.transfer_date,
                transferNumber: transfer.transfer_number,
                fromAccount: transfer.fromAccount?.name || transfer.from_account_name || '',
                toAccount: transfer.toAccount?.name || transfer.to_account_name || '',
                amount: Number(transfer.amount || 0),
                description: transfer.description || '',
                reference: transfer.reference_number || '',
                status: transfer.status || 'completed',
            }));
            setTransfers(mapped);
        } catch (error) {
            console.error('Error loading transfers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            transfer_date: formData.date,
            transfer_number: formData.transferNumber || undefined,
            from_account_name: formData.fromAccount,
            to_account_name: formData.toAccount,
            amount: formData.amount,
            reference_number: formData.reference,
            description: formData.description,
            status: formData.status,
        };

        if (editingId) {
            const response = await updateTransactionTransfer(editingId, payload);
            if (response.ok) {
                await loadTransfers();
            }
        } else {
            const response = await createTransactionTransfer(payload);
            if (response.ok) {
                await loadTransfers();
            }
        }
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            date: toDateInput(),
            transferNumber: '',
            fromAccount: '',
            toAccount: '',
            amount: '',
            description: '',
            reference: '',
            status: 'draft',
        });
        setShowForm(false);
        setEditingId(null);
    };

    const handleEdit = (transfer) => {
        setFormData(transfer);
        setEditingId(transfer.id);
        setShowForm(true);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this transfer?')) {
            deleteTransactionTransfer(id).then(() => loadTransfers());
        }
    };

    const filteredTransfers = transfers
        .filter((t) => (filter === 'all' ? true : t.status === filter))
        .filter(
            (t) =>
                t.transferNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.fromAccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.toAccount.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.description.toLowerCase().includes(searchTerm.toLowerCase())
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
                                        Manage transfers between accounts
                                    </p>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Total Transfers</p>
                                    <p className="text-2xl font-bold text-gray-900">{transfers.length}</p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Total Amount</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        ${transfers.reduce((sum, t) => sum + t.amount, 0).toLocaleString('en-US', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Completed</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {transfers.filter((t) => t.status === 'completed').length}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Draft</p>
                                    <p className="text-2xl font-bold text-yellow-600">
                                        {transfers.filter((t) => t.status === 'draft').length}
                                    </p>
                                </div>
                            </div>

                            {/* Filters and Search */}
                            <div className="flex justify-end mb-6">
                                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                                    <div className="mr-auto w-full sm:w-64 md:w-80">
                                        <input
                                            type="text"
                                            placeholder="Search by transfer number, accounts, or description..."
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
                                        <option value="draft">Draft</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="flex h-10 items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <Plus className="w-5 h-5" />
                                        New Transfer
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="bg-white rounded-lg shadow overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Transfer #
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Date
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                From Account
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                To Account
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
                                        {filteredTransfers.map((transfer) => (
                                            <tr
                                                key={transfer.id}
                                                className="border-b border-gray-200 hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-4 text-sm font-medium text-blue-600">
                                                    {transfer.transferNumber}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {new Date(transfer.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    <div>
                                                        <p>{transfer.fromAccount}</p>
                                                        <p className="text-xs text-gray-500">From</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    <div>
                                                        <p>{transfer.toAccount}</p>
                                                        <p className="text-xs text-gray-500">To</p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                    ${transfer.amount.toLocaleString('en-US', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${transfer.status === 'completed'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                            }`}
                                                    >
                                                        {transfer.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(transfer)}
                                                            className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(transfer.id)}
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
                                            {editingId ? 'Edit Transfer' : 'New Transfer'}
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
                                                        Transfer Number
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.transferNumber}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, transferNumber: e.target.value })
                                                        }
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        From Account
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.fromAccount}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, fromAccount: e.target.value })
                                                        }
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        To Account
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.toAccount}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, toAccount: e.target.value })
                                                        }
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
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
                                                        Reference
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.reference}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, reference: e.target.value })
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                <div className="col-span-2">
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
                                                        <option value="draft">Draft</option>
                                                        <option value="completed">Completed</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Description
                                                </label>
                                                <textarea
                                                    value={formData.description}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, description: e.target.value })
                                                    }
                                                    rows="3"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                ></textarea>
                                            </div>
                                            <div className="flex gap-3 mt-6">
                                                <button
                                                    type="submit"
                                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                >
                                                    {editingId ? 'Update' : 'Create'} Transfer
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


