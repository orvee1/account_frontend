"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";

const API_BASE_URL = "/api/backend";

/* =======================
   Helper: children_recursive → children
======================= */
const normalizeTree = (nodes) => {
  if (!Array.isArray(nodes)) return [];

  return nodes.map((n) => ({
    id: n.id,
    name: n.name,
    type: n.type, // 'group' | 'ledger'
    code: n.code,
    path: n.path,
    depth: n.depth,
    balance: Number(n.balance ?? 0),
    children: normalizeTree(n.children_recursive || n.children || []),
  }));
};

/* =======================
   Helper: descendant count (G:x | L:y)
   - type দেখে count
   - self count করে না, শুধু descendants
======================= */
const countDescendants = (node) => {
  let groups = 0;
  let ledgers = 0;

  const walk = (n) => {
    if (!n) return;

    if (n.type === "group") groups += 1;
    if (n.type === "ledger") ledgers += 1;

    (n.children || []).forEach(walk);
  };

  // self বাদ রেখে descendants count
  (node.children || []).forEach(walk);

  return { groups, ledgers };
};


const formatBalance = (value) => {
  const num = Number(value ?? 0);
  try {
    return new Intl.NumberFormat(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return num.toFixed(2);
  }
};

/* =======================
   Recursive TreeNode
======================= */
const TreeNode = ({
  node,
  level = 0,
  search = "",
  expandAll,
  onView,
  onAddGroup,
  onAddLedger,
}) => {
  const [open, setOpen] = useState(expandAll);

  const hasChildren = node.children && node.children.length > 0;
  const isGroup = node.type === "group";

  const { groups, ledgers } = isGroup
    ? countDescendants(node)
    : { groups: 0, ledgers: 0 };

  useEffect(() => {
    setOpen(expandAll);
  }, [expandAll]);

  const term = search.trim().toLowerCase();
  const matchSelf = node.name.toLowerCase().includes(term);

  const matchChild =
    node.children &&
    node.children.some((c) => c.name.toLowerCase().includes(term));

  if (term && !matchSelf && !matchChild) return null;

  return (
    <li>
      <div
        className={`flex items-center justify-between py-1 px-3 rounded-md cursor-pointer transition-all duration-150 ${isGroup
          ? "font-semibold bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800"
          : "text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        onClick={() => {
          if (isGroup) {
            setOpen(!open);
          } else {
            onView(node);
          }
        }}
      >
        <div className="flex items-center w-full select-none">
          {/* Icon */}
          <span
            className={`mr-1 ${isGroup ? "text-yellow-600" : "text-gray-500"}`}
          >
            {isGroup ? (open ? "📂" : "📁") : "📄"}
          </span>

          {/* Name + info */}
          <span>
            {node.name}{" "}
            <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">
              {isGroup ? `(G: ${groups} | L: ${ledgers})` : "(Ledger)"}
            </span>
          </span>

          {/* Actions */}
          <span className="ml-auto text-xs tabular-nums text-gray-500 dark:text-gray-400">
            {formatBalance(node.balance)}
          </span>

          <div
            className="ml-2 text-gray-500 text-xs font-medium flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="hover:text-blue-600 transition"
              title="View"
              onClick={() => onView(node)}
            >
              🔍
            </button>

            {isGroup && (
              <>
                <button
                  className="hover:text-green-600 transition ml-1"
                  title="Add Sub Group"
                  onClick={() => onAddGroup(node)}
                >
                  ➕
                </button>
                <button
                  className="hover:text-green-600 transition ml-1"
                  title="Add Ledger"
                  onClick={() => onAddLedger(node)}
                >
                  🧾
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Children */}
      {isGroup && hasChildren && (
        <ul
          className={`ml-6 border-l border-blue-300 dark:border-gray-700 pl-3 transition-all duration-300 ease-in-out overflow-hidden ${open ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
            }`}
        >
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              search={search}
              expandAll={expandAll}
              onView={onView}
              onAddGroup={onAddGroup}
              onAddLedger={onAddLedger}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

/* =======================
   Main Page
======================= */
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { 
  exportCOA, 
  importCOA, 
  mergeAccounts, 
  getCOATemplate 
} from "@/services/chartAccounts";
import { FileUp, FileDown, GitMerge, FileText, Search, X } from "lucide-react";

export default function ChartOfAccountsFullPage({ companyId: propCompanyId, initialChartData }) {
  const router = useRouter();
  const { user } = useAuth();
  const isFirstLoad = useRef(true);
  const [chartData, setChartData] = useState([]);
  const [companyId, setCompanyId] = useState(propCompanyId || null);
  const [search, setSearch] = useState("");
  const [expandAll, setExpandAll] = useState(false);
  const [modal, setModal] = useState(null); // "view" | "group" | "ledger" | "merge" | "import"
  const [selected, setSelected] = useState(null);
  const [newName, setNewName] = useState("");
  const [newCode, setNewCode] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [openingBalanceType, setOpeningBalanceType] = useState("debit");
  const [openingDate, setOpeningDate] = useState("");

  const [loading, setLoading] = useState(!initialChartData || initialChartData.length === 0);
  const [error, setError] = useState("");

  // Merge State
  const [sourceAccountId, setSourceAccountId] = useState("");
  const [targetAccountId, setTargetAccountId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // File Import Ref
  const fileInputRef = useRef(null);

  // Flat list for select inputs
  const flatAccounts = useMemo(() => {
    const list = [];
    const walk = (nodes) => {
      nodes.forEach(n => {
        list.push(n);
        if (n.children) walk(n.children);
      });
    };
    walk(chartData);
    return list;
  }, [chartData]);

  // Sync with props
  useEffect(() => {
    if (initialChartData && initialChartData.length > 0) {
      setChartData(normalizeTree(initialChartData));
      setLoading(false);
    }
  }, [initialChartData]);

  // companyId from auth
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cid = propCompanyId || user?.company_id || user?.company?.id;
      if (cid) {
        setCompanyId(cid);
      } else if (!initialChartData || initialChartData.length === 0) {
        setError("companyId পাওয়া যায়নি। আগে লগইন চেক করুন।");
      }
    }
  }, [propCompanyId, user, initialChartData]);

  // Load Chart of Accounts
  const loadChartData = async () => {
    const effectiveCompanyId = companyId || propCompanyId || user?.company_id || user?.company?.id;
    if (!effectiveCompanyId) return;

    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${API_BASE_URL}/companies/${effectiveCompanyId}/chart-accounts`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.message || "চার্ট অফ অ্যাকাউন্টস লোড করতে সমস্যা হচ্ছে"
        );
      }

      // Backend returns roots directly as array or in .data
      const rawData = Array.isArray(json) ? json : (json.data || []);
      const normalized = normalizeTree(rawData);
      setChartData(normalized);
    } catch (e) {
      console.error(e);
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // companyId set হলে data load
  useEffect(() => {
    // If we have initial data and it's the first load, skip fetching
    if (isFirstLoad.current && initialChartData && initialChartData.length > 0) {
       isFirstLoad.current = false;
       return;
    }

    if (companyId) {
      loadChartData();
      isFirstLoad.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  // নতুন group / ledger তৈরি
  const handleSave = async () => {
    const effectiveCompanyId = companyId || propCompanyId || user?.company_id || user?.company?.id;
    if (!newName.trim() || !selected || !effectiveCompanyId) return;

    try {
      const payload = {
        name: newName,
        type: modal === "group" ? "group" : "ledger",
        parent_id: selected.id || null,
        ...(newCode ? { code: newCode } : {}),
        ...(modal === "ledger" && openingBalance !== ""
          ? { 
              opening_balance: Number(openingBalance),
              opening_balance_type: openingBalanceType
            }
          : {}),
        ...(modal === "ledger" && openingDate
          ? { opening_date: openingDate }
          : {}),
      };

      const res = await fetch(
        `${API_BASE_URL}/companies/${effectiveCompanyId}/chart-accounts`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.message || "নতুন একাউন্ট সেভ করতে সমস্যা হচ্ছে");
      }

      await loadChartData();
      setNewName("");
      setNewCode("");
      setOpeningBalance("");
      setOpeningBalanceType("debit");
      setOpeningDate("");
      setModal(null);
    } catch (e) {
      alert(e.message || "Error while saving");
    }
  };

  const handleExport = () => {
    if (!companyId) return alert("Company ID is missing");
    exportCOA(companyId);
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file || !companyId) return;

    try {
      setLoading(true);
      const response = await importCOA(companyId, file);
      if (response.success) {
        alert("Imported successfully!");
        loadChartData();
      } else {
        alert(response.message || "Import failed");
      }
    } catch (err) {
      alert(err.message || "Error importing");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleMerge = async () => {
    if (!sourceAccountId || !targetAccountId || !companyId) {
      return alert("Please select both source and target accounts");
    }

    try {
      setSubmitting(true);
      const response = await mergeAccounts(companyId, {
        source_account_id: sourceAccountId,
        target_account_id: targetAccountId
      });

      if (response.success) {
        alert("Merged successfully!");
        setModal(null);
        setSourceAccountId("");
        setTargetAccountId("");
        loadChartData();
      } else {
        alert(response.message || "Merge failed");
      }
    } catch (err) {
      alert(err.message || "Error merging");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUseTemplate = async () => {
     if (!confirm("Are you sure you want to view a standard COA template?")) return;
     try {
       const response = await getCOATemplate(companyId);
       if (response.success) {
          // In a real scenario, you'd allow them to select/apply it.
          // For now, let's just show it in console or alert.
          alert("Template fetched! Implementation of applying template is a separate step.");
          console.log("Template:", response.data);
       }
     } catch (err) {
       alert("Error fetching template");
     }
  };

  return (
    <main className="w-full h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="flex flex-col gap-3 bg-gray-100 dark:bg-gray-800 px-6 py-3 border-b dark:border-gray-700 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="search"
            aria-label="Search chart of accounts"
            placeholder="Search accounts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-md border border-gray-200 bg-white pl-9 pr-9 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear account search"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-gray-400 transition hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-100"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 text-sm font-medium">
          <button
            className="flex items-center gap-1 hover:text-blue-600 transition border rounded px-2 py-1 bg-white dark:bg-gray-700"
            onClick={handleUseTemplate}
            title="Standard Template"
          >
            <FileText size={16} /> Template
          </button>
          <button
            className="flex items-center gap-1 hover:text-orange-600 transition border rounded px-2 py-1 bg-white dark:bg-gray-700"
            onClick={() => setModal("merge")}
            title="Merge Accounts"
          >
            <GitMerge size={16} /> Merge
          </button>
          <button
            className="flex items-center gap-1 hover:text-green-600 transition border rounded px-2 py-1 bg-white dark:bg-gray-700"
            onClick={() => fileInputRef.current?.click()}
            title="Import Excel/CSV"
          >
            <FileUp size={16} /> Import
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".xlsx,.xls,.csv" 
            onChange={handleImport}
          />
          <button
            className="flex items-center gap-1 hover:text-blue-600 transition border rounded px-2 py-1 bg-white dark:bg-gray-700"
            onClick={handleExport}
            title="Export Excel"
          >
            <FileDown size={16} /> Export
          </button>
          <button
            className="hover:text-blue-600 transition"
            onClick={loadChartData}
            disabled={loading}
          >
            🔄 {loading ? "লোড হচ্ছে..." : "রিলোড"}
          </button>
        </div>
      </header>

      {/* Controls */}
      <div className="flex items-center justify-end px-6 py-3 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-800">
        <input
          type="text"
          placeholder="🔍 অ্যাকাউন্ট অনুসন্ধান..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="hidden"
        />
        <div className="flex items-center text-xs font-medium text-gray-600 dark:text-gray-400">
          <button
            className="hover:text-blue-600 transition"
            onClick={() => setExpandAll(true)}
          >
            🔽 সব খুলুন
          </button>
          <button
            className="ml-3 hover:text-red-500 transition"
            onClick={() => setExpandAll(false)}
          >
            🔼 সব বন্ধ করুন
          </button>
        </div>
      </div>

      {error && (
        <div className="px-6 pt-3 text-sm text-red-600 whitespace-pre-line">
          {error}
        </div>
      )}

      {/* Body */}
      <section className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center text-gray-500">লোড হচ্ছে...</div>
        ) : (
          <ul className="space-y-6">
            {chartData.map((root) => (
              <li key={root.id}>
                <div className="flex items-center mb-1">
                  <b className="text-blue-700 text-lg">
                    {root.name}{" "}
                    <span className="text-xs text-gray-400">({root.code})</span>
                  </b>
                </div>
                <ul className="ml-3 space-y-1">
                  {(root.children || []).map((child) => (
                    <TreeNode
                      key={child.id}
                      node={child}
                      search={search}
                      expandAll={expandAll}
                      onView={(node) => {
                        if (node.type === "ledger") {
                          router.push(`/chart-of-accounts/${node.id}`);
                        } else {
                          setSelected(node);
                          setModal("view");
                        }
                      }}
                      onAddGroup={(node) => {
                        setSelected(node);
                        setNewName("");
                        setNewCode("");
                        setOpeningBalance("");
                        setOpeningBalanceType("debit");
                        setOpeningDate("");
                        setModal("group");
                      }}
                      onAddLedger={(node) => {
                        setSelected(node);
                        setNewName("");
                        setNewCode("");
                        setOpeningBalance("");
                        setOpeningBalanceType("debit");
                        setOpeningDate("");
                        setModal("ledger");
                      }}
                    />
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-96 p-5 relative">
            {modal === "view" && selected && (
              <>
                <h2 className="text-lg font-semibold text-blue-600 mb-3 flex items-center gap-2">
                  {selected.children && selected.children.length ? "📂" : "📄"}{" "}
                  {selected.name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  <strong>ধরন:</strong>{" "}
                  {selected.children && selected.children.length
                    ? "জেনারেল লেজার (গ্রুপ)"
                    : "লেজার"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                  <strong>Account No:</strong> {selected.code || "-"}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                  <strong>Path:</strong> {selected.path}
                </p>
              </>
            )}

            {(modal === "group" || modal === "ledger") && (
              <>
                <h2 className="text-lg font-semibold text-green-600 mb-3">
                  {modal === "group"
                    ? "➕ সাব গ্রুপ যোগ করুন"
                    : "🧾 লেজার যোগ করুন"}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                  প্যারেন্ট: <strong>{selected?.name}</strong>
                </p>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="নাম লিখুন..."
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 rounded-md px-2 py-1 text-sm mb-3"
                />
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="Account No..."
                  className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 rounded-md px-2 py-1 text-sm mb-3"
                />

                {modal === "ledger" && (
                  <>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="number"
                        value={openingBalance}
                        onChange={(e) => setOpeningBalance(e.target.value)}
                        placeholder="Opening Balance..."
                        className="flex-1 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 rounded-md px-2 py-1 text-sm"
                      />
                      <select
                        value={openingBalanceType}
                        onChange={(e) => setOpeningBalanceType(e.target.value)}
                        className="w-24 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 rounded-md px-2 py-1 text-sm"
                      >
                        <option value="debit">Debit</option>
                        <option value="credit">Credit</option>
                      </select>
                    </div>
                    <input
                      type="date"
                      value={openingDate}
                      onChange={(e) => setOpeningDate(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 rounded-md px-2 py-1 text-sm mb-3"
                    />
                  </>
                )}
                <button
                  onClick={handleSave}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-md"
                >
                  সেভ
                </button>
              </>
            )}

            {modal === "merge" && (
              <>
                <h2 className="text-lg font-semibold text-orange-600 mb-3 flex items-center gap-2">
                  <GitMerge size={20} /> Merge Accounts
                </h2>
                <p className="text-xs text-gray-500 mb-4">
                  This will move all transactions from the source account to the target account and delete the source account.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Source Account (Will be deleted)</label>
                    <select
                      value={sourceAccountId}
                      onChange={(e) => setSourceAccountId(e.target.value)}
                      className="w-full border rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-700"
                    >
                      <option value="">Select account...</option>
                      {flatAccounts.filter(a => a.type === 'ledger').map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Target Account (Recipient)</label>
                    <select
                      value={targetAccountId}
                      onChange={(e) => setTargetAccountId(e.target.value)}
                      className="w-full border rounded-md px-2 py-1 text-sm bg-white dark:bg-gray-700"
                    >
                      <option value="">Select account...</option>
                      {flatAccounts.filter(a => a.type === 'ledger' && a.id !== Number(sourceAccountId)).map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({a.code})</option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleMerge}
                    disabled={submitting}
                    className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md text-sm font-bold transition disabled:opacity-50"
                  >
                    {submitting ? "Merging..." : "Merge Now"}
                  </button>
                </div>
              </>
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={() => {
                  setModal(null);
                  setOpeningBalanceType("debit");
                  setSourceAccountId("");
                  setTargetAccountId("");
                }}
                className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm"
              >
                বন্ধ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="text-xs text-gray-500 dark:text-gray-400 text-center py-2 border-t dark:border-gray-800">
        📂 গ্রুপ | 📄 লেজার | 🔍 ভিউ | ➕ সাব গ্রুপ যোগ | 🧾 লেজার যোগ
      </footer>
    </main>
  );
}
