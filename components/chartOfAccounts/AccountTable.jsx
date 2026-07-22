"use client";

import SortableHeader from "./SortableHeader";
import AccountRow from "./AccountRow";

/**
 * Pure presentational + event-driven:
 * - accountTree: already built + leveled list (page.jsx backend থেকে লোড ও ফ্ল্যাটেন করা)
 * - sortConfig/requestSort: client-side sort (server-side চাইলে props বদলালেই হবে)
 */
export default function AccountTable({
  accountTree = [],
  sortConfig,
  requestSort,
  onEdit,
  onDelete,
  toggleExpand,
  handleOpenModal,
  setSelectedAccountForLedger,
  searchTerm,
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border dark:border-dark-border shadow-md">
      <table className="w-full min-w-[800px] text-sm text-left text-foreground dark:text-dark-foreground">
        <thead className="text-xs text-primary dark:text-dark-primary uppercase bg-muted/50 dark:bg-dark-muted/50">
          <tr>
            <SortableHeader columnKey="sl"          sortConfig={sortConfig} requestSort={requestSort} className="w-16">Sl</SortableHeader>
            <SortableHeader columnKey="account_no"  sortConfig={sortConfig} requestSort={requestSort}>Acc. No.</SortableHeader>
            <SortableHeader columnKey="account_name"sortConfig={sortConfig} requestSort={requestSort} className="min-w-[250px]">Account Name</SortableHeader>
            <SortableHeader columnKey="account_type"sortConfig={sortConfig} requestSort={requestSort}>Type</SortableHeader>
            <SortableHeader columnKey="detail_type" sortConfig={sortConfig} requestSort={requestSort}>Sub-Type</SortableHeader>
            <SortableHeader columnKey="balance"     sortConfig={sortConfig} requestSort={requestSort} isTextRight>Balance</SortableHeader>
            <th scope="col" className="px-4 py-3 text-center w-28">Actions</th>
          </tr>
        </thead>

        <tbody>
          {accountTree?.length > 0 ? (
            accountTree.map((account, index) => (
              <AccountRow
                key={account?.id ?? `${account?.account_no ?? "row"}-${index}`}
                account={account}
                index={index}
                toggleExpand={toggleExpand}
                onEdit={onEdit}
                onDelete={onDelete}
                handleOpenModal={handleOpenModal}
                setSelectedAccountForLedger={setSelectedAccountForLedger}
              />
            ))
          ) : (
            <tr>
              <td colSpan={7} className="text-center py-10 text-muted-foreground dark:text-dark-muted-foreground">
                {searchTerm
                  ? `No accounts found for "${searchTerm}".`
                  : "No accounts found. Get started by adding an account!"}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
