"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  MessageSquareHeart,
  Search,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/animations";
import { cn } from "@/lib/utils";
import {
  CATEGORY_META,
  FEEDBACK_CATEGORIES,
  FEEDBACK_STATUSES,
  IMPACT_LABELS,
  MOOD_LABELS,
  STATUS_META,
} from "@/lib/feedback";

type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];
type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

type AdminFeedbackItem = {
  id: string;
  category: FeedbackCategory;
  title: string;
  body: string;
  impact: number;
  mood: number;
  status: FeedbackStatus;
  adminNote: string | null;
  voteCount: number;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string | null; email: string };
  decidedBy: { name: string | null; email: string | null } | null;
};

const STATUS_ACTIONS: { status: FeedbackStatus; label: string }[] = [
  { status: "UNDER_REVIEW", label: "Review" },
  { status: "PLANNED", label: "Plan it" },
  { status: "IN_PROGRESS", label: "Start work" },
  { status: "DONE", label: "Done" },
  { status: "DECLINED", label: "Won’t do" },
  { status: "NEW", label: "Reset to new" },
];

function toneClass(tone: (typeof STATUS_META)[FeedbackStatus]["tone"]) {
  switch (tone) {
    case "good":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "info":
      return "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300";
    case "warn":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
    case "bad":
      return "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
}

export default function AdminFeedbackClient() {
  const [items, setItems] = useState<AdminFeedbackItem[]>([]);
  const [byStatus, setByStatus] = useState<Record<FeedbackStatus, number> | null>(null);
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<FeedbackCategory | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [appliedQ, setAppliedQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);
      if (appliedQ.trim()) params.set("q", appliedQ.trim());
      const res = await fetch(`/api/admin/feedback?${params}`);
      if (res.status === 403) {
        setError("Admin access required.");
        setItems([]);
        return;
      }
      if (!res.ok) throw new Error("Failed to load feedback");
      const data = await res.json();
      setItems(data.items || []);
      setByStatus(data.byStatus || null);
      const noteMap: Record<string, string> = {};
      for (const item of data.items || []) {
        noteMap[item.id] = item.adminNote || "";
      }
      setNotes(noteMap);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, appliedQ]);

  useEffect(() => {
    load();
  }, [load]);

  const patchItem = async (
    id: string,
    patch: { status?: FeedbackStatus; adminNote?: string | null }
  ) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");
      setItems((prev) => prev.map((it) => (it.id === id ? data.item : it)));
      toast.success(
        patch.status
          ? `Marked as ${STATUS_META[patch.status].label}`
          : "Note saved"
      );
      // refresh counts
      const mRes = await fetch("/api/admin/feedback");
      if (mRes.ok) {
        const m = await mRes.json();
        setByStatus(m.byStatus || null);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  if (loading && !byStatus) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-teal-600" size={28} />
      </div>
    );
  }

  if (error && !byStatus) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-3">
        <Shield className="mx-auto text-slate-400" size={32} />
        <h1 className="text-xl font-bold font-heading">Feedback triage</h1>
        <p className="text-sm text-slate-500">{error}</p>
        <Link href="/admin" className="text-sm text-teal-600 hover:underline">
          Back to admin
        </Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:p-6 space-y-6 max-w-5xl mx-auto">
      <FadeIn>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-teal-600"
            >
              <ArrowLeft size={14} /> Admin
            </Link>
            <div className="flex items-center gap-2">
              <MessageSquareHeart className="text-teal-600 dark:text-teal-400" size={22} />
              <h1 className="text-2xl sm:text-3xl font-bold font-heading text-slate-900 dark:text-slate-50">
                Feedback triage
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Collect ideas, decide what to work on, and leave a short note for context.
            </p>
          </div>
          <Link href="/feedback">
            <Button variant="outline" size="sm">
              Open user board
            </Button>
          </Link>
        </div>
      </FadeIn>

      {byStatus && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {FEEDBACK_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter((prev) => (prev === s ? "ALL" : s))}
              className={cn(
                "rounded-xl border p-3 text-left transition-colors",
                statusFilter === s
                  ? "border-teal-500 bg-teal-50/80 dark:bg-teal-950/30"
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
              )}
            >
              <p className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold">
                {STATUS_META[s].label}
              </p>
              <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                {byStatus[s] ?? 0}
              </p>
            </button>
          ))}
        </div>
      )}

      <form
        className="flex flex-col sm:flex-row gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setAppliedQ(q);
        }}
      >
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title or details…"
            className="pl-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) =>
            setCategoryFilter(e.target.value as FeedbackCategory | "ALL")
          }
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="ALL">All categories</option>
          {FEEDBACK_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_META[c].label}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline">
          Apply
        </Button>
      </form>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="animate-spin text-teal-600" size={24} />
        </div>
      ) : items.length === 0 ? (
        <Card className="surface-card border-none shadow-sm">
          <CardContent className="p-10 text-center text-sm text-slate-500">
            No feedback matches these filters.
          </CardContent>
        </Card>
      ) : (
        <StaggerChildren className="space-y-4" stagger={0.03}>
          {items.map((item) => (
            <StaggerItem key={item.id}>
              <Card className="surface-card border-none shadow-sm">
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap gap-2 items-center">
                        <span
                          className={cn(
                            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                            toneClass(STATUS_META[item.status].tone)
                          )}
                        >
                          {STATUS_META[item.status].label}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {CATEGORY_META[item.category].label}
                        </Badge>
                        <span className="text-[10px] text-slate-400">
                          {item.voteCount} votes · impact {IMPACT_LABELS[item.impact - 1]} ·{" "}
                          {MOOD_LABELS[item.mood - 1]}
                        </span>
                      </div>
                      <h2 className="text-base sm:text-lg font-bold font-heading text-slate-900 dark:text-slate-50">
                        {item.title}
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
                        {item.body}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        From {item.user.name || "User"} ({item.user.email}) ·{" "}
                        {new Date(item.createdAt).toLocaleString("en-IN")}
                        {item.decidedBy && (
                          <>
                            {" "}
                            · Last decision by{" "}
                            {item.decidedBy.name || item.decidedBy.email}
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      htmlFor={`admin-note-${item.id}`}
                      className="text-[10px] uppercase tracking-wide font-semibold text-slate-500"
                    >
                      Admin note
                    </label>
                    <textarea
                      id={`admin-note-${item.id}`}
                      value={notes[item.id] ?? ""}
                      onChange={(e) =>
                        setNotes((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      rows={2}
                      placeholder="Why plan / decline / defer…"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={busyId === item.id}
                      onClick={() =>
                        patchItem(item.id, {
                          adminNote: (notes[item.id] || "").trim() || null,
                        })
                      }
                    >
                      Save note
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {STATUS_ACTIONS.filter((a) => a.status !== item.status).map((a) => (
                      <Button
                        key={a.status}
                        size="sm"
                        variant={
                          a.status === "PLANNED" || a.status === "IN_PROGRESS"
                            ? "default"
                            : "outline"
                        }
                        disabled={busyId === item.id}
                        className={
                          a.status === "PLANNED" || a.status === "IN_PROGRESS"
                            ? "bg-teal-600 hover:bg-teal-500 text-white"
                            : a.status === "DECLINED"
                              ? "text-rose-600 border-rose-200 hover:bg-rose-50"
                              : undefined
                        }
                        onClick={() =>
                          patchItem(item.id, {
                            status: a.status,
                            adminNote: (notes[item.id] || "").trim() || undefined,
                          })
                        }
                      >
                        {busyId === item.id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          a.label
                        )}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </StaggerItem>
          ))}
        </StaggerChildren>
      )}
    </div>
  );
}
