'use client';

import { toDateInput } from '@/utils/accounting-date.mjs';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import {
    Edit2,
    Trash2,
    Plus,
} from 'lucide-react';

import {
    createPayment,
    deletePayment,
    fetchPayments,
    updatePayment,
} from '@/services/transactions';

export default function PaymentsPage() {
    const { user, loading } = useAuth();

    const [payments, setPayments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const [showForm, setShowForm] = useState(false);
    const [formError, setFormError] = useState('');
    const [saving, setSaving] = useState(false);

    const [editingId, setEditingId] = useState(null);

    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        date: toDateInput(),
        paymentNumber: '',
        vendor: '',
        bank: '',
        amount: '',
        paymentMode: 'bank_transfer',
        reference: '',
        description: '',
        status: 'completed',
    });

    /*
    |--------------------------------------------------------------------------
    | Payment Mode Normalization
    |--------------------------------------------------------------------------
    |
    | Frontend:
    | bank_transfer
    | card
    | cash
    | cheque
    |
    | Backend canonical values:
    | bank
    | online
    | cash
    | cheque
    |
    */

    const toApiPaymentMode = (mode) => {
        if (mode === 'bank_transfer') {
            return 'bank';
        }

        if (mode === 'card') {
            return 'online';
        }

        return mode;
    };

    const fromApiPaymentMode = (mode) => {
        if (mode === 'bank') {
            return 'bank_transfer';
        }

        if (mode === 'online') {
            return 'card';
        }

        return mode;
    };

    /*
    |--------------------------------------------------------------------------
    | Initial Load
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        if (loading) {
            return;
        }

        if (user) {
            loadPayments();
        } else {
            setIsLoading(false);
        }
    }, [user, loading]);

    /*
    |--------------------------------------------------------------------------
    | Load Payments
    |--------------------------------------------------------------------------
    */

    const loadPayments = async () => {
        try {
            setIsLoading(true);

            const response = await fetchPayments();

            const data =
                response.data?.data ||
                response.data ||
                [];

            const mapped = data.map((payment) => ({
                id: payment.id,

                date: toDateInput(
                    payment.payment_date || ''
                ),

                paymentNumber:
                    payment.payment_number || '',

                vendor:
                    payment.vendor?.name ||
                    payment.vendor_name ||
                    '',

                bank:
                    payment.cheque_number || '',

                amount: Number(
                    payment.amount_paid || 0
                ),

                /*
                 * Convert backend values back into the values
                 * used by the frontend select control.
                 */
                paymentMode:
                    fromApiPaymentMode(
                        payment.payment_mode
                    ),

                reference:
                    payment.invoice_reference || '',

                description:
                    payment.description || '',

                status:
                    payment.status || 'completed',
            }));

            setPayments(mapped);
        } catch (error) {
            console.error(
                'Error loading payments:',
                error
            );
        } finally {
            setIsLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Create / Update Payment
    |--------------------------------------------------------------------------
    */

    const handleSubmit = async (e) => {
        e.preventDefault();

        setFormError('');

        /*
         * Convert frontend payment-mode naming to
         * backend canonical naming before submission.
         */
        const payload = {
            vendor_name:
                formData.vendor,

            payment_date:
                formData.date,

            amount_paid:
                formData.amount,

            payment_mode:
                toApiPaymentMode(
                    formData.paymentMode
                ),

            invoice_reference:
                formData.reference,

            cheque_number:
                formData.bank,

            description:
                formData.description,

            status:
                formData.status,

            payment_number:
                formData.paymentNumber ||
                undefined,
        };

        setSaving(true);

        try {
            const response = editingId
                ? await updatePayment(
                    editingId,
                    payload
                )
                : await createPayment(
                    payload
                );

            if (!response.ok) {
                setFormError(
                    response.data?.message ||
                    'Unable to save payment. Please check the details.'
                );

                return;
            }

            await loadPayments();

            resetForm();
        } catch (error) {
            console.error(
                'Error saving payment:',
                error
            );

            setFormError(
                error.response?.data?.message ||
                'Unable to save payment. Please try again.'
            );
        } finally {
            setSaving(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Reset Form
    |--------------------------------------------------------------------------
    |
    | Completed is intentionally the default.
    |
    | Accounting test-plan payments are actual posted transactions,
    | therefore the normal new-payment workflow should immediately
    | create the accounting effect unless the user explicitly changes
    | the transaction to Draft.
    |
    */

    const resetForm = () => {
        setFormError('');

        setFormData({
            date: toDateInput(),
            paymentNumber: '',
            vendor: '',
            bank: '',
            amount: '',
            paymentMode: 'bank_transfer',
            reference: '',
            description: '',
            status: 'completed',
        });

        setShowForm(false);
        setEditingId(null);
    };

    /*
    |--------------------------------------------------------------------------
    | Edit Payment
    |--------------------------------------------------------------------------
    */

    const handleEdit = (payment) => {
        /*
         * Existing payment status is preserved.
         *
         * Example:
         * An existing Draft payment remains Draft while editing.
         */
        setFormData({
            ...payment,
        });

        setEditingId(
            payment.id
        );

        setShowForm(true);
    };

    /*
    |--------------------------------------------------------------------------
    | Delete Payment
    |--------------------------------------------------------------------------
    */

    const handleDelete = (id) => {
        if (
            confirm(
                'Are you sure you want to delete this payment?'
            )
        ) {
            deletePayment(id)
                .then(() => {
                    loadPayments();
                })
                .catch((error) => {
                    console.error(
                        'Error deleting payment:',
                        error
                    );
                });
        }
    };

    /*
    |--------------------------------------------------------------------------
    | Filtered Payments
    |--------------------------------------------------------------------------
    */

    const filteredPayments = payments
        .filter((payment) => {
            if (filter === 'all') {
                return true;
            }

            return payment.status === filter;
        })
        .filter((payment) => {
            const search =
                searchTerm.toLowerCase();

            return (
                String(
                    payment.paymentNumber || ''
                )
                    .toLowerCase()
                    .includes(search) ||

                String(
                    payment.vendor || ''
                )
                    .toLowerCase()
                    .includes(search) ||

                String(
                    payment.description || ''
                )
                    .toLowerCase()
                    .includes(search)
            );
        });

    /*
    |--------------------------------------------------------------------------
    | Loading State
    |--------------------------------------------------------------------------
    */

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

    /*
    |--------------------------------------------------------------------------
    | Render
    |--------------------------------------------------------------------------
    */

    return (
        <div>
            <div className="flex-1 flex flex-col bg-gray-50">
                <div className="flex flex-1">

                    <main className="flex-1 overflow-auto">

                        <div className="p-4 md:p-6">

                            {/* =================================================
                                Header
                            ================================================= */}

                            <div className="mb-6">
                                <div>
                                    <p className="text-gray-600 mt-1">
                                        Manage money paid transactions
                                    </p>
                                </div>
                            </div>

                            {/* =================================================
                                Summary
                            ================================================= */}

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">

                                {/* Total Payments */}

                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">
                                        Total Payments
                                    </p>

                                    <p className="text-2xl font-bold text-gray-900">
                                        {payments.length}
                                    </p>
                                </div>

                                {/* Total Amount */}

                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">
                                        Total Amount
                                    </p>

                                    <p className="text-2xl font-bold text-red-600">
                                        $
                                        {payments
                                            .reduce(
                                                (
                                                    sum,
                                                    payment
                                                ) =>
                                                    sum +
                                                    Number(
                                                        payment.amount ||
                                                        0
                                                    ),
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

                                {/* Completed */}

                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">
                                        Completed
                                    </p>

                                    <p className="text-2xl font-bold text-green-600">
                                        {
                                            payments.filter(
                                                (payment) =>
                                                    payment.status ===
                                                    'completed'
                                            ).length
                                        }
                                    </p>
                                </div>

                                {/* Draft */}

                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">
                                        Draft
                                    </p>

                                    <p className="text-2xl font-bold text-yellow-600">
                                        {
                                            payments.filter(
                                                (payment) =>
                                                    payment.status ===
                                                    'draft'
                                            ).length
                                        }
                                    </p>
                                </div>
                            </div>

                            {/* =================================================
                                Search / Filter / Create
                            ================================================= */}

                            <div className="flex justify-end mb-6">

                                <div className="flex w-full flex-wrap items-center justify-end gap-2">

                                    {/* Search */}

                                    <div className="mr-auto w-full sm:w-64 md:w-80">
                                        <input
                                            type="text"
                                            placeholder="Search by payment number, vendor, or description..."
                                            value={
                                                searchTerm
                                            }
                                            onChange={(e) =>
                                                setSearchTerm(
                                                    e.target.value
                                                )
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>

                                    {/* Status filter */}

                                    <select
                                        value={
                                            filter
                                        }
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

                                        <option value="completed">
                                            Completed
                                        </option>

                                        <option value="draft">
                                            Draft
                                        </option>
                                    </select>

                                    {/* New Payment */}

                                    <button
                                        onClick={() => {
                                            /*
                                             * Always initialise a new payment
                                             * as a completed accounting
                                             * transaction.
                                             */
                                            setFormData({
                                                date: toDateInput(),
                                                paymentNumber: '',
                                                vendor: '',
                                                bank: '',
                                                amount: '',
                                                paymentMode:
                                                    'bank_transfer',
                                                reference: '',
                                                description: '',
                                                status:
                                                    'completed',
                                            });

                                            setEditingId(
                                                null
                                            );

                                            setFormError(
                                                ''
                                            );

                                            setShowForm(
                                                true
                                            );
                                        }}
                                        className="flex h-10 items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <Plus className="w-5 h-5" />

                                        New Payment
                                    </button>
                                </div>
                            </div>

                            {/* =================================================
                                Payments Table
                            ================================================= */}

                            <div className="bg-white rounded-lg shadow overflow-x-auto">

                                <table className="w-full">

                                    <thead>
                                        <tr className="bg-gray-100 border-b-2 border-gray-300">

                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Payment #
                                            </th>

                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Date
                                            </th>

                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Vendor
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

                                        {filteredPayments.map(
                                            (payment) => (

                                                <tr
                                                    key={
                                                        payment.id
                                                    }
                                                    className="border-b border-gray-200 hover:bg-gray-50 transition"
                                                >

                                                    {/* Payment Number */}

                                                    <td className="px-6 py-4 text-sm font-medium text-blue-600">
                                                        {
                                                            payment.paymentNumber
                                                        }
                                                    </td>

                                                    {/* Date */}

                                                    <td className="px-6 py-4 text-sm text-gray-700">
                                                        {payment.date
                                                            ? new Date(
                                                                `${payment.date}T00:00:00`
                                                            ).toLocaleDateString()
                                                            : ''}
                                                    </td>

                                                    {/* Vendor */}

                                                    <td className="px-6 py-4 text-sm text-gray-700">
                                                        {
                                                            payment.vendor
                                                        }
                                                    </td>

                                                    {/* Bank / Cheque */}

                                                    <td className="px-6 py-4 text-sm text-gray-700">
                                                        {
                                                            payment.bank
                                                        }
                                                    </td>

                                                    {/* Amount */}

                                                    <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                        $
                                                        {Number(
                                                            payment.amount ||
                                                            0
                                                        ).toLocaleString(
                                                            'en-US',
                                                            {
                                                                minimumFractionDigits: 2,
                                                                maximumFractionDigits: 2,
                                                            }
                                                        )}
                                                    </td>

                                                    {/* Status */}

                                                    <td className="px-6 py-4 text-center">
                                                        <span
                                                            className={`px-3 py-1 rounded-full text-xs font-semibold ${payment.status ===
                                                                    'completed'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : 'bg-yellow-100 text-yellow-800'
                                                                }`}
                                                        >
                                                            {
                                                                payment.status
                                                            }
                                                        </span>
                                                    </td>

                                                    {/* Actions */}

                                                    <td className="px-6 py-4 text-center">

                                                        <div className="flex justify-center gap-2">

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleEdit(
                                                                        payment
                                                                    )
                                                                }
                                                                className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                                                            >
                                                                <Edit2 className="w-4 h-4" />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleDelete(
                                                                        payment.id
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

                                        {filteredPayments.length ===
                                            0 && (
                                                <tr>
                                                    <td
                                                        colSpan={7}
                                                        className="px-6 py-10 text-center text-gray-500"
                                                    >
                                                        No payments found.
                                                    </td>
                                                </tr>
                                            )}
                                    </tbody>
                                </table>
                            </div>

                            {/* =================================================
                                Payment Modal
                            ================================================= */}

                            {showForm && (

                                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

                                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">

                                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                            {editingId
                                                ? 'Edit Payment'
                                                : 'New Payment'}
                                        </h2>

                                        <form
                                            onSubmit={
                                                handleSubmit
                                            }
                                        >

                                            {/* Error */}

                                            {formError && (
                                                <p
                                                    role="alert"
                                                    className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600"
                                                >
                                                    {
                                                        formError
                                                    }
                                                </p>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

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
                                                                    e.target.value,
                                                            })
                                                        }
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>

                                                {/* Payment Number */}

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Payment Number
                                                    </label>

                                                    <input
                                                        type="text"
                                                        value={
                                                            formData.paymentNumber
                                                        }
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,

                                                                paymentNumber:
                                                                    e.target.value,
                                                            })
                                                        }
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>

                                                {/* Vendor */}

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Vendor
                                                    </label>

                                                    <input
                                                        type="text"
                                                        value={
                                                            formData.vendor
                                                        }
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,

                                                                vendor:
                                                                    e.target.value,
                                                            })
                                                        }
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    />
                                                </div>

                                                {/* Bank / Cheque Reference */}

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Bank / Cheque Reference
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
                                                                    e.target.value,
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
                                                        min="0.01"
                                                        step="0.01"
                                                        value={
                                                            formData.amount
                                                        }
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,

                                                                amount:
                                                                    e.target.value,
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
                                                                    e.target.value,
                                                            })
                                                        }
                                                        required
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
                                                            Card / Online
                                                        </option>
                                                    </select>

                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Bank Transfer is posted
                                                        to the configured bank
                                                        ledger. Cash is posted
                                                        to the cash ledger.
                                                    </p>
                                                </div>

                                                {/* Reference */}

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Invoice / Reference
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
                                                                    e.target.value,
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
                                                                    e.target.value,
                                                            })
                                                        }
                                                        required
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                    >
                                                        <option value="completed">
                                                            Completed
                                                        </option>

                                                        <option value="draft">
                                                            Draft
                                                        </option>
                                                    </select>

                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Completed payments
                                                        create the accounting
                                                        posting. Draft
                                                        payments remain
                                                        unposted.
                                                    </p>
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
                                                                e.target.value,
                                                        })
                                                    }
                                                    rows="3"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                            </div>

                                            {/* =================================================
                                                Action Buttons
                                            ================================================= */}

                                            <div className="flex gap-3 mt-6">

                                                <button
                                                    type="submit"
                                                    disabled={
                                                        saving
                                                    }
                                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {saving
                                                        ? 'Saving...'
                                                        : `${editingId
                                                            ? 'Update'
                                                            : 'Create'
                                                        } Payment`}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={
                                                        resetForm
                                                    }
                                                    disabled={
                                                        saving
                                                    }
                                                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 disabled:opacity-60"
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