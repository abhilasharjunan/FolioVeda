"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bug,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Loader2,
  MessageSquareHeart,
  Palette,
  Send,
  Sparkles,
  ThumbsUp,
  Database,
  CircleDot,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { FadeIn, ScaleIn, StaggerChildren, StaggerItem, AnimatedNumber } from "@/components/animations";
import { cn } from "@/lib/utils";
import {
  CATEGORY_META,
  FEEDBACK_CATEGORIES,
  IMPACT_LABELS,
  MOOD_LABELS,
  STATUS_META,
} from "@/lib/feedback";

type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];
type FeedbackStatus = keyof typeof STATUS_META;

type BoardItem = {
  id: string;
  category: FeedbackCategory;
  title: string;
  body: string;
  impact: number;
  mood: number;
  status: FeedbackStatus;
  voteCount: number;
  createdAt: string;
  authorName: string;
  votedByMe: boolean;
};

type Step = "category" | "feel" | "details" | "done";

const CAT_ICONS: Record<FeedbackCategory, React.ElementType> = {
  IDEA: Lightbulb,
  BUG: Bug,
  UX: Palette,
  DATA: Database,
  OTHER: CircleDot,
};

const MOOD_FACES = ["😣", "😐", "🙂", "😊", "🤩"] as const;

export default function FeedbackPage() {
  const reduce = useReducedMotion();
  const [view, setView] = useState<"compose" | "board">("compose");
  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState<FeedbackCategory | null>(null);
  const [impact, setImpact] = useState(3);
  const [mood, setMood] = useState(3);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [board, setBoard] = useState<BoardItem[]>([]);
  const [boardLoading, setBoardLoading] = useState(false);
  const [boardFilter, setBoardFilter] = useState<"ALL" | FeedbackCategory>("ALL");
  const [voteBusy, setVoteBusy] = useState<string | null>(null);

  const loadBoard = useCallback(async () => {
    setBoardLoading(true);
    try {
      const qs =
        boardFilter === "ALL" ? "" : `?category=${encodeURIComponent(boardFilter)}`;
      const res = await fetch(`/api/feedback${qs}`);
      if (!res.ok) throw new Error("Failed to load board");
      const data = await res.json();
      setBoard(data.items || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load ideas");
    } finally {
      setBoardLoading(false);
    }
  }, [boardFilter]);

  useEffect(() => {
    if (view === "board") loadBoard();
  }, [view, loadBoard]);

  const canContinueFeel = !!category;
  const canSubmit =
    title.trim().length >= 4 && body.trim().length >= 10 && !!category;

  const stepIndex = useMemo(() => {
    const order: Step[] = ["category", "feel", "details", "done"];
    return order.indexOf(step);
  }, [step]);

  const resetCompose = () => {
    setStep("category");
    setCategory(null);
    setImpact(3);
    setMood(3);
    setTitle("");
    setBody("");
  };

  const submit = async () => {
    if (!category || !canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, title: title.trim(), body: body.trim(), impact, mood }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submit failed");
      setStep("done");
      toast.success("Thanks — your feedback is with the team");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleVote = async (id: string) => {
    setVoteBusy(id);
    try {
      const res = await fetch(`/api/feedback/${id}/vote`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Vote failed");
      setBoard((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, votedByMe: data.voted, voteCount: data.voteCount }
            : item
        )
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Vote failed");
    } finally {
      setVoteBusy(null);
    }
  };

  return (
    <div className="px-4 py-6 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <FadeIn>
        <header className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-slate-900 p-6 sm:p-8 text-white">
          <Sparkles className="absolute -right-4 -top-4 text-white/10" size={140} strokeWidth={1} />
          <div className="relative flex items-center gap-2 text-teal-100 font-semibold text-sm uppercase tracking-wider">
            <MessageSquareHeart size={16} />
            <span>Your voice</span>
          </div>
          <h1 className="relative text-3xl sm:text-4xl font-bold tracking-tight mt-2 font-heading">
            Feedback
          </h1>
          <p className="relative text-teal-100 max-w-xl mt-2 text-sm sm:text-base">
            Tell us what to build next, what feels off, or what delighted you. Votes help the
            team prioritize.
          </p>
          <div className="relative mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setView("compose")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
                view === "compose"
                  ? "bg-white text-teal-800"
                  : "bg-white/10 text-teal-50 hover:bg-white/20"
              )}
            >
              Share feedback
            </button>
            <button
              type="button"
              onClick={() => setView("board")}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
                view === "board"
                  ? "bg-white text-teal-800"
                  : "bg-white/10 text-teal-50 hover:bg-white/20"
              )}
            >
              Community board
            </button>
          </div>
        </header>
      </FadeIn>

      {view === "compose" && (
        <>
          <div className="flex items-center gap-2 px-1">
            {(["category", "feel", "details", "done"] as Step[]).map((s, i) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div
                  className={cn(
                    "h-1.5 w-full rounded-full transition-colors",
                    i <= stepIndex ? "bg-teal-500" : "bg-slate-200 dark:bg-slate-800"
                  )}
                />
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === "category" && (
              <motion.div
                key="category"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-slate-50">
                    What kind of feedback is this?
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">Pick one — you can always refine later.</p>
                </div>
                <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 gap-3" stagger={0.05}>
                  {FEEDBACK_CATEGORIES.map((cat) => {
                    const Icon = CAT_ICONS[cat];
                    const meta = CATEGORY_META[cat];
                    const active = category === cat;
                    return (
                      <StaggerItem key={cat}>
                        <button
                          type="button"
                          onClick={() => setCategory(cat)}
                          className={cn(
                            "w-full text-left rounded-2xl border p-4 transition-all",
                            active
                              ? "border-teal-500 bg-teal-50/80 dark:bg-teal-950/40 shadow-md ring-2 ring-teal-500/30"
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-teal-300"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "p-2 rounded-xl",
                                active
                                  ? "bg-teal-600 text-white"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                              )}
                            >
                              <Icon size={18} />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-slate-50">
                                {meta.label}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">{meta.blurb}</p>
                            </div>
                          </div>
                        </button>
                      </StaggerItem>
                    );
                  })}
                </StaggerChildren>
                <div className="flex justify-end">
                  <Button
                    disabled={!canContinueFeel}
                    onClick={() => setStep("feel")}
                    className="bg-teal-600 hover:bg-teal-500 text-white gap-1"
                  >
                    Continue <ChevronRight size={16} />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "feel" && (
              <motion.div
                key="feel"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-slate-50">
                    How does this feel?
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    A quick pulse helps us sort urgency from nice-to-haves.
                  </p>
                </div>

                <Card className="surface-card border-none shadow-sm">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Mood</p>
                      <span className="text-3xl" aria-hidden>
                        {MOOD_FACES[mood - 1]}
                      </span>
                    </div>
                    <div className="flex justify-between gap-1">
                      {MOOD_FACES.map((face, i) => (
                        <button
                          key={face}
                          type="button"
                          onClick={() => setMood(i + 1)}
                          className={cn(
                            "flex-1 py-2 rounded-xl text-xl transition-transform",
                            mood === i + 1
                              ? "bg-teal-100 dark:bg-teal-950/50 scale-110"
                              : "hover:bg-slate-100 dark:hover:bg-slate-800"
                          )}
                          aria-label={MOOD_LABELS[i]}
                        >
                          {face}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-center text-slate-500">{MOOD_LABELS[mood - 1]}</p>
                  </CardContent>
                </Card>

                <Card className="surface-card border-none shadow-sm">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        Impact on you
                      </p>
                      <Badge variant="outline">{IMPACT_LABELS[impact - 1]}</Badge>
                    </div>
                    <Slider
                      value={[impact]}
                      min={1}
                      max={5}
                      step={1}
                      onValueChange={(v) => setImpact(Array.isArray(v) ? v[0] : v)}
                    />
                    <div className="flex justify-between text-[10px] uppercase tracking-wide text-slate-400">
                      <span>Low</span>
                      <span>Critical</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep("category")} className="gap-1">
                    <ChevronLeft size={16} /> Back
                  </Button>
                  <Button
                    onClick={() => setStep("details")}
                    className="bg-teal-600 hover:bg-teal-500 text-white gap-1"
                  >
                    Continue <ChevronRight size={16} />
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "details" && (
              <motion.div
                key="details"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.22 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-lg font-bold font-heading text-slate-900 dark:text-slate-50">
                    Tell us the story
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Short title + enough detail for the team to act.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="feedback-title" className="text-xs font-medium text-slate-500">Title</label>
                  <Input
                    id="feedback-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, 120))}
                    placeholder="e.g. Export holdings as Excel"
                    className="text-base"
                  />
                  <p className="text-[10px] text-slate-400 text-right tabular-nums">
                    {title.length}/120
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="feedback-body" className="text-xs font-medium text-slate-500">Details</label>
                  <textarea
                    id="feedback-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value.slice(0, 4000))}
                    rows={6}
                    placeholder="What happened, what you expected, or why this idea matters…"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-slate-50 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
                  />
                  <p className="text-[10px] text-slate-400 text-right tabular-nums">
                    {body.length}/4000
                  </p>
                </div>

                <Card className="border-none bg-slate-50 dark:bg-slate-800/50 shadow-none">
                  <CardContent className="p-4 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <p>
                      <span className="font-semibold">Type:</span>{" "}
                      {category ? CATEGORY_META[category].label : "—"}
                    </p>
                    <p>
                      <span className="font-semibold">Mood:</span> {MOOD_LABELS[mood - 1]} ·{" "}
                      <span className="font-semibold">Impact:</span> {IMPACT_LABELS[impact - 1]}
                    </p>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep("feel")} className="gap-1">
                    <ChevronLeft size={16} /> Back
                  </Button>
                  <Button
                    disabled={!canSubmit || submitting}
                    onClick={submit}
                    className="bg-teal-600 hover:bg-teal-500 text-white gap-1.5"
                  >
                    {submitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    Send feedback
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "done" && (
              <motion.div
                key="done"
                initial={reduce ? false : { opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.28 }}
              >
                <ScaleIn>
                  <Card className="border-none shadow-md bg-gradient-to-br from-teal-600 to-slate-900 text-white overflow-hidden relative">
                    <CheckCircle2
                      className="absolute -right-4 -bottom-4 text-white/10"
                      size={140}
                      strokeWidth={1}
                    />
                    <CardContent className="p-8 text-center space-y-3 relative">
                      <p className="text-sm text-teal-100 font-medium">Received</p>
                      <h2 className="text-2xl sm:text-3xl font-bold font-heading">
                        Thank you — that helps
                      </h2>
                      <p className="text-sm text-teal-100 max-w-md mx-auto">
                        Admins will triage this and decide whether to plan it, start work, or pass
                        with a note. You can upvote related ideas on the board.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 pt-3">
                        <Button
                          onClick={() => {
                            resetCompose();
                            setView("board");
                          }}
                          className="bg-white text-teal-800 hover:bg-teal-50"
                        >
                          Open community board
                        </Button>
                        <Button
                          variant="outline"
                          onClick={resetCompose}
                          className="border-white/30 text-white hover:bg-white/10"
                        >
                          Share another
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </ScaleIn>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {view === "board" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setBoardFilter("ALL")}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                boardFilter === "ALL"
                  ? "bg-teal-600 border-teal-600 text-white"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              )}
            >
              All
            </button>
            {FEEDBACK_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setBoardFilter(cat)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                  boardFilter === cat
                    ? "bg-teal-600 border-teal-600 text-white"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                )}
              >
                {CATEGORY_META[cat].label}
              </button>
            ))}
          </div>

          {boardLoading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="animate-spin text-teal-600" size={28} />
            </div>
          ) : board.length === 0 ? (
            <Card className="surface-card border-none shadow-sm">
              <CardContent className="p-10 text-center text-sm text-slate-500">
                No ideas yet — be the first to share one.
              </CardContent>
            </Card>
          ) : (
            <StaggerChildren className="space-y-3" stagger={0.04}>
              {board.map((item) => (
                <StaggerItem key={item.id}>
                  <Card className="surface-card border-none shadow-sm">
                    <CardContent className="p-4 sm:p-5 flex gap-4">
                      <button
                        type="button"
                        disabled={voteBusy === item.id}
                        onClick={() => toggleVote(item.id)}
                        className={cn(
                          "shrink-0 flex flex-col items-center justify-center w-14 rounded-xl border px-2 py-2 transition-colors",
                          item.votedByMe
                            ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300"
                            : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-teal-300"
                        )}
                        aria-label={item.votedByMe ? "Remove vote" : "Upvote"}
                      >
                        <ThumbsUp size={16} />
                        <span className="text-sm font-bold tabular-nums mt-1">
                          <AnimatedNumber value={item.voteCount} decimals={0} />
                        </span>
                      </button>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {CATEGORY_META[item.category].label}
                          </Badge>
                          <Badge
                            variant="secondary"
                            className="text-[10px]"
                          >
                            {STATUS_META[item.status].label}
                          </Badge>
                          <span className="text-[10px] text-slate-400">
                            by {item.authorName}
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-50 font-heading">
                          {item.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">
                          {item.body}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerChildren>
          )}
        </div>
      )}
    </div>
  );
}
