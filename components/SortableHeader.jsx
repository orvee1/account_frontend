import { ArrowUpDown } from "lucide-react";

export default function SortableHeader({
  children,
  columnKey,
  sortConfig,
  requestSort,
  isTextRight = false,
  className = "",
}) {
  const isSorted = sortConfig && sortConfig.key === columnKey;
  const direction = isSorted ? sortConfig.direction : null;

  return (
    <th
      scope="col"
      className={`px-4 py-3 cursor-pointer hover:bg-primary/10 dark:hover:bg-white/10 transition-colors ${
        isTextRight ? "text-right" : "text-left"
      } ${className}`}
      onClick={() => requestSort?.(columnKey)}
    >
      <div
        className={`flex items-center ${
          isTextRight ? "justify-end" : "justify-start"
        }`}
      >
        {!isTextRight && children}
        <span className={`mx-1 ${isTextRight ? "mr-0 ml-1" : "ml-0 mr-1"}`}>
          {isSorted ? (
            direction === "ascending" ? (
              "▲"
            ) : (
              "▼"
            )
          ) : (
            <ArrowUpDown size={14} className="opacity-40" />
          )}
        </span>
        {isTextRight && children}
      </div>
    </th>
  );
}
