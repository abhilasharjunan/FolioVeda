"use client";

import { FundNameLink } from "@/components/funds/FundNameLink";

export function ReportFundCell({
  schemeCode,
  schemeName,
}: {
  schemeCode?: string;
  schemeName: string;
}) {
  if (!schemeCode) return <>{schemeName}</>;
  return <FundNameLink schemeCode={schemeCode}>{schemeName}</FundNameLink>;
}
