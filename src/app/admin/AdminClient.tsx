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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FadeIn } from "@/components/animations";
import { toast } from "sonner";

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
  signupsByDay: { date: string; count: number }[];
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

export default function AdminClient() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (search = q) => {
    setLoading(true);
    setError(null);
    try {
      const [mRes, uRes] = await Promise.all([
        fetch("/api/admin/metrics"),
        fetch(`/api/admin/users?q=${encodeURIComponent(search)}`),
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
  }, [q]);

  useEffect(() => {
    load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runOp = async (
    userId: string,
    action: "disable" | "enable" | "force_password_reset" | "revoke_sessions",
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
      if (data.user) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? data.user : u)));
      }
      const mRes = await fetch("/api/admin/metrics");
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
        </header>
      </FadeIn>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Accounts", value: k.totalAccounts, icon: Users },
          { label: "Signups 7d", value: k.signups7d, icon: UserPlus },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1 h-24">
            {metrics!.signupsByDay.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                <div
                  className="w-full max-w-[14px] rounded-t bg-teal-600/80 dark:bg-teal-500/70"
                  style={{ height: `${Math.max(4, (d.count / maxDay) * 100)}%` }}
                  title={`${d.date}: ${d.count}`}
                />
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Hover bars in a full chart later — counts in tooltip via title.</p>
        </CardContent>
      </Card>

      <Card className="surface-card border-none shadow-sm">
        <CardHeader className="space-y-3">
          <CardTitle className="font-heading text-lg">Users</CardTitle>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              load(q);
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
        <CardContent className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="py-2 pr-3">User</th>
                <th className="py-2 pr-3">Joined</th>
                <th className="py-2 pr-3">Last login</th>
                <th className="py-2 pr-3">Portfolio</th>
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
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
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
