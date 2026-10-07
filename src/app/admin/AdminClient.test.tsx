import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/animations", () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import AdminClient from "./AdminClient";

const metrics = {
  kpis: {
    totalAccounts: 10,
    signups7d: 2,
    signups30d: 5,
    logins7d: 4,
    logins30d: 7,
    disabledCount: 1,
    withHoldings: 3,
    emptyPortfolio: 7,
    neverLoggedIn: 3,
  },
  funnel: { signedUp: 10, loggedInAtLeastOnce: 7, hasHoldings: 3 },
  usage: {
    withGoals: 2,
    activeTransactions7d: 1,
    holdingBands: { one: 1, twoToFive: 2, sixPlus: 0 },
  },
  signupsByDay: [{ date: "2026-10-07", count: 2 }],
  dataHealth: {
    latestNavDate: "2026-10-06T00:00:00.000Z",
    schemeCatalogCount: 120,
    schemeCatalogUpdatedAt: "2026-10-07T12:00:00.000Z",
    schemesMissingRisk: 5,
    schemeCount: 80,
    topFundsUpdatedAt: null,
  },
  inbox: {
    newCount: 1,
    underReviewCount: 0,
    openBugs: 1,
    openData: 0,
    recent: [
      {
        id: "f1",
        title: "NAV date looks wrong",
        category: "DATA",
        status: "NEW",
        createdAt: "2026-10-07T10:00:00.000Z",
      },
    ],
  },
  auditLog: [],
  traffic: {
    provider: "vercel",
    note: "Anonymous visits live in Vercel.",
    dashboardUrl: "https://vercel.com/dashboard",
  },
};

describe("AdminClient", () => {
  beforeEach(() => {
    cleanup();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (String(url).includes("/api/admin/metrics")) {
          return { ok: true, status: 200, json: async () => metrics };
        }
        return { ok: true, status: 200, json: async () => ({ users: [] }) };
      })
    );
  });

  it("shows login activity, data jobs, and the feedback inbox", async () => {
    render(<AdminClient />);
    expect(await screen.findByText("Logins 7d")).toBeTruthy();
    expect(screen.getByText("Signups 30d")).toBeTruthy();
    expect(screen.getByText("Data jobs")).toBeTruthy();
    expect(screen.getByText("Latest NAV snapshot")).toBeTruthy();
    expect(screen.getByText("Feedback inbox")).toBeTruthy();
    expect(screen.getByText("NAV date looks wrong")).toBeTruthy();
    expect(screen.getByText("Has a goal")).toBeTruthy();
    expect(screen.getByText("Portfolio idle 30d")).toBeTruthy();
  });

  it("reloads users when a filter chip is chosen", async () => {
    render(<AdminClient />);
    await screen.findByText("Logins 7d");
    fireEvent.click(screen.getAllByRole("button", { name: "Never logged in" })[0]);
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("filter=never_logged_in"),
        expect.objectContaining({ cache: "no-store" })
      );
    });
  });
});
