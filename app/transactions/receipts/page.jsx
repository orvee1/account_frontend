'use client';

import { toDateInput } from "@/utils/accounting-date.mjs";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import {
    Edit2,
    Trash2,
    Eye,
    Plus,
    Filter,
    Download,
} from 'lucide-react';
import {
    createReceipt,
    deleteReceipt,
    fetchReceipts,
    updateReceipt,
} from '@/services/transactions';

export default function ReceiptsPage() {
    const { user, loading } = useAuth();

    const [receipts, setReceipts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        date: toDateInput(),
        receiptNumber: '',
        bank: '',
        amount: '',
        paymentMode: 'bank_transfer',
        reference: '',
        description: '',
        status: 'completed',
        customer: '',
    });

    const toApiPaymentMode = (mode) => {
        if (mode === 'bank_transfer') return 'bank';
        if (mode === 'card') return 'online';

        return mode;
    };

    const fromApiPaymentMode = (mode) => {
        if (mode === 'bank') return 'bank_transfer';
        if (mode === 'online') return 'card';

        return mode;
    };

    useEffect(() => {
        if (loading) return;

        if (user) {
            loadReceipts();
        } else {
            setIsLoading(false);
        }
    }, [user, loading]);

    const loadReceipts = async () => {
        try {
            setIsLoading(true);

            const response = await fetchReceipts();

            const data =
                response.data?.data ||
                response.data ||
                [];

            const mapped = data.map((receipt) => ({
                id: receipt.id,

                date: toDateInput(
                    receipt.receipt_date || ""
                ),

                receiptNumber:
                    receipt.receipt_number,

                bank:
                    receipt.bank || '',

                amount: Number(
                    receipt.amount_received || 0
                ),

                paymentMode:
                    fromApiPaymentMode(
                        receipt.payment_mode
                    ),

                reference:
                    receipt.reference_number || '',

                description:
                    receipt.description || '',

                status:
                    receipt.status || 'completed',

                customer:
                    receipt.customer?.name ||
                    receipt.customer_name ||
                    '',
            }));

            setReceipts(mapped);
        } catch (error) {
            console.error(
                'Error loading receipts:',
                error
            );
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            customer_name:
                formData.customer,

            receipt_date:
                formData.date,

            amount_received:
                formData.amount,

            payment_mode:
                toApiPaymentMode(
                    formData.paymentMode
                ),

            reference_number:
                formData.reference,

            description:
                formData.description,

            status:
                formData.status,

            receipt_number:
                formData.receiptNumber ||
                undefined,
        };

        setFormError('');
        setSaving(true);

        try {
            const response = editingId
                ? await updateReceipt(
                    editingId,
                    payload
                )
                : await createReceipt(
                    payload
                );

            if (!response.ok) {
                setFormError(
                    response.data?.message ||
                    'Unable to save receipt. Please check the details.'
                );

                return;
            }

            await loadReceipts();

            resetForm();
        } catch (error) {
            setFormError(
                error.response?.data?.message ||
                'Unable to save receipt. Please try again.'
            );
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormError('');

        setFormData({
            date: toDateInput(),
            receiptNumber: '',
            bank: '',
            amount: '',
            paymentMode: 'bank_transfer',
            reference: '',
            description: '',
            status: 'completed',
            customer: '',
        });

        setShowForm(false);
        setEditingId(null);
    };

    const handleEdit = (receipt) => {
        setFormData(receipt);

        setEditingId(
            receipt.id
        );

        setShowForm(true);
    };

    const handleDelete = (id) => {
        if (
            confirm(
                'Are you sure you want to delete this receipt?'
            )
        ) {
            deleteReceipt(id)
                .then(() =>
                    loadReceipts()
                );
        }
    };

    const filteredReceipts = receipts
        .filter((r) =>
            filter === 'all'
                ? true
                : r.status === filter
        )
        .filter((r) =>
            r.receiptNumber
                .toLowerCase()
                .includes(
                    searchTerm.toLowerCase()
                ) ||

            r.customer
                .toLowerCase()
                .includes(
                    searchTerm.toLowerCase()
                ) ||

            r.description
                .toLowerCase()
                .includes(
                    searchTerm.toLowerCase()
                )
        );

    if (
        loading ||
        isLoading
    ) {
        return (
            <div className="p-4 md:p-6">
                Loading...
            </div>
        );
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
                                        Manage money received transactions
                                    </p>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">
                                        Total Receipts
                                    </p>

                                    <p className="text-2xl font-bold text-gray-900">
                                        {receipts.length}
                                    </p>
                                </div>

                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">
                                        Total Amount
                                    </p>

                                    <p className="text-2xl font-bold text-blue-600">
                                        $
                                        {receipts
                                            .reduce(
                                                (sum, r) =>
                                                    sum + r.amount,
                                                0
                                            )
                                            .toLocaleString(
                                                'en-US',
                                                {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                }
                                            )}
                                    </p>
                                </div>

                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">
                                        Completed
                                    </p>

                                    <p className="text-2xl font-bold text-green-600">
                                        {
                                            receipts.filter(
                                                (r) =>
                                                    r.status ===
                                                    'completed'
                                            ).length
                                        }
                                    </p>
                                </div>

                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">
                                        Draft
                                    </p>

                                    <p className="text-2xl font-bold text-yellow-600">
                                        {
                                            receipts.filter(
                                                (r) =>
                                                    r.status ===
                                                    'draft'
                                            ).length
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* Filters and Search */}
                            <div className="flex justify-end mb-6">
                                <div className="flex w-full flex-wrap items-center justify-end gap-2">

                                    <div className="mr-auto w-full sm:w-64 md:w-80">
                                        <input
                                            type="text"
                                            placeholder="Search by receipt number, customer, or description..."
                                            value={searchTerm}
                                            onChange={(e) =>
                                                setSearchTerm(
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>

                                    <select
                                        value={filter}
                                        onChange={(e) =>
                                            setFilter(
                                                e.target.value
                                            )
                                        }
                                        className="px-4 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="all">
                                            All Status
                                        </option>

                                        <option value="draft">
                                            Draft
                                        </option>

                                        <option value="completed">
                                            Completed
                                        </option>
                                    </select>

                                    <button
                                        onClick={() =>
                                            setShowForm(true)
                                        }
                                        className="flex h-10 items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <Plus className="w-5 h-5" />

                                        New Receipt
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="bg-white rounded-lg shadow overflow-x-auto">
                                <table className="w-full">

                                    <thead>
                                        <tr className="bg-gray-100 border-b-2 border-gray-300">

                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Receipt #
                                            </th>

                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Date
                                            </th>

                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Received From
                                            </th>

                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Bank
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
                                        {filteredReceipts.map(
                                            (receipt) => (
                                                <tr
                                                    key={receipt.id}
                                                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                                                >
                                                    <td className="px-6 py-4 text-sm font-medium text-blue-600">
                                                        {
                                                            receipt.receiptNumber
                                                        }
                                                    </td>

                                                    <td className="px-6 py-4 text-sm text-gray-700">
                                                        {new Date(
                                                            receipt.date
                                                        ).toLocaleDateString()}
                                                    </td>

                                                    <td className="px-6 py-4 text-sm text-gray-700">
                                                        {
                                                            receipt.customer
                                                        }
                                                    </td>

                                                    <td className="px-6 py-4 text-sm text-gray-700">
                                                        {
                                                            receipt.bank
                                                        }
                                                    </td>

                                                    <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                        $
                                                        {receipt.amount.toLocaleString(
                                                            'en-US',
                                                            {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            }
                                                        )}
                                                    </td>

                                                    <td className="px-6 py-4 text-center">
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${receipt.status ===
                                                                    'completed'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-yellow-100 text-yellow-800'
                                                                }`}
                                                        >
                                                            {
                                                                receipt.status
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex justify-center gap-2">

                                                            <button
                                                                onClick={() =>
                                                                    handleEdit(
                                                                        receipt
                                                                    )
                                                                }
                                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>

                                                            <button
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        receipt.id
                                                                    )
                                                                }
                                                                className="p-2 text-red-600 hover:bg-red-100 rounded"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Form Modal */}
                            {showForm && (
                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

                                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full mx-4">

                                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                            {editingId
                                                ? 'Edit Receipt'
                                                : 'New Receipt'}
                                        </h2>

                                        <form
                                            onSubmit={
                                                handleSubmit
                                            }
                                        >
                                            {formError && (
                                                <p
                                                    role="alert"
                                                    className="mb-4 text-red-600"
                                                >
                                                    {
                                                        formError
                                                    }
                                                </p>
                                            )}

                                            <div className="grid grid-cols-2 gap-4 mb-4">

                                                {/* Date */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Date
                                                    </label>

                                                    <input
                                                        type="date"
                                                        value={
                                                            formData.date
                                                        }
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                date:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>

                                                {/* Receipt Number */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Receipt Number
                                                    </label>

                                                    <input
                                                        type="text"
                                                        value={
                                                            formData.receiptNumber
                                                        }
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                receiptNumber:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>

                                                {/* Received From */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Received From
                                                    </label>

                                                    <input
                                                        type="text"
                                                        value={
                                                            formData.customer
                                                        }
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                customer:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>

                                                {/* Bank */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Bank
                                                    </label>

                                                    <input
                                                        type="text"
                                                        value={
                                                            formData.bank
                                                        }
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                bank:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>

                                                {/* Amount */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Amount
                                                    </label>

                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={
                                                            formData.amount
                                                        }
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                amount:
                                                                    parseFloat(
                                                                        e.target
                                                                            .value
                                                                    ),
                                                            })
                                                        }
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>

                                                {/* Payment Mode */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Payment Mode
                                                    </label>

                                                    <select
                                                        value={
                                                            formData.paymentMode
                                                        }
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                paymentMode:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    >
                                                        <option value="bank_transfer">
                                                            Bank Transfer
                                                        </option>

                                                        <option value="cheque">
                                                            Cheque
                                                        </option>

                                                        <option value="cash">
                                                            Cash
                                                        </option>

                                                        <option value="card">
                                                            Card
                                                        </option>
                                                    </select>
                                                </div>

                                                {/* Reference */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Reference
                                                    </label>

                                                    <input
                                                        type="text"
                                                        value={
                                                            formData.reference
                                                        }
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                reference:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>

                                                {/* Status */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Status
                                                    </label>

                                                    <select
                                                        value={
                                                            formData.status
                                                        }
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                status:
                                                                    e.target
                                                                        .value,
                                                            })
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    >
                                                        <option value="completed">
                                                            Completed
                                                        </option>

                                                        <option value="draft">
                                                            Draft
                                                        </option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Description
                                                </label>

                                                <textarea
                                                    value={
                                                        formData.description
                                                    }
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            description:
                                                                e.target
                                                                    .value,
                                                        })
                                                    }
                                                    rows="3"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                ></textarea>
                                            </div>

                                            {/* Buttons */}
                                            <div className="flex gap-3 mt-6">

                                                <button
                                                    type="submit"
                                                    disabled={
                                                        saving
                                                    }
                                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                >
                                                    {editingId
                                                        ? 'Update'
                                                        : 'Create'}{' '}
                                                    Receipt
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={
                                                        resetForm
                                                    }
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