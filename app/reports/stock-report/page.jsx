'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

import { Download, Printer } from 'lucide-react';
import { fetchStockReport } from '@/services/reports';

export default function StockReportPage() {
    const { user, loading } = useAuth();
    const [filterWarehouse, setFilterWarehouse] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const [reportData, setReportData] = useState(null);

    useEffect(() => {
        if (loading) return;
        if (user) {
            loadReport();
        } else {
            setIsLoading(false);
        }
    }, [user, loading, filterWarehouse, filterCategory]);

    const loadReport = async () => {
        try {
            setIsLoading(true);
            const response = await fetchStockReport();
            const allProducts = response.data?.products || [];

            let filtered = allProducts;
            if (filterWarehouse !== 'all') {
                filtered = filtered.filter((p) => p.warehouse === filterWarehouse);
            }
            if (filterCategory !== 'all') {
                filtered = filtered.filter((p) => p.category === filterCategory);
            }

            const totalQuantity = filtered.reduce((sum, p) => sum + (p.quantity || 0), 0);
            const totalValue = filtered.reduce((sum, p) => sum + (p.totalValue || 0), 0);

            setReportData({
                products: filtered,
                totalQuantity,
                totalValue,
                allWarehouses: response.data?.allWarehouses || [],
                allCategories: response.data?.allCategories || [],
            });
        } catch (error) {
            console.error('Error loading report:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExport = () => {
        alert('Export functionality coming soon');
    };

    if (loading || isLoading) {
        return <div className="p-8">Loading...</div>;
    }

    if (!reportData) {
        return <div className="p-8">No data available</div>;
    }

    const getLowStockCount = () => {
        return reportData.products.filter((p) => p.status === 'Low' || p.status === 'Critical')
            .length;
    };

    return (
        <div>
            <div className="flex-1 flex flex-col bg-gray-50">
                <div className="flex flex-1">
                    <main className="flex-1 overflow-auto">
                        <div className="p-8">
                            {/* Filters */}
                            <div className="bg-white rounded-lg shadow p-6 mb-6">
                                <div className="flex flex-wrap items-end justify-end gap-4">
                                    <div className="w-full sm:w-56">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Warehouse
                                        </label>
                                        <select
                                            value={filterWarehouse}
                                            onChange={(e) => setFilterWarehouse(e.target.value)}
                                            className="h-11 px-3 py-2 border border-gray-300 rounded-lg w-full"
                                        >
                                            <option value="all">All Warehouses</option>
                                            {reportData.allWarehouses.map((w) => (
                                                <option key={w} value={w}>
                                                    {w}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-full sm:w-56">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Category
                                        </label>
                                        <select
                                            value={filterCategory}
                                            onChange={(e) => setFilterCategory(e.target.value)}
                                            className="h-11 px-3 py-2 border border-gray-300 rounded-lg w-full"
                                        >
                                            <option value="all">All Categories</option>
                                            {reportData.allCategories.map((c) => (
                                                <option key={c} value={c}>
                                                    {c}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        onClick={handlePrint}
                                        className="flex h-11 items-center gap-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        <Printer className="w-4 h-4" />
                                        Print
                                    </button>
                                    <button
                                        onClick={handleExport}
                                        className="flex h-11 items-center gap-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        <Download className="w-4 h-4" />
                                        Export
                                    </button>
                                </div>
                            </div>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Total Items</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {reportData.products.length}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Total Quantity</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {reportData.totalQuantity.toLocaleString()}
                                    </p>
                                </div>
                                <div className="bg-white rounded-lg shadow p-6">
                                    <p className="text-gray-600 text-sm font-medium mb-1">Total Value</p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        ${reportData.totalValue.toLocaleString('en-US', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2,
                                        })}
                                    </p>
                                </div>
                                <div
                                    className={`rounded-lg shadow p-6 ${getLowStockCount() > 0
                                        ? 'bg-red-50 border border-red-200'
                                        : 'bg-white'
                                        }`}
                                >
                                    <p className="text-gray-600 text-sm font-medium mb-1">
                                        Low Stock Items
                                    </p>
                                    <p
                                        className={`text-2xl font-bold ${getLowStockCount() > 0 ? 'text-red-600' : 'text-gray-900'
                                            }`}
                                    >
                                        {getLowStockCount()}
                                    </p>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="bg-white rounded-lg shadow overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-100 border-b-2 border-gray-300">
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Product Name
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Category
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                                Warehouse
                                            </th>
                                            <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                Quantity
                                            </th>
                                            <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                Unit Cost
                                            </th>
                                            <th className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                                                Total Value
                                            </th>
                                            <th className="px-6 py-4 text-center text-sm font-bold text-gray-900">
                                                Status
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.products.map((product, index) => (
                                            <tr
                                                key={index}
                                                className="border-b border-gray-200 hover:bg-gray-50 transition"
                                            >
                                                <td className="px-6 py-4 text-sm text-gray-700">{product.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-700">{product.category}</td>
                                                <td className="px-6 py-4 text-sm text-gray-700">
                                                    {product.warehouse}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-gray-700">
                                                    {product.quantity.toLocaleString()} {product.unit}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-gray-700">
                                                    $
                                                    {product.unitCost.toLocaleString('en-US', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 text-right text-sm text-gray-700">
                                                    $
                                                    {product.totalValue.toLocaleString('en-US', {
                                                        minimumFractionDigits: 2,
                                                        maximumFractionDigits: 2,
                                                    })}
                                                </td>
                                                <td className="px-6 py-4 text-center text-sm">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${product.status === 'Good'
                                                            ? 'bg-green-100 text-green-800'
                                                            : product.status === 'Low'
                                                                ? 'bg-yellow-100 text-yellow-800'
                                                                : 'bg-red-100 text-red-800'
                                                            }`}
                                                    >
                                                        {product.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                        {/* Total Row */}
                                        <tr className="bg-gray-100 border-t-2 border-gray-300 font-bold">
                                            <td colSpan="3" className="px-6 py-4 text-sm text-gray-900">
                                                TOTAL
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-900">
                                                {reportData.totalQuantity.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-900">-</td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-900">
                                                $
                                                {reportData.totalValue.toLocaleString('en-US', {
                                                    minimumFractionDigits: 2,
                                                    maximumFractionDigits: 2,
                                                })}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer */}
                            <div className="text-center text-sm text-gray-600 mt-8">
                                <p>Generated on {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}



