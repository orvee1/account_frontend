"use client";

import {
  ChevronRight,
  Edit,
  FileText,
  Folder,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/** Local formatter fallback: if API doesn't send formatted balance */
function formatBalance(val) {
  const num = Number(val ?? 0);
  try {
    return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  } catch {
    return num.toFixed(2);
  }
}

export default function AccountRow({
  account,
  index,
  toggleExpand,                  // (account_no) => void
  onEdit,                        // (account) => void
  onDelete,                      // (account) => void
  handleOpenModal,               // (account, "add_child_account") => void
  setSelectedAccountForLedger,   // (account) => void
}) {
  const hasChildren = (account?.children?.length || 0) > 0;
  const isExpanded = !!account?.isExpanded;

  // safe fallbacks
  const sl = account?.displaySl ?? (index + 1);
  const balanceText = account?.displayBalanceFormatted ?? formatBalance(account?.balance);

  const indent = `${16 + (account?.level ?? 0) * 20}px`;

  return (
    <tr
      className={`hover:bg-muted/30 dark:hover:bg-dark-muted/30 border-b border-border dark:border-dark-border last:border-b-0 transition-colors duration-150 ${
        hasChildren
          ? "bg-blue-50 dark:bg-blue-950 font-semibold text-base text-blue-800 dark:text-blue-200"
          : "bg-card dark:bg-dark-card text-sm"
      }${hasChildren ? " cursor-pointer " : ""}`}
      onClick={() => hasChildren && toggleExpand?.(account?.account_no)}
      role={hasChildren ? "button" : undefined}
      aria-expanded={hasChildren ? isExpanded : undefined}
    >
      <td className="px-4 py-3" style={{ paddingLeft: indent }}>
        <div className="flex items-center gap-1">
          <span>{sl}</span>
          {hasChildren && (
            <ChevronRight
              size={14}
              className={`transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
              aria-hidden
            />
          )}
        </div>
      </td>

      <td className="px-4 py-3 text-xs font-mono">{account?.account_no ?? "—"}</td>

      <td
        className="px-4 py-3 font-medium text-secondary dark:text-dark-secondary hover:underline"
        style={{ paddingLeft: indent }}
      >
        <div className="flex items-center">
          {hasChildren ? (
            <Folder size={14} className="mr-1 text-blue-600 dark:text-blue-300" />
          ) : (
            <FileText size={14} className="mr-1 text-gray-500 dark:text-gray-400" />
          )}

          <Link
            href={`/chart-of-accounts/${account?.id}`}
            className="text-blue-800 dark:text-dark-secondary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {account?.account_name}
          </Link>

          {/* Header account হলে child add shortcut */}
          {!account?.parent_account_id && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 ml-2 text-green-600 hover:text-white dark:text-green-400 dark:hover:text-green-300"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenModal?.(account, "add_child_account");
              }}
              title="Add child account"
              aria-label="Add child account"
            >
              <PlusCircle size={16} />
            </Button>
          )}
        </div>
      </td>

      <td className="px-4 py-3">{account?.account_type}</td>
      <td className="px-4 py-3">{account?.detail_type}</td>

      <td
        className="px-4 py-3 text-right font-semibold hover:underline cursor-pointer text-primary dark:text-dark-primary"
        onClick={(e) => {
          e.stopPropagation();
          setSelectedAccountForLedger?.(account);
        }}
        title="View ledger"
      >
        {balanceText}
      </td>

      <td className="px-4 py-3 text-center space-x-1">
        <Button
          variant="ghost"
          size="icon"
          className="text-secondary dark:text-dark-secondary hover:text-white dark:hover:text-dark-accent h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.(account);
          }}
          aria-label="Edit"
          title="Edit"
        >
          <Edit size={16} />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="text-destructive dark:text-red-400 hover:text-rose-800 dark:hover:text-red-300 h-8 w-8"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(account);
          }}
          aria-label="Delete"
          title="Delete"
        >
          <Trash2 size={16} />
        </Button>
      </td>
    </tr>
  );
}
