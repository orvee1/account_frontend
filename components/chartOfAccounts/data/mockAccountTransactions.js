const mockAccountTransactions = [
  // Cash & Bank
  { id: 'acc-cash-001', name: 'Cash in Hand', type: 'Asset', category: 'Cash', balance: 1500.75 },
  { id: 'acc-cash-002', name: 'Petty Cash', type: 'Asset', category: 'Cash', balance: 300.50 },
  { id: 'acc-bank-001', name: 'Main Bank Account (Checking)', type: 'Asset', category: 'Bank', balance: 12500.00 },
  { id: 'acc-bank-002', name: 'Savings Account', type: 'Asset', category: 'Bank', balance: 50000.00 },
  { id: 'acc-bank-003', name: 'Stripe Clearing Account', type: 'Asset', category: 'Bank', balance: 0.00 },

  // Receivables & Payables
  { id: 'acc-ar-001', name: 'Accounts Receivable', type: 'Asset', category: 'Receivable', balance: 8500.00 },
  { id: 'acc-ap-001', name: 'Accounts Payable', type: 'Liability', category: 'Payable', balance: 4200.00 },
  { id: 'acc-loan-001', name: 'Short-Term Loan Payable', type: 'Liability', category: 'Payable', balance: 10000.00 },

  // Income
  { id: 'acc-inc-001', name: 'Sales Revenue - Products', type: 'Income', category: 'Income', balance: 0 },
  { id: 'acc-inc-002', name: 'Sales Revenue - Services', type: 'Income', category: 'Income', balance: 0 },
  { id: 'acc-inc-003', name: 'Interest Income', type: 'Income', category: 'Income', balance: 0 },
  { id: 'acc-inc-004', name: 'Sales Returns & Allowances', type: 'Income', category: 'Contra Income', balance: 0 },


  // Expenses
  { id: 'acc-exp-001', name: 'Rent Expense', type: 'Expense', category: 'Expense', balance: 0 },
  { id: 'acc-exp-002', name: 'Utilities Expense', type: 'Expense', category: 'Expense', balance: 0 },
  { id: 'acc-exp-003', name: 'Salaries Expense', type: 'Expense', category: 'Expense', balance: 0 },
  { id: 'acc-exp-004', name: 'Office Supplies', type: 'Expense', category: 'Expense', balance: 0 },
  { id: 'acc-exp-005', name: 'Advertising Expense', type: 'Expense', category: 'Expense', balance: 0 },
  { id: 'acc-exp-006', name: 'Bank Charges', type: 'Expense', category: 'Expense', balance: 0 },
  { id: 'acc-exp-007', name: 'Cost of Goods Sold', type: 'Expense', category: 'COGS', balance: 0 },
  { id: 'acc-exp-008', name: 'Purchase Discounts', type: 'Expense', category: 'Contra Expense', balance: 0 },


  // Equity
  { id: 'acc-eq-001', name: 'Owner\'s Capital', type: 'Equity', category: 'Equity', balance: 75000.00 },
  { id: 'acc-eq-002', name: 'Owner\'s Drawings', type: 'Equity', category: 'Equity', balance: 0 },
  { id: 'acc-eq-003', name: 'Retained Earnings', type: 'Equity', category: 'Equity', balance: 20000.00 },

  // Fixed Assets
  { id: 'acc-fa-001', name: 'Office Equipment', type: 'Asset', category: 'Fixed Asset', balance: 5000.00 },
  { id: 'acc-fa-002', name: 'Accumulated Depreciation - Office Equipment', type: 'Asset', category: 'Contra Asset', balance: -1000.00 },
  { id: 'acc-fa-003', name: 'Vehicles', type: 'Asset', category: 'Fixed Asset', balance: 15000.00 },
  { id: 'acc-fa-004', name: 'Accumulated Depreciation - Vehicles', type: 'Asset', category: 'Contra Asset', balance: -3000.00 },

  // Other
  { id: 'acc-oth-001', name: 'Suspense Account', type: 'Asset', category: 'Other', balance: 0.00 }, // Could be Asset/Liability/Equity
  { id: 'acc-oth-002', name: 'Uncategorized Income', type: 'Income', category: 'Other', balance: 0.00 },
  { id: 'acc-oth-003', name: 'Uncategorized Expense', type: 'Expense', category: 'Other', balance: 0.00 },
];

export default mockAccountTransactions;
