"use client";

import React, { useState } from "react";
import {
  Folder,
  FolderOpen,
  FileText,
  PlusSquare,
  List,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

const chartData = [
  {
    title: "ASSETS",
    color: "text-green-600",
    children: [
      {
        name: "Fixed Assets",
        children: [
          { name: "Land" },
          { name: "Buildings" },
          { name: "Machinery" },
          { name: "Vehicles" },
          { name: "Furniture and Fixtures" },
        ],
      },
      {
        name: "Current Assets",
        children: [
          { name: "Cash in Hand" },
          { name: "Cash at Bank" },
          { name: "Accounts Receivable & Debtors" },
          { name: "Inventory" },
          { name: "Short-term Investments" },
        ],
      },
      {
        name: "Other Assets",
        children: [
          { name: "Long-term Investments" },
          { name: "Intangible Assets" },
          { name: "Prepaid Expenses" },
          { name: "Advances to Suppliers" },
          { name: "Advances Other" },
        ],
      },
    ],
  },
  {
    title: "LIABILITIES",
    color: "text-red-600",
    children: [
      {
        name: "Capital Account",
        children: [
          { name: "Shareholder's" },
          { name: "Owner's Equity" },
          { name: "Equity" },
        ],
      },
      {
        name: "Reserve & Surplus",
        children: [{ name: "Share Capital" }, { name: "Retained Earnings" }],
      },
      {
        name: "Secured Loans",
        children: [{ name: "Mortgage Loans" }, { name: "Secured Bonds" }],
      },
      {
        name: "Unsecured Loans",
        children: [{ name: "Debentures" }, { name: "Unsecured Bonds" }],
      },
    ],
  },
  {
    title: "INCOME",
    color: "text-blue-600",
    children: [
      {
        name: "Sales",
        children: [{ name: "Sales Revenue" }, { name: "Sales Returns" }],
      },
      {
        name: "Direct Income",
        children: [{ name: "Interest Income" }, { name: "Dividend Income" }],
      },
      {
        name: "Indirect Income",
        children: [{ name: "Rental Income" }, { name: "Commission Income" }],
      },
    ],
  },
  {
    title: "EXPENSES",
    color: "text-orange-600",
    children: [
      {
        name: "Purchase",
        children: [{ name: "Cost of Goods Sold" }, { name: "Inventory Purchase" }],
      },
      {
        name: "Direct Expenses",
        children: [{ name: "Office Expenses" }, { name: "Manufacturing Expenses" }],
      },
      {
        name: "Indirect Expenses",
        children: [
          { name: "Rent Expense" },
          { name: "Utilities" },
          { name: "Salary & Wages" },
          { name: "Advertising & Promotion" },
        ],
      },
    ],
  },
];

const FolderNode = ({ node, level = 0 }) => {
  const [open, setOpen] = useState(false);

  const hasChildren = node.children && node.children.length > 0;

  return (
    <li>
      <div
        className={`flex items-center justify-between py-1 px-2 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
          level === 0 ? "font-semibold" : "text-sm"
        }`}
      >
        <div className="flex items-center space-x-2" onClick={() => hasChildren && setOpen(!open)}>
          {hasChildren ? (
            open ? (
              <ChevronDown size={14} className="text-gray-500" />
            ) : (
              <ChevronRight size={14} className="text-gray-500" />
            )
          ) : (
            <FileText size={13} className="text-gray-400 ml-[1.2rem]" />
          )}
          {hasChildren ? (
            open ? (
              <FolderOpen className="text-yellow-600" size={16} />
            ) : (
              <Folder className="text-yellow-600" size={16} />
            )
          ) : null}
          <span>{node.name}</span>
        </div>

        <div className="flex items-center space-x-2 text-gray-400">
          <List size={14} className="hover:text-blue-600 cursor-pointer" title="View" />
          <PlusSquare size={14} className="hover:text-green-600 cursor-pointer" title="Add Group" />
        </div>
      </div>

      {open && hasChildren && (
        <ul className="ml-6 border-l border-gray-300 dark:border-gray-700 pl-3 space-y-1">
          {node.children.map((child, idx) => (
            <FolderNode key={idx} node={child} level={level + 1} />
          ))}
        </ul>
      )}
    </li>
  );
};

const ChartOfAccountsTree = () => {
  return (
    <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-xl font-bold text-primary dark:text-blue-400 flex items-center gap-2">
          <FolderOpen size={22} /> Chart of Accounts
        </h2>
        <button className="text-sm border rounded-md px-3 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">
          Refresh
        </button>
      </div>

      <div className="mt-3 space-y-3">
        {chartData.map((section, i) => (
          <div key={i}>
            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md">
              <b className={section.color}>{section.title}</b>
              <PlusSquare size={15} className="hover:text-green-600 cursor-pointer" />
            </div>
            <ul className="mt-1 ml-3">
              {section.children.map((child, idx) => (
                <FolderNode key={idx} node={child} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartOfAccountsTree;
