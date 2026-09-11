'use client';

import { toDateInput } from "@/utils/accounting-date.mjs";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import {
    Edit2,
    Trash2,
    Plus,
} from 'lucide-react';
import { createCreditNote, deleteCreditNote, fetchCreditNotes, updateCreditNote } from '@/services/transactions';

export default function CreditNotePage() {
    const { user, loading } = useAuth();
    const [creditNotes, setCreditNotes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        date: toDateInput(),
        creditNoteNumber: '',
        customer: '',
        amount: '',
        reason: 'return',
        reference: '',
        description: '',
        status: 'draft',
    });

    useEffect(() => {
        if (loading) return;
        if (user) {
            loadCreditNotes();
        } else {
            setIsLoading(false);
        }
    }, [user, loading]);

    const loadCreditNotes = async () => {
        try {
            setIsLoading(true);
            const response = await fetchCreditNotes();
            const data = response.data?.data || response.data || [];
            const mapped = data.map((note) => ({
                id: note.id,
                date: note.note_date,
                creditNoteNumber: note.credit_note_number,
                customer: note.customer?.name || note.customer_name || '',
                amount: Number(note.amount || 0),
                reason: note.reason || '',
                reference: note.invoice_reference || '',
                description: note.description || '',
                status: note.status || 'draft',
            }));
            setCreditNotes(mapped);
        } catch (error) {
            console.error('Error loading credit notes:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const payload = {
            customer_name: formData.customer,
            note_date: formData.date,
            credit_note_number: formData.creditNoteNumber || undefined,
            invoice_reference: formData.reference,
            amount: formData.amount,
            reason: formData.reason,
            description: formData.description,
            status: formData.status,
        };

        if (editingId) {
            const response = await updateCreditNote(editingId, payload);
            if (response.ok) {
                await loadCreditNotes();
            }
        } else {
            const response = await createCreditNote(payload);
            if (response.ok) {
                await loadCreditNotes();
            }
        }
        resetForm();
    };

    const resetForm = () => {
        setFormData({
            date: toDateInput(),
            creditNoteNumber: '',
            customer: '',
            amount: '',
            reason: 'return',
            reference: '',
            description: '',
            status: 'draft',
        });
        setShowForm(false);
        setEditingId(null);
    };

    const handleEdit = (creditNote) => {
        setFormData(creditNote);
        setEditingId(creditNote.id);
        setShowForm(true);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this credit note?')) {
            deleteCreditNote(id).then(() => loadCreditNotes());
        }
    };

    const filteredCreditNotes = creditNotes
        .filter((cn) => (filter === 'all' ? true : cn.status === filter))
        .filter((cn) =>
            cn.creditNoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cn.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cn.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const reasonLabels = {
        return: 'Product Return',
        discount: 'Additional Discount',
        damage_claim: 'Damage Claim',
        overpayment: 'Overpayment',
        other: 'Other',
    };

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
                                        Manage credit notes against customer invoices
                                    </p>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Total Credit Notes</p>
                                    <p className="text-2xl font-bold text-gray-900">{creditNotes.length}</p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Total Amount</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        ${creditNotes.reduce((sum, cn) => sum + cn.amount, 0).toLocaleString('en-US', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Approved</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {creditNotes.filter((cn) => cn.status === 'approved').length}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Draft</p>
                                    <p className="text-2xl font-bold text-yellow-600">
                                        {creditNotes.filter((cn) => cn.status === 'draft').length}
                                    </p>
                                </div>
                            </div>

                            {/* Filters and Search */}
                            <div className="flex justify-end mb-6">
                                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                                    <div className="mr-auto w-full sm:w-64 md:w-80">
                                        <input
                                            type="text"
                                            placeholder="Search by credit note number, customer, or description..."
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
                                        <option value="approved">Approved</option>
                                    </select>
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className="flex h-10 items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <Plus className="w-5 h-5" />
                                        New Credit Note
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="bg-white rounded-lg shadow overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Credit Note #
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Date
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Customer
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Reason
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
                                        {filteredCreditNotes.map((creditNote) => (
                                            <tr
                                                key={creditNote.id}
                                                className="border-b border-gray-200 hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-4 text-sm font-medium text-blue-600">
                                                    {creditNote.creditNoteNumber}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {new Date(creditNote.date).toLocaleDateString()}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {creditNote.customer}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {reasonLabels[creditNote.reason] || creditNote.reason}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                    ${creditNote.amount.toLocaleString('en-US', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${creditNote.status === 'approved'
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                            }`}
                                                    >
                                                        {creditNote.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(creditNote)}
                                                            className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(creditNote.id)}
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
                                            {editingId ? 'Edit Credit Note' : 'New Credit Note'}
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
                                                        Credit Note Number
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.creditNoteNumber}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, creditNoteNumber: e.target.value })
                                                        }
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Customer
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.customer}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, customer: e.target.value })
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
                                                        Reason
                                                    </label>
                                                    <select
                                                        value={formData.reason}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, reason: e.target.value })
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    >
                                                        <option value="return">Product Return</option>
                                                        <option value="discount">Additional Discount</option>
                                                        <option value="damage_claim">Damage Claim</option>
                                                        <option value="overpayment">Overpayment</option>
                                                        <option value="other">Other</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Reference Invoice
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
                                                        <option value="approved">Approved</option>
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
                                                    {editingId ? 'Update' : 'Create'} Credit Note
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


