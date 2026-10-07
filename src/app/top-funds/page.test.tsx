import { describe, it, expect, vi } from "vitest";

const redirect = vi.fn();

vi.mock("next/navigation", () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

import TopFundsPage from "./page";

describe("TopFundsPage", () => {
  it("redirects to the combined market funds returns view", () => {
    TopFundsPage();
    expect(redirect).toHaveBeenCalledWith("/funds/market?mode=returns");
  });
});
