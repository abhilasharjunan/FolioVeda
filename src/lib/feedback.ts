export const FEEDBACK_CATEGORIES = [
  "IDEA",
  "BUG",
  "UX",
  "DATA",
  "OTHER",
] as const;

export const FEEDBACK_STATUSES = [
  "NEW",
  "UNDER_REVIEW",
  "PLANNED",
  "IN_PROGRESS",
  "DONE",
  "DECLINED",
] as const;

export type FeedbackCategory = (typeof FEEDBACK_CATEGORIES)[number];
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export const CATEGORY_META: Record<
  FeedbackCategory,
  { label: string; blurb: string; accent: string }
> = {
  IDEA: {
    label: "Feature idea",
    blurb: "Something new you’d love to see",
    accent: "indigo",
  },
  BUG: {
    label: "Bug",
    blurb: "Something broken or unexpected",
    accent: "rose",
  },
  UX: {
    label: "UX polish",
    blurb: "Clarity, flow, or delight",
    accent: "teal",
  },
  DATA: {
    label: "Data / accuracy",
    blurb: "NAV, returns, holdings, or labels",
    accent: "amber",
  },
  OTHER: {
    label: "Other",
    blurb: "Anything else on your mind",
    accent: "slate",
  },
};

export const STATUS_META: Record<
  FeedbackStatus,
  { label: string; tone: "neutral" | "info" | "good" | "warn" | "bad" }
> = {
  NEW: { label: "New", tone: "info" },
  UNDER_REVIEW: { label: "Under review", tone: "neutral" },
  PLANNED: { label: "Planned", tone: "good" },
  IN_PROGRESS: { label: "In progress", tone: "info" },
  DONE: { label: "Done", tone: "good" },
  DECLINED: { label: "Won’t do", tone: "bad" },
};

export const IMPACT_LABELS = ["Nice to have", "Useful", "Important", "High impact", "Critical"] as const;
export const MOOD_LABELS = ["Frustrated", "Meh", "Okay", "Happy", "Delighted"] as const;
