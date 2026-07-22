"use client";

import React, { useState } from "react";
import { chartData } from "@/data/ChartData";
import {
  Folder,
  FolderOpen,
  FileText,
  PlusSquare,
  Plus,
  List,
  RefreshCcw,
  X,
} from "lucide-react";

const TreeNode = ({ node, level = 0 }) => {
  const [open, setOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <li>
      <div
        className={`flex justify-between items-center py-1 px-3 rounded-md cursor-pointer transition hover:bg-gray-100 dark:hover:bg-gray-800 ${
          level === 0 ? "font-semibold" : "text-sm"
        }`}
        onClick={() => hasChildren && setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {/* Folder or Ledger Icon */}
          {hasChildren ? (
            open ? (
              <FolderOpen className="text-yellow-600" size={16} />
            ) : (
              <Folder className="text-yellow-600" size={16} />
            )
          ) : (
            <FileText className="text-gray-500" size={14} />
          )}
          <span>{node.name}</span>
        </div>

        {/* Right Side Actions */}
        <div className="flex gap-2 text-gray-400">
          <List size={14} className="hover:text-blue-500 cursor-pointer" title="View" />
          {hasChildren && (
            <PlusSquare
              size={14}
              className="hover:text-green-600 cursor-pointer"
              title="Add Group"
            />
          )}
          <Plus
            size={14}
            className="hover:text-green-500 cursor-pointer"
            title="Add Ledger"
          />
        </div>
      </div>

      {/* Nested Children */}
      {open && hasChildren && (
        <ul className="ml-5 border-l border-gray-300 dark:border-gray-700 pl-3 space-y-1">
          {node.children.map((child, i) => (
            <TreeNode key={i} node={child} level={level + 1} />
          ))}
        </ul>
      )}
    </li>
  );
};

export default function ChartOfAccountsFullPage() {
  const [closed, setClosed] = useState(false);

  if (closed)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500 italic">
        Panel Closed — Click Reload to reopen.
      </div>
    );

  return (
    <main className="w-full h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="flex justify-end items-center bg-gray-100 dark:bg-gray-800 px-6 py-4 border-b dark:border-gray-700 shadow-sm">
        <div className="flex gap-4 items-center">
          <RefreshCcw
            size={20}
            className="cursor-pointer hover:text-blue-600 transition"
            title="Reload"
            onClick={() => window.location.reload()}
          />
          <X
            size={20}
            className="cursor-pointer hover:text-red-500 transition"
            title="Close"
            onClick={() => setClosed(true)}
          />
        </div>
      </header>

      {/* Body */}
      <section className="flex-1 overflow-y-auto p-6">
        <ul className="space-y-6">
          {chartData.map((section, idx) => (
            <li key={idx}>
              <div className="flex justify-between items-center mb-2">
                <b className={`${section.color} text-lg`}>{section.title}</b>
                <PlusSquare
                  size={18}
                  className="cursor-pointer hover:text-green-600"
                  title="Add Root Group"
                />
              </div>
              <ul className="ml-3 space-y-1">
                {section.children.map((child, i) => (
                  <TreeNode key={i} node={child} />
                ))}
              </ul>
            </li>
          ))}

          {/* Difference Section */}
          <li className="mt-8">
            <b className="text-gray-500 text-base">DIFFERENCE</b>
            <ul className="ml-3 mt-1">
              <li className="text-sm cursor-pointer hover:text-blue-600">
                Deactivate List
              </li>
            </ul>
          </li>
        </ul>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-800 py-2 text-center text-xs text-gray-500 dark:text-gray-400 border-t dark:border-gray-700">
        © {new Date().getFullYear()} Accounting System — Chart of Accounts
      </footer>
    </main>
  );
}
