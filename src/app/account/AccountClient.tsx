"use client";

import React, { useCallback, useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Calendar,
  Clock,
  Shield,
  Lock,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

type AccountUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: string;
  lastLoginAt: string | null;
  consentGiven: boolean;
  consentDate: string | null;
};

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(iso));
}

export default function AccountClient() {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdDone, setPwdDone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/account");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load account");
      setUser(data.user);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load account");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdDone(false);

    if (newPassword !== confirmPassword) {
      setPwdError("New passwords do not match");
      return;
    }

    setPwdLoading(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not update password");
      setPwdDone(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      // Password change bumps sessionVersion — re-auth required
      setTimeout(() => {
        void signOut({ callbackUrl: "/auth/signin" });
      }, 1500);
    } catch (err) {
      setPwdError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setPwdLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-slate-500">
        <Loader2 className="animate-spin mr-2" size={18} /> Loading account…
      </div>
    );
  }

  if (loadError || !user) {
    return (
      <div className="max-w-lg mx-auto p-6 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
        <AlertTriangle size={16} /> {loadError || "Account not found"}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-50 font-heading">
          Account
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Your profile details and password settings
        </p>
      </div>

      <Card className="surface-card border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <User className="text-teal-600 dark:text-teal-400" size={18} />
            Profile
          </CardTitle>
          <CardDescription>Signed-in account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                <User size={10} /> Name
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                {user.name || "—"}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                <Mail size={10} /> Email
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5 break-all">
                {user.email}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                <Calendar size={10} /> Member since
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                {formatDate(user.createdAt)}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                <Clock size={10} /> Last login
              </p>
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5">
                {formatDate(user.lastLoginAt)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge variant="outline" className="font-normal gap-1">
              <Shield size={12} />
              {user.role === "ADMIN" ? "Admin" : "User"}
            </Badge>
            {user.consentGiven && (
              <Badge variant="secondary" className="font-normal">
                Consent recorded
                {user.consentDate ? ` · ${formatDate(user.consentDate)}` : ""}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="surface-card border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-heading flex items-center gap-2">
            <Lock className="text-teal-600 dark:text-teal-400" size={18} />
            Change password
          </CardTitle>
          <CardDescription>
            Enter your current password, then choose a new one (min. 8 characters)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                Current password
              </label>
              <Input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                New password
              </label>
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">
                Confirm new password
              </label>
              <Input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>

            {pwdError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-lg text-xs text-red-700 dark:text-red-400 flex items-center gap-2 border border-red-100 dark:border-red-900/50">
                <AlertTriangle size={14} /> {pwdError}
              </div>
            )}
            {pwdDone && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2 border border-emerald-100 dark:border-emerald-900/50">
                <CheckCircle2 size={14} /> Password updated — signing you in again…
              </div>
            )}

            <Button
              type="submit"
              disabled={pwdLoading || !currentPassword || !newPassword || !confirmPassword}
              className="bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white"
            >
              {pwdLoading ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" /> Updating…
                </>
              ) : (
                "Update password"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
