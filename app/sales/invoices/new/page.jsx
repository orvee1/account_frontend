'use client';

import EnhancedSalesInvoiceForm from '@/components/sales/EnhancedSalesInvoiceForm';
import Link from 'next/link';

export default function NewInvoicePage() {
    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Create Advanced Invoice</h1>
                    <p className="text-gray-600 mt-1">Fill in the details to generate a new sales invoice with multi-UOM and discount support.</p>
                </div>
                <Link href="/sales/invoices" className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50 transition-colors">
                    ← Back to Invoices
                </Link>
            </div>

            <EnhancedSalesInvoiceForm />
        </div>
    );
}
