"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { FundDetailSheet } from "./FundDetailSheet";

type FundDetailContextValue = {
  openFundDetail: (schemeCode: string) => void;
  closeFundDetail: () => void;
  schemeCode: string | null;
};

const FundDetailContext = createContext<FundDetailContextValue | null>(null);

export function FundDetailProvider({ children }: { children: React.ReactNode }) {
  const [schemeCode, setSchemeCode] = useState<string | null>(null);

  const openFundDetail = useCallback((code: string) => {
    if (!code) return;
    setSchemeCode(code);
  }, []);

  const closeFundDetail = useCallback(() => setSchemeCode(null), []);

  const value = useMemo(
    () => ({ openFundDetail, closeFundDetail, schemeCode }),
    [openFundDetail, closeFundDetail, schemeCode]
  );

  return (
    <FundDetailContext.Provider value={value}>
      {children}
      <FundDetailSheet schemeCode={schemeCode} onClose={closeFundDetail} />
    </FundDetailContext.Provider>
  );
}

export function useFundDetail() {
  const ctx = useContext(FundDetailContext);
  if (!ctx) {
    throw new Error("useFundDetail must be used within FundDetailProvider");
  }
  return ctx;
}

/** Safe hook when provider may be missing (returns no-op). */
export function useOpenFundDetail() {
  const ctx = useContext(FundDetailContext);
  return ctx?.openFundDetail ?? ((_: string) => {});
}
