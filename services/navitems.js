import { BarChart3, Briefcase, Building, Factory, FileText, LayoutDashboard, PieChart, ShoppingBag, ShoppingCart, Users, Users2 } from "lucide-react";

export const navItems = [
  {
    name: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
    permission: "view_dashboard",
  },
  {
    name: "Chart of Accounts",
    path: "/chart-of-accounts",
    icon: BarChart3,
    permission: "view_chart_of_accounts",
  },
  {
    name: "Products & Service",
    path: "/product-services",
    icon: ShoppingCart,
    permission: "view_products",
    subItems: [
      {
        name: "Product List",
        path: "/products",
        permission: "view_products",
      },
      {
        name: "Warehouse",
        path: "/products/warehouses",
        permission: "view_sales_return",
      },
      {
        name: "Category",
        path: "/products/categories",
        permission: "view_sales_order",
      },
      {
        name: "Brand",
        path: "/products/brands",
        permission: "view_sales_order",
      },
    ],
  },
  {
    name: "Vendors",
    path: "/vendors",
    icon: Building,
    permission: "view_vendors",
  },
  {
    
    name: "Customer Center",
    path: "/customers",
    icon: Users,
    permission: "view_customers",
  },

  {
    name: "Fixed Asset Management",
    path: "/fixed-asset-management",
    icon: Building,
    permission: "view_vendors",

  },
  {
    name: "Sales",
    path: "/sales",
    icon: FileText,
    permission: "view_sales",
    subItems: [
      {
        name: "Sales Invoices",
        path: "/sales/invoices",
        permission: "view_sales_invoice",
      },
      {
        name: "Sales Orders",
        path: "/sales/orders",
        permission: "view_sales_order",
      },
      {
        name: "Sales Returns",
        path: "/sales/returns",
        permission: "view_sales_return",
      },
    ],
  },
  {
    name: "Purchases",
    path: "/purchases",
    icon: ShoppingBag,
    permission: "view_purchase",
    subItems: [
      {
        name: "Purchase Bills",
        path: "/purchases",
        permission: "view_purchase_bill",
      },
      {
        name: "New Purchase Bill",
        path: "/purchases/new",
        permission: "view_purchase_bill",
      },
      {
        name: "Purchase Returns",
        path: "/purchases/returns",
        permission: "view_purchase_return",
      },
    ],
  },
  {
    name: "Transactions",
    path: "/transactions",
    icon: Briefcase,
    permission: "view_transactions",
    subItems: [
      {
        name: "Receipt",
        path: "/transactions/receipts",
        permission: "view_receipt",
      },
      {
        name: "Payment",
        path: "/transactions/payments",
        permission: "view_payment",
      },
      {
        name: "Contra",
        path: "/transactions/contra",
        permission: "view_contra",
      },
      {
        name: "Debit Note",
        path: "/transactions/debit-note",
        permission: "view_debit_note",
      },
      {
        name: "Credit Note",
        path: "/transactions/credit-note",
        permission: "view_credit_note",
      },
      {
        name: "Manual Journal",
        path: "/transactions/manual-journal",
        permission: "view_manual_journal",
      },
      {
        name: "Recurring & Adjustments",
        path: "/transactions/recurring-adjustments",
        permission: "view_recurring_adjustments",
      },
      {
        name: "Transaction Transfer",
        path: "/transactions/transaction-transfer",
        permission: "view_txn_transfer",
      },
    ],
  },
  {
    name: "Reports",
    path: "/reports",
    icon: PieChart,
    permission: "view_reports",
    subItems: [
      {
        name: "Income Statement",
        path: "/reports/income-statement",
        permission: "view_income_statement",
      },
      {
        name: "Balance Sheet",
        path: "/reports/balance-sheet",
        permission: "view_balance_sheet",
      },
      {
        name: "Trial Balance",
        path: "/reports/trial-balance",
        permission: "view_trial_balance",
      },
      {
        name: "Owners Equity",
        path: "/reports/owner-equity",
        permission: "view_owners_equity",
      },
      {
        name: "Stock Report",
        path: "/reports/stock-report",
        permission: "view_stock_report",
      },
      {
        name: "Cash Flow Statement",
        path: "/reports/cash-flow",
        permission: "view_cash_flow",
      },
      {
        name: "Vendor Ledger",
        path: "/reports/vendor-ledger",
        permission: "view_vendor_ledger",
      },
    ],
  },
  {
    name: "Payroll Management",
    path: "/employee",
    icon: Users2,
    permission: "view_employee",
    subItems: [
      {
        name: "Employee Database",
        path: "/employee/database",
        permission: "view_employee_database",
      },
      {
        name: "Salary Setup",
        path: "/employee/salary-setup",
        permission: "view_salary_setup",
      },
      {
        name: "Payroll Run",
        path: "/employee/payroll-run",
        permission: "view_payroll_run",
      },
      {
        name: "Salary Report",
        path: "/employee/payroll-report",
        permission: "view_salary_report",
      },
      {
        name: "Payslip",
        path: "/employee/payslip",
        permission: "view_payslip",
      },
    ],
  },
];

export const permissions = [
  "view_dashboard",
  "view_chart_of_accounts",
  "view_products",
  "view_vendors",
  "view_customers",
  "view_sales",
  "view_sales_invoice",
  "view_sales_return",
  "view_sales_order",
  "view_purchase",
  "view_purchase_bill",
  "view_purchase_order",
  "view_purchase_return",
  "view_transactions",
  "view_receipt",
  "view_payment",
  "view_contra",
  "view_debit_note",
  "view_credit_note",
  "view_manual_journal",
  "view_recurring_adjustments",
  "view_txn_transfer",
  "view_reports",
  "view_income_statement",
  "view_balance_sheet",
  "view_trial_balance",
  "view_owners_equity",
  "view_stock_report",
  "view_cash_flow",
  "view_vendor_ledger",
  "view_employee",
  "view_employee_database",
  "view_salary_setup",
  "view_payroll_run",
  "view_salary_report",
  "view_payslip",
];
