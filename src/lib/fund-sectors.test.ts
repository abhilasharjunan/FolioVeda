import { describe, expect, it } from "vitest";
import { resolveSectorAllocation, topHoldings } from "./fund-sectors";

describe("fund-sectors", () => {
  it("aggregates sectors from holdings when cache keys look like stock names", () => {
    const holdings = [
      { stockName: "Reliance Industries", sector: "Energy", allocation: 8 },
      { stockName: "HDFC Bank", sector: "Financials", allocation: 7 },
      { stockName: "Infosys", sector: "IT", allocation: 5 },
    ];
    const badCache = {
      "Reliance Industries": 8,
      "HDFC Bank": 7,
      Infosys: 5,
    };
    const out = resolveSectorAllocation(badCache, holdings);
    expect(out.Energy).toBe(8);
    expect(out.Financials).toBe(7);
    expect(out.IT).toBe(5);
  });

  it("returns top 10 holdings by weight", () => {
    const holdings = Array.from({ length: 15 }, (_, i) => ({
      stockName: `Stock ${i}`,
      sector: "Other",
      allocation: i + 1,
    }));
    const top = topHoldings(holdings, 10);
    expect(top).toHaveLength(10);
    expect(top[0].allocation).toBe(15);
    expect(top[9].allocation).toBe(6);
  });
});
