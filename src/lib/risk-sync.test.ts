import { describe, expect, it } from "vitest";
import {
  benchmarkSchemesMissingRiskSync,
  riskCategoriesNeedingRefill,
} from "./risk-sync";

describe("risk sync helpers", () => {
  it("flags benchmark schemes without persisted risk metrics", () => {
    const missing = benchmarkSchemesMissingRiskSync([
      { schemeCode: "149800", riskScore: 42, sharpeRatio: 1.1 },
      { schemeCode: "148703", riskScore: null, sharpeRatio: null },
    ]);
    expect(missing.some((s) => s.schemeCode === "148703")).toBe(true);
    expect(missing.some((s) => s.schemeCode === "149800")).toBe(false);
  });

  it("detects empty risk categories that still have benchmark schemes", () => {
    const thin = riskCategoriesNeedingRefill({
      "Large Cap": [{ schemeCode: "118531" }],
      "Momentum Index Funds": [],
    });
    expect(thin).toContain("Momentum Index Funds");
    expect(thin).not.toContain("Large Cap");
  });
});
