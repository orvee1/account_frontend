"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Tabs({ defaultValue, className, children }) {
  const [activeTab, setActiveTab] = React.useState(defaultValue);

  const contextValue = React.useMemo(
    () => ({ activeTab, setActiveTab }),
    [activeTab]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

const TabsContext = React.createContext(undefined);

export function TabsList({ className, children }) {
  return (
    <div
      className={cn(
        "inline-flex items-center space-x-2 border-b mb-4",
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className, activeClassName, inactiveClassName }) {
  const { activeTab, setActiveTab } = React.useContext(TabsContext);

  const isActive = activeTab === value;

  return (
    <button
      onClick={() => setActiveTab?.(value)}
      className={cn(
        "px-4 py-2 text-sm font-medium transition-colors",
        isActive
          ? activeClassName || "border-b-2 border-blue-600 text-blue-600"
          : inactiveClassName || "text-gray-600 hover:text-blue-600",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }) {
  const { activeTab } = React.useContext(TabsContext);

  if (activeTab !== value) return null;

  return <div className={cn("mt-2", className)}>{children}</div>;
}
