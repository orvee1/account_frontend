'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import {
    Edit2,
    Trash2,
    Plus,
    X,
} from 'lucide-react';
import { createManualJournal, deleteManualJournal, fetchManualJournals, updateManualJournal } from '@/services/transactions';

export default function ManualJournalPage() {
    const { user, loading } = useAuth();
    const [journals, setJournals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        journalNumber: '',
        description: '',
        status: 'draft',
        entries: [
            { account: '', type: 'debit', amount: '' },
            { account: '', type: 'credit', amount: '' },
        ],
    });

    useEffect(() => {
        if (loading) return;
        if (user) {
            loadJournals();
        } else {
            setIsLoading(false);
        }
    }, [user, loading]);

    const loadJournals = async () => {
        try {
            setIsLoading(true);
            const response = await fetchManualJournals();
            const data = response.data?.data || response.data || [];
            const mapped = data.map((journal) => ({
                id: journal.id,
                date: journal.journal_date,
                journalNumber: journal.journal_number,
                description: journal.description || '',
                status: journal.status || 'posted',
                entries: [
                    {
                        account: journal.debit_account?.name || journal.debit_account_name || '',
                        type: 'debit',
                        amount: Number(journal.debit_amount || 0),
                    },
                    {
                        account: journal.credit_account?.name || journal.credit_account_name || '',
                        type: 'credit',
                        amount: Number(journal.credit_amount || 0),
                    },
                ],
            }));
            setJournals(mapped);
        } catch (error) {
            console.error('Error loading journals:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate entries
        if (formData.entries.length < 2) {
            alert('At least 2 entries required');
            return;
        }

        const totalDebit = formData.entries
            .filter((e) => e.type === 'debit')
            .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
        const totalCredit = formData.entries
            .filter((e) => e.type === 'credit')
            .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            alert('Journal must balance! Debit and Credit totals do not match.');
            return;
        }

        const debitEntry = formData.entries.find((entry) => entry.type === 'debit');
        const creditEntry = formData.entries.find((entry) => entry.type === 'credit');

        if (!debitEntry || !creditEntry) {
            alert('At least one debit and one credit entry are required.');
            return;
        }

        const payload = {
            journal_date: formData.date,
            journal_number: formData.journalNumber || undefined,
            description: formData.description,
            status: formData.status,
            debit_amount: debitEntry?.amount || 0,
            credit_amount: creditEntry?.amount || 0,
            debit_account_name: debitEntry?.account || '',
            credit_account_name: creditEntry?.account || '',
        };

        if (editingId) {
            const response = await updateManualJournal(editingId, payload);
            if (response.ok) {
                await loadJournals();
            }
        } else {
            const response = await createManualJournal(payload);
            if (response.ok) {
                await loadJournals();
            }
        }
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            date: new Date().toISOString().split('T')[0],
            journalNumber: '',
            description: '',
            status: 'draft',
            entries: [
                { account: '', type: 'debit', amount: '' },
                { account: '', type: 'credit', amount: '' },
            ],
        });
        setShowForm(false);
        setEditingId(null);
    };

    const handleEdit = (journal) => {
        setFormData(journal);
        setEditingId(journal.id);
        setShowForm(true);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this journal entry?')) {
            deleteManualJournal(id).then(() => loadJournals());
        }
    };

    const handleAddEntry = () => {
        setFormData({
            ...formData,
            entries: [...formData.entries, { account: '', type: 'debit', amount: '' }],
        });
    };

    const handleRemoveEntry = (index) => {
        const newEntries = formData.entries.filter((_, i) => i !== index);
        setFormData({ ...formData, entries: newEntries });
    };

    const handleEntryChange = (index, field, value) => {
        const newEntries = [...formData.entries];
        newEntries[index][field] = value;
        setFormData({ ...formData, entries: newEntries });
    };

    const filteredJournals = journals
        .filter((j) => (filter === 'all' ? true : j.status === filter))
        .filter((j) =>
            j.journalNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            j.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const calculateTotals = () => {
        return {
            debit: formData.entries
                .filter((e) => e.type === 'debit')
                .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
            credit: formData.entries
                .filter((e) => e.type === 'credit')
                .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0),
        };
    };

    if (loading || isLoading) {
        return <div className="p-8">Loading...</div>;
    }

    const totals = calculateTotals();

    return (
        <div>
            <div className="flex-1 flex flex-col bg-gray-50">
                <div className="flex flex-1">
                    <main className="flex-1 overflow-auto">
                        <div className="p-8">
                            {/* Header */}
                            <div className="mb-6">
                                <div>
                                    <p className="text-gray-600 mt-1">Create and manage manual journal entries</p>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Total Entries</p>
                                    <p className="text-2xl font-bold text-gray-900">{journals.length}</p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Total Debit</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        ${journals
                                            .reduce((sum, j) => {
                                                return (
                                                    sum +
                                                    j.entries
                                                        .filter((e) => e.type === 'debit')
                                                        .reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
                                                );
                                            }, 0)
                                            .toLocaleString('en-US', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Total Credit</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        ${journals
                                            .reduce((sum, j) => {
                                                return (
                                                    sum +
                                                    j.entries
                                                        .filter((e) => e.type === 'credit')
                                                        .reduce((s, e) => s + (parseFloat(e.amount) || 0), 0)
                                                );
                                            }, 0)
                                            .toLocaleString('en-US', {
                                                minimumFractionDigits: 2,
                                                maximumFractionDigits: 2,
                                            })}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Posted</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {journals.filter((j) => j.status === 'posted').length}
                                    </p>
                                </div>
                            </div>

                            {/* Filters and Search */}
                            <div className="flex justify-end mb-6">
                                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                                    <div className="w-full sm:w-64 md:w-80">
                                        <input
                                            type="text"
                                            placeholder="Search by journal number or description..."
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
                                        <option value="posted">Posted</option>
                                    </select>
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="flex h-10 items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <Plus className="w-5 h-5" />
                                        New Journal Entry
                                    </button>
                                </div>
                            </div>

                            {/* Journals List */}
                            <div className="space-y-4">
                                {filteredJournals.map((journal) => (
                                    <div key={journal.id} className="bg-white rounded-lg shadow overflow-hidden">
                                        <div className="p-6 border-b border-gray-200">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900">
                                                        {journal.journalNumber}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">{journal.description}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${journal.status === 'posted'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                            }`}
                                                    >
                                                        {journal.status}
                                                    </span>
                                                    <button
                                                        onClick={() => handleEdit(journal)}
                                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(journal.id)}
                                                        className="p-2 text-red-600 hover:bg-red-100 rounded"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-2">
                                                {new Date(journal.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="bg-gray-50 border-t border-gray-200">
                                                        <th className="px-6 py-3 text-left font-semibold text-gray-900">
                                                            Account
                                                        </th>
                                                        <th className="px-6 py-3 text-right font-semibold text-gray-900">
                                                            Debit
                                                        </th>
                                                        <th className="px-6 py-3 text-right font-semibold text-gray-900">
                                                            Credit
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {journal.entries.map((entry, idx) => (
                                                        <tr key={idx} className="border-t border-gray-200">
                                                            <td className="px-6 py-3 text-gray-700">{entry.account}</td>
                                                            <td className="px-6 py-3 text-right text-gray-700">
                                                                {entry.type === 'debit'
                                                                    ? `$${parseFloat(entry.amount).toLocaleString('en-US', {
                                                                        minimumFractionDigits: 2,
                                                                        maximumFractionDigits: 2,
                                                                    })}`
                                                                    : '-'}
                                                            </td>
                                                            <td className="px-6 py-3 text-right text-gray-700">
                                                                {entry.type === 'credit'
                                                                    ? `$${parseFloat(entry.amount).toLocaleString('en-US', {
                                                                        minimumFractionDigits: 2,
                                                                        maximumFractionDigits: 2,
                                                                    })}`
                                                                    : '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                                                        <td className="px-6 py-3">Total</td>
                                                        <td className="px-6 py-3 text-right">
                                                            $
                                                            {journal.entries
                                                                .filter((e) => e.type === 'debit')
                                                                .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
                                                                .toLocaleString('en-US', {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}
                                                        </td>
                                                        <td className="px-6 py-3 text-right">
                                                            $
                                                            {journal.entries
                                                                .filter((e) => e.type === 'credit')
                                                                .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
                                                                .toLocaleString('en-US', {
                                                                    minimumFractionDigits: 2,
                                                                    maximumFractionDigits: 2,
                                                                })}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Form Modal */}
                            {showForm && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                            {editingId ? 'Edit Journal Entry' : 'New Journal Entry'}
                                        </h2>
                                        <form onSubmit={handleSubmit}>
                                            <div className="grid grid-cols-2 gap-4 mb-6">
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
                                                        Journal Number
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.journalNumber}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, journalNumber: e.target.value })
                                                        }
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                            </div>
                                            <div className="mb-6">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Description
                                                </label>
                                                <textarea
                                                    value={formData.description}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, description: e.target.value })
                                                    }
                                                    rows="2"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                ></textarea>
                                            </div>

                                            {/* Entries Table */}
                                            <div className="mb-6">
                                                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                                                    Journal Entries
                                                </h3>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="bg-gray-100">
                                                                <th className="px-4 py-2 text-left font-semibold">Account</th>
                                                                <th className="px-4 py-2 text-center font-semibold">Type</th>
                                                                <th className="px-4 py-2 text-right font-semibold">Amount</th>
                                                                <th className="px-4 py-2 text-center font-semibold">Action</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {formData.entries.map((entry, idx) => (
                                                                <tr key={idx} className="border-t">
                                                                    <td className="px-4 py-2">
                                                                        <input
                                                                            type="text"
                                                                            value={entry.account}
                                                                            onChange={(e) =>
                                                                                handleEntryChange(idx, 'account', e.target.value)
                                                                            }
                                                                            placeholder="Account Name"
                                                                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                                                        />
                                                                    </td>
                                                                    <td className="px-4 py-2">
                                                                        <select
                                                                            value={entry.type}
                                                                            onChange={(e) =>
                                                                                handleEntryChange(idx, 'type', e.target.value)
                                                                            }
                                                                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                                                                        >
                                                                            <option value="debit">Debit</option>
                                                                            <option value="credit">Credit</option>
                                                                        </select>
                                                                    </td>
                                                                    <td className="px-4 py-2">
                                                                        <input
                                                                            type="number"
                                                                            step="0.01"
                                                                            value={entry.amount}
                                                                            onChange={(e) =>
                                                                                handleEntryChange(idx, 'amount', e.target.value)
                                                                            }
                                                                            placeholder="0.00"
                                                                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs text-right"
                                                                        />
                                                                    </td>
                                                                    <td className="px-4 py-2 text-center">
                                                                        {formData.entries.length > 2 && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleRemoveEntry(idx)}
                                                                                className="text-red-600 hover:bg-red-100 p-1 rounded"
                                                                            >
                                                                                <X className="w-4 h-4" />
                                                                            </button>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                            <tr className="bg-gray-50 font-bold">
                                                                <td className="px-4 py-2">Total</td>
                                                                <td></td>
                                                                <td className="px-4 py-2 text-right space-x-4">
                                                                    <span>
                                                                        Dr: $
                                                                        {totals.debit.toLocaleString('en-US', {
                                                                            minimumFractionDigits: 2,
                                                                            maximumFractionDigits: 2,
                                                                        })}
                                                                    </span>
                                                                    <span>
                                                                        Cr: $
                                                                        {totals.credit.toLocaleString('en-US', {
                                                                            minimumFractionDigits: 2,
                                                                            maximumFractionDigits: 2,
                                                                        })}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={handleAddEntry}
                                                    className="mt-3 px-4 py-2 text-sm bg-gray-200 text-gray-900 rounded hover:bg-gray-300"
                                                >
                                                    + Add Entry
                                                </button>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                                                    <option value="posted">Posted</option>
                                                </select>
                                            </div>

                                            <div className="flex gap-3 mt-6">
                                                <button
                                                    type="submit"
                                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                >
                                                    {editingId ? 'Update' : 'Create'} Journal Entry
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


