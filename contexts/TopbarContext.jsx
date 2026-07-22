"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

const TopbarContext = createContext(undefined);

export function TopbarProvider({ children }) {
  const [rightContent, setRightContentState] = useState(null);

  const setRightContent = useCallback((content) => {
    setRightContentState(() => content);
  }, []);

  const clearRightContent = useCallback(() => {
    setRightContentState(null);
  }, []);

  const value = useMemo(
    () => ({ rightContent, setRightContent, clearRightContent }),
    [rightContent, setRightContent, clearRightContent]
  );

  return <TopbarContext.Provider value={value}>{children}</TopbarContext.Provider>;
}

export function useTopbar() {
  const context = useContext(TopbarContext);
  if (!context) {
    throw new Error("useTopbar must be used within a TopbarProvider");
  }
  return context;
}
