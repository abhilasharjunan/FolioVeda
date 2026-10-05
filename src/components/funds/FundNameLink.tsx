"use client";

import React from "react";
import { useOpenFundDetail } from "./FundDetailContext";

type Props = {
  schemeCode: string;
  children: React.ReactNode;
  className?: string;
  title?: string;
  stopPropagation?: boolean;
};

/** Clickable fund name that opens the fund detail slide-over. */
export function FundNameLink({
  schemeCode,
  children,
  className = "",
  title,
  stopPropagation = true,
}: Props) {
  const openFund = useOpenFundDetail();

  return (
    <button
      type="button"
      title={title}
      className={`text-left hover:text-teal-700 dark:hover:text-teal-300 hover:underline underline-offset-2 decoration-teal-500/40 transition-colors ${className}`}
      onClick={(e) => {
        if (stopPropagation) e.stopPropagation();
        openFund(schemeCode);
      }}
    >
      {children}
    </button>
  );
}
