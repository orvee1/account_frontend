'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { getSalesInvoices } from '@/services/sales';
import { fetchPurchaseBillsClient } from '@/services/purchase';
import { getChartAccountsClient } from '@/services/chartAccounts';
import { fetchCustomersClient } from '@/services/customer';
import { fetchProductsClient } from '@/services/product';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, AlertCircle } from 'lucide-react';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [data, setData] = useState({
    salesTotal: 0,
    purchaseTotal: 0,
    revenueTotal: 0,
    expenseTotal: 0,
    profitLoss: 0,
    salesInvoices: [],
    customerData: [],
    productData: [],
    revenueExpenseData: [],
    expensesBreakdown: [],
    currentBalances: [],
    dormantCustomers: [],
    dormantProducts: [],
    recentTransactions: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    if (!dataLoaded) {
      loadDashboardData();
      setDataLoaded(true);
    }
  }, [dataLoaded]);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      console.log('Starting dashboard data load...');
      console.log('User info:', user);

      // Use mock data for now to test UI
      const mockData = {
        salesTotal: 50000,
        purchaseTotal: 30000,
        revenueTotal: 50000,
        expenseTotal: 30000,
        profitLoss: 20000,
        salesInvoices: [],
        customerData: [
          { name: 'Week 1', sales: 5000, Revenue: 5000, Expense: 3000 },
          { name: 'Week 2', sales: 8000, Revenue: 8000, Expense: 5000 },
          { name: 'Week 3', sales: 12000, Revenue: 12000, Expense: 7000 },
          { name: 'Week 4', sales: 25000, Revenue: 25000, Expense: 15000 },
        ],
        productData: [],
        revenueExpenseData: [
          { name: 'Week 1', Revenue: 5000, Expense: 3000 },
          { name: 'Week 2', Revenue: 8000, Expense: 5000 },
          { name: 'Week 3', Revenue: 12000, Expense: 7000 },
          { name: 'Week 4', Revenue: 25000, Expense: 15000 },
        ],
        expensesBreakdown: [
          { name: 'Utilities', value: 5000 },
          { name: 'Salaries', value: 15000 },
          { name: 'Supplies', value: 5000 },
          { name: 'Other', value: 5000 },
        ],
        currentBalances: [
          { label: 'Cash', value: 15000, change: 5 },
          { label: 'Bank A/C', value: 25000, change: -2 },
          { label: 'Inventory', value: 35000, change: 3 },
          { label: 'Receivables', value: 20000, change: 8 },
          { label: 'Payables', value: 10000, change: -5 },
          { label: 'Equity', value: 75000, change: 2 },
        ],
        dormantCustomers: [],
        dormantProducts: [],
        recentTransactions: [
          { id: 1, date: '2025-12-20', description: 'Invoice #001', amount: 5000, type: 'invoice' },
          { id: 2, date: '2025-12-19', description: 'Invoice #002', amount: 8000, type: 'invoice' },
          { id: 3, date: '2025-12-18', description: 'Invoice #003', amount: 12000, type: 'invoice' },
        ],
      };

      setData(mockData);
      console.log('Mock data loaded successfully');

      // Now try to load real data in the background (non-blocking)
      loadRealDataAsync();

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setIsLoading(false);
    }
  };

  const loadRealDataAsync = async () => {
    try {
      console.log('Loading real data in background...');

      // Load invoices
      try {
        console.log('Loading real invoices...');
        const invoicesRes = await getSalesInvoices({
          per_page: 100,
          date_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split('T')[0],
        });
        console.log('Real invoices:', invoicesRes);
      } catch (e) {
        console.error('Error loading invoices:', e.message);
      }

      // Load purchases
      try {
        console.log('Loading real purchases...');
        const purchasesRes = await fetchPurchaseBillsClient({
          per_page: 100,
        });
        console.log('Real purchases:', purchasesRes);
      } catch (e) {
        console.error('Error loading purchases:', e.message);
      }

      // Load accounts
      try {
        console.log('Loading real accounts...');
        const accountsRes = await getChartAccountsClient(user?.company_id || 1, { per_page: 100 });
        console.log('Real accounts:', accountsRes);
      } catch (e) {
        console.error('Error loading accounts:', e.message);
      }

      // Load customers
      try {
        console.log('Loading real customers...');
        const customersRes = await fetchCustomersClient({ per_page: 100 });
        console.log('Real customers:', customersRes);
      } catch (e) {
        console.error('Error loading customers:', e.message);
      }

      // Load products
      try {
        console.log('Loading real products...');
        const productsRes = await fetchProductsClient({ per_page: 100 });
        console.log('Real products:', productsRes);
      } catch (e) {
        console.error('Error loading products:', e.message);
      }

      console.log('Finished loading real data');
    } catch (error) {
      console.error('Error in loadRealDataAsync:', error);
    }
  };

  if (!dataLoaded) {
    return <div className="p-8 text-center">Initializing dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Summary context */}
      <div>
        <p className="text-gray-600 mt-2">Financial Summary (Last 30 Days)</p>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <SummaryCard
          title="Sales"
          value={data.salesTotal}
          icon={<ShoppingCart className="w-5 h-5" />}
          color="blue"
        />
        <SummaryCard
          title="Purchase"
          value={data.purchaseTotal}
          icon={<Package className="w-5 h-5" />}
          color="purple"
        />
        <SummaryCard
          title="Revenue"
          value={data.revenueTotal}
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        <SummaryCard
          title="Expenses"
          value={data.expenseTotal}
          icon={<TrendingDown className="w-5 h-5" />}
          color="red"
        />
        <SummaryCard
          title="Profit/Loss"
          value={data.profitLoss}
          icon={<DollarSign className="w-5 h-5" />}
          color={data.profitLoss >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Overview */}
        <ChartCard title="Sales Overview" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.customerData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="sales"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Profit / Loss Overview */}
        <ChartCard title="Profit / Loss Overview" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.revenueExpenseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="Revenue"
                stroke="#10b981"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="Expense"
                stroke="#ef4444"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Revenue vs Expense */}
        <ChartCard title="Revenue vs Expense" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.revenueExpenseData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Revenue" fill="#3b82f6" />
              <Bar dataKey="Expense" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Major Expenses */}
        <ChartCard title="Major Expenses" height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.expensesBreakdown}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) =>
                  `${name}: $${value.toLocaleString()}`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.expensesBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Balances */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Current Balances
            </h2>
            <div className="space-y-3">
              {data.currentBalances.map((balance, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                >
                  <span className="text-sm font-medium text-gray-700">
                    {balance.label}
                  </span>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {balance.value.toLocaleString('en-US', {
                        style: 'currency',
                        currency: 'USD',
                      })}
                    </p>
                    <p
                      className={`text-xs ${balance.change >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                        }`}
                    >
                      {balance.change >= 0 ? '↑' : '↓'} {Math.abs(balance.change)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Recent Transactions
          </h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {data.recentTransactions?.slice(0, 8).map((txn) => (
              <div
                key={txn.id}
                className="flex justify-between items-start p-3 border-b border-gray-100"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {txn.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{txn.date}</p>
                </div>
                <p className="text-sm font-bold text-blue-600">
                  {txn.amount.toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  })}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dormant Items Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dormant Customers */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">
              Dormant Customers
            </h2>
          </div>
          <div className="space-y-3">
            {data.dormantCustomers.map((customer, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {customer.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {customer.lastInvoice}
                  </p>
                </div>
                <p className="text-sm font-bold text-yellow-700">
                  {customer.days} days
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Dormant Products */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-4">
            <AlertCircle className="w-5 h-5 text-orange-500 mr-2" />
            <h2 className="text-xl font-bold text-gray-900">
              Dormant Products
            </h2>
          </div>
          <div className="space-y-3">
            {data.dormantProducts.map((product, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center p-3 bg-orange-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Stock: {product.stock}
                  </p>
                </div>
                <p className="text-sm font-bold text-orange-700">
                  {product.days} days
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    red: 'text-red-600',
  };

  return (
    <div
      className={`${colorClasses[color]} border rounded-lg p-6 shadow-sm hover:shadow-md transition`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {value.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
            })}
          </p>
        </div>
        <div className={`p-3 rounded-full bg-white ${iconColorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, children, height = 300 }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-lg font-bold text-gray-900 mb-4">{title}</h2>
      <div style={{ height }}>{children}</div>
    </div>
  );
}
