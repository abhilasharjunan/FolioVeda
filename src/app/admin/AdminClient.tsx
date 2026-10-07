"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  UserX,
  Briefcase,
  ExternalLink,
  Search,
  Shield,
  Loader2,
  Ban,
  CheckCircle,
  KeyRound,
  LogOut,
  Trash2,
  LogIn,
  Database,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/animations";
import { CATEGORY_META, type FeedbackCategory } from "@/lib/feedback";
import { toast } from "sonner";

const USER_FILTERS: { id: string; label: string }[] = [
  { id: "", label: "All" },
  { id: "never_logged_in", label: "Never logged in" },
  { id: "empty_portfolio", label: "Empty portfolio" },
  { id: "disabled", label: "Disabled" },
  { id: "no_consent", label: "No consent" },
  { id: "stale_portfolio", label: "Portfolio idle 30d" },
];

type AdminUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  disabledAt: string | null;
  lastLoginAt: string | null;
  consentGiven: boolean;
  consentDate: string | null;
  createdAt: string;
  hasPortfolio: boolean;
  holdingCount: number;
  portfolioUpdatedAt: string | null;
};

type Metrics = {
  kpis: {
    totalAccounts: number;
    signups7d: number;
    signups30d: number;
    logins7d: number;
    logins30d: number;
    disabledCount: number;
    withHoldings: number;
    emptyPortfolio: number;
    neverLoggedIn: number;
  };
  funnel: {
    signedUp: number;
    loggedInAtLeastOnce: number;
    hasHoldings: number;
  };
  usage: {
    withGoals: number;
    activeTransactions7d: number;
    holdingBands: { one: number; twoToFive: number; sixPlus: number };
  };
  signupsByDay: { date: string; count: number }[];
  dataHealth: {
    latestNavDate: string | null;
    schemeCatalogCount: number;
    schemeCatalogUpdatedAt: string | null;
    schemesMissingRisk: number;
    schemeCount: number;
    topFundsUpdatedAt: string | null;
  };
  inbox: {
    newCount: number;
    underReviewCount: number;
    openBugs: number;
    openData: number;
    recent: Array<{
      id: string;
      title: string;
      category: FeedbackCategory;
      status: string;
      createdAt: string;
    }>;
  };
  auditLog: Array<{
    id: string;
    action: string;
    targetUserId: string | null;
    meta: unknown;
    createdAt: string;
    actor: { email: string | null; name: string | null };
  }>;
  traffic: {
    provider: string;
    note: string;
    dashboardUrl: string;
  };
};

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}

function fmtDay(iso: string | null) {
  if (!iso) return "No snapshots yet";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}

function updatedAgo(iso: string | null) {
  if (!iso) return "No data yet";
  const hours = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 36e5));
  if (hours < 1) return "Updated just now";
  if (hours < 48) return `Updated ${hours}h ago`;
  return `Updated ${Math.round(hours / 24)}d ago`;
}

export default function AdminClient() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (search = q, nextFilter = filter) => {
    setLoading(true);
    setError(null);
    try {
      const [mRes, uRes] = await Promise.all([
        fetch("/api/admin/metrics", { cache: "no-store" }),
        fetch(
          `/api/admin/users?q=${encodeURIComponent(search)}&filter=${encodeURIComponent(nextFilter)}`,
          { cache: "no-store" }
        ),
      ]);
      if (mRes.status === 403 || uRes.status === 403) {
        setError("Admin access required.");
        setMetrics(null);
        setUsers([]);
        return;
      }
      if (!mRes.ok || !uRes.ok) {
        throw new Error("Failed to load admin data");
      }
      const m = await mRes.json();
      const u = await uRes.json();
      setMetrics(m);
      setUsers(u.users || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [q, filter]);

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runOp = async (
    userId: string,
    action: "disable" | "enable" | "force_password_reset" | "revoke_sessions" | "delete",
    confirmMsg: string
  ) => {
    if (!confirm(confirmMsg)) return;
    setBusyId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Action failed");
      toast.success(`Done: ${action.replace(/_/g, " ")}`);
      if (action === "delete" || data.deleted) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else if (data.user) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? data.user : u)));
      }
      const mRes = await fetch("/api/admin/metrics", { cache: "no-store" });
      if (mRes.ok) setMetrics(await mRes.json());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  };

  if (loading && !metrics) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-teal-600" size={28} />
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-3">
        <Shield className="mx-auto text-slate-400" size={32} />
        <h1 className="text-xl font-bold font-heading">Admin</h1>
        <p className="text-sm text-slate-500">{error}</p>
        <Link href="/dashboard" className="text-sm text-teal-600 hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const k = metrics!.kpis;
  const maxDay = Math.max(1, ...metrics!.signupsByDay.map((d) => d.count));

  return (
    <div className="px-4 py-6 sm:p-6 space-y-8 max-w-7xl mx-auto">
      <FadeIn>
        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="text-teal-600 dark:text-teal-400" size={22} />
            <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-slate-50">
              Admin
            </h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Product funnel and light ops. Passwords and holdings details are never shown.
          </p>
          <div className="pt-2">
            <Link
              href="/admin/feedback"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700 dark:text-teal-300 hover:underline"
            >
              Triage user feedback →
            </Link>
          </div>
        </header>
      </FadeIn>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Accounts", value: k.totalAccounts, icon: Users },
          { label: "Signups 7d", value: k.signups7d, icon: UserPlus },
          { label: "Signups 30d", value: k.signups30d, icon: UserPlus },
          { label: "Logins 7d", value: k.logins7d, icon: LogIn },
          { label: "Logins 30d", value: k.logins30d, icon: LogIn },
          { label: "Empty portfolio", value: k.emptyPortfolio, icon: Briefcase },
          { label: "Disabled", value: k.disabledCount, icon: UserX },
        ].map((card) => (
          <Card key={card.label} className="surface-card border-none shadow-sm">
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                <card.icon size={18} className="text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                  {card.label}
                </p>
                <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                  {card.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="surface-card border-none shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Activation funnel</CardTitle>
            <CardDescription>
              Anonymous visits are in Vercel Analytics. Below is signed-up users only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { label: "Signed up", value: metrics!.funnel.signedUp },
              { label: "Logged in at least once", value: metrics!.funnel.loggedInAtLeastOnce },
              { label: "Has holdings (count only)", value: metrics!.funnel.hasHoldings },
              { label: "Never logged in again / yet", value: k.neverLoggedIn },
            ].map((row) => (
              <div key={row.label} className="flex justify-between gap-4">
                <span className="text-slate-500">{row.label}</span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {row.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="surface-card border-none shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Usage</CardTitle>
            <CardDescription>
              Counts only. Amounts and fund names stay off this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { label: "Has a goal", value: metrics!.usage.withGoals },
              { label: "Recorded a transaction in 7d", value: metrics!.usage.activeTransactions7d },
              { label: "1 fund", value: metrics!.usage.holdingBands.one },
              { label: "2–5 funds", value: metrics!.usage.holdingBands.twoToFive },
              { label: "6+ funds", value: metrics!.usage.holdingBands.sixPlus },
            ].map((row) => (
              <div key={row.label} className="flex justify-between gap-4">
                <span className="text-slate-500">{row.label}</span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {row.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="surface-card border-none shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Traffic</CardTitle>
            <CardDescription>{metrics!.traffic.note}</CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href={metrics!.traffic.dashboardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 dark:text-teal-400 hover:underline"
            >
              Open Vercel Analytics <ExternalLink size={14} />
            </a>
            <p className="mt-3 text-xs text-slate-500">
              Enable Web Analytics in the Vercel project settings if the dashboard is empty.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="surface-card border-none shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Signups (14 days)</CardTitle>
          <CardDescription>
            New accounts by India calendar day. Logins are the cards above, not these bars.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-36">
            {metrics!.signupsByDay.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col justify-end items-center gap-1 min-w-0 h-full">
                <span className="text-[10px] tabular-nums text-slate-500">{d.count}</span>
                <div
                  className="w-full max-w-[18px] rounded-t bg-teal-600/80 dark:bg-teal-500/70"
                  style={{
                    height: `${d.count === 0 ? 2 : Math.max(8, (d.count / maxDay) * 72)}px`,
                  }}
                  title={`${d.date}: ${d.count} signup${d.count === 1 ? "" : "s"}`}
                />
                <span className="text-[9px] text-slate-400 tabular-nums">{d.date.slice(8)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="surface-card border-none shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Database size={18} className="text-teal-600 dark:text-teal-400" />
              Data jobs
            </CardTitle>
            <CardDescription>
              Freshness of the NAV, catalog, risk, and top-funds caches.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {[
              { label: "Latest NAV snapshot", value: fmtDay(metrics!.dataHealth.latestNavDate) },
              {
                label: "Scheme catalog",
                value: `${metrics!.dataHealth.schemeCatalogCount.toLocaleString("en-IN")} · ${updatedAgo(metrics!.dataHealth.schemeCatalogUpdatedAt)}`,
              },
              {
                label: "Schemes missing a risk score",
                value: `${metrics!.dataHealth.schemesMissingRisk.toLocaleString("en-IN")} of ${metrics!.dataHealth.schemeCount.toLocaleString("en-IN")}`,
              },
              {
                label: "Top funds cache",
                value: updatedAgo(metrics!.dataHealth.topFundsUpdatedAt),
              },
            ].map((row) => (
              <div key={row.label} className="flex justify-between gap-4">
                <span className="text-slate-500">{row.label}</span>
                <span className="font-semibold text-right text-slate-900 dark:text-slate-100">
                  {row.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="surface-card border-none shadow-sm">
          <CardHeader>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <MessageSquare size={18} className="text-teal-600 dark:text-teal-400" />
              Feedback inbox
            </CardTitle>
            <CardDescription>
              <Link href="/admin/feedback" className="text-teal-700 dark:text-teal-300 hover:underline">
                Open triage
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "New", value: metrics!.inbox.newCount },
                { label: "In review", value: metrics!.inbox.underReviewCount },
                { label: "Open bugs", value: metrics!.inbox.openBugs },
                { label: "Open data issues", value: metrics!.inbox.openData },
              ].map((row) => (
                <div key={row.label} className="rounded-lg bg-slate-50 dark:bg-slate-800/60 px-3 py-2">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">
                    {row.label}
                  </p>
                  <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-50">
                    {row.value}
                  </p>
                </div>
              ))}
            </div>
            {metrics!.inbox.recent.length === 0 ? (
              <p className="text-sm text-slate-400">No open feedback.</p>
            ) : (
              <ul className="space-y-2">
                {metrics!.inbox.recent.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3 text-xs">
                    <span className="text-slate-700 dark:text-slate-200 min-w-0">
                      <span className="font-semibold text-slate-500 mr-2">
                        {CATEGORY_META[item.category].label}
                      </span>
                      {item.title}
                    </span>
                    <span className="text-slate-400 whitespace-nowrap">{fmtDate(item.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="surface-card border-none shadow-sm">
        <CardHeader className="space-y-3">
          <CardTitle className="font-heading text-lg">Users</CardTitle>
          <div className="flex flex-wrap gap-2">
            {USER_FILTERS.map((item) => (
              <button
                key={item.id || "all"}
                type="button"
                onClick={() => {
                  setFilter(item.id);
                  load(q, item.id);
                }}
                className={`rounded-full px-3 py-1 text-xs font-semibold border transition-colors ${
                  filter === item.id
                    ? "border-teal-500 bg-teal-50 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200"
                    : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              load(q, filter);
            }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search name or email"
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="outline" disabled={loading}>
              Search
            </Button>
          </form>
        </CardHeader>
        <CardContent className="table-scroll overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[960px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="py-2 pr-3">User</th>
                <th className="py-2 pr-3">Joined</th>
                <th className="py-2 pr-3">Last login</th>
                <th className="py-2 pr-3">Portfolio</th>
                <th className="py-2 pr-3">Updated</th>
                <th className="py-2 pr-3">Consent</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100 dark:border-slate-800/80">
                  <td className="py-3 pr-3">
                    <div className="font-medium text-slate-900 dark:text-slate-100">
                      {u.name || "—"}
                    </div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                    {u.role === "ADMIN" && (
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        Admin
                      </Badge>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-xs text-slate-500 whitespace-nowrap">
                    {fmtDate(u.createdAt)}
                  </td>
                  <td className="py-3 pr-3 text-xs text-slate-500 whitespace-nowrap">
                    {fmtDate(u.lastLoginAt)}
                  </td>
                  <td className="py-3 pr-3 text-xs">
                    {u.hasPortfolio ? (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {u.holdingCount} fund{u.holdingCount === 1 ? "" : "s"}
                      </span>
                    ) : (
                      <span className="text-slate-400">Empty</span>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-xs text-slate-500 whitespace-nowrap">
                    {fmtDate(u.portfolioUpdatedAt)}
                  </td>
                  <td className="py-3 pr-3 text-xs">
                    {u.consentGiven ? (
                      <span className="text-emerald-600 dark:text-emerald-400">Yes</span>
                    ) : (
                      <span className="text-slate-400">No</span>
                    )}
                  </td>
                  <td className="py-3 pr-3">
                    {u.disabledAt ? (
                      <Badge variant="outline" className="text-rose-600 border-rose-300">
                        Disabled
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                        Active
                      </Badge>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.disabledAt ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === u.id}
                          onClick={() =>
                            runOp(u.id, "enable", `Re-enable ${u.email}?`)
                          }
                        >
                          <CheckCircle size={12} className="mr-1" /> Enable
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={busyId === u.id}
                          onClick={() =>
                            runOp(u.id, "disable", `Disable ${u.email}? They will not be able to sign in.`)
                          }
                        >
                          <Ban size={12} className="mr-1" /> Disable
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === u.id}
                        onClick={() =>
                          runOp(
                            u.id,
                            "force_password_reset",
                            `Send password reset email to ${u.email}?`
                          )
                        }
                      >
                        <KeyRound size={12} className="mr-1" /> Reset
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId === u.id}
                        onClick={() =>
                          runOp(u.id, "revoke_sessions", `Revoke all sessions for ${u.email}?`)
                        }
                      >
                        <LogOut size={12} className="mr-1" /> Sessions
                      </Button>
                      {u.role !== "ADMIN" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          disabled={busyId === u.id}
                          onClick={() =>
                            runOp(
                              u.id,
                              "delete",
                              `Permanently delete ${u.email} and all their portfolio data? This cannot be undone.`
                            )
                          }
                        >
                          <Trash2 size={12} className="mr-1" /> Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-sm">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="surface-card border-none shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Audit log</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(metrics!.auditLog || []).length === 0 && (
            <p className="text-sm text-slate-400">No admin actions yet.</p>
          )}
          {metrics!.auditLog.map((log) => (
            <div
              key={log.id}
              className="flex flex-wrap gap-x-3 gap-y-1 text-xs border-b border-slate-100 dark:border-slate-800 py-2"
            >
              <span className="text-slate-400 tabular-nums">{fmtDate(log.createdAt)}</span>
              <span className="font-medium text-slate-700 dark:text-slate-200">
                {log.actor.email || log.actor.name || "admin"}
              </span>
              <span className="text-teal-600 dark:text-teal-400">{log.action}</span>
              {log.targetUserId && (
                <span className="text-slate-500 font-mono truncate max-w-[12rem]">
                  {log.targetUserId.slice(0, 8)}…
                </span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
