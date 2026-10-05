export const ONBOARDING_STORAGE_KEY = "folioveda.onboarding.v1";

export type OnboardingStepId =
  | "holdings"
  | "risk"
  | "overlap"
  | "compare"
  | "report";

export type OnboardingState = {
  completed: Partial<Record<OnboardingStepId, boolean>>;
  welcomeDismissed: boolean;
  checklistDismissed: boolean;
};

const DEFAULT_STATE: OnboardingState = {
  completed: {},
  welcomeDismissed: false,
  checklistDismissed: false,
};

export function readOnboardingState(): OnboardingState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return {
      ...DEFAULT_STATE,
      ...parsed,
      completed: { ...DEFAULT_STATE.completed, ...parsed.completed },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function writeOnboardingState(next: OnboardingState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(next));
}

export function markOnboardingStep(step: OnboardingStepId) {
  const current = readOnboardingState();
  writeOnboardingState({
    ...current,
    completed: { ...current.completed, [step]: true },
  });
}

export function onboardingProgress(state: OnboardingState): { done: number; total: number } {
  const steps: OnboardingStepId[] = ["holdings", "risk", "overlap", "compare", "report"];
  const done = steps.filter((s) => state.completed[s]).length;
  return { done, total: steps.length };
}

/** Map app routes to checklist steps (client-side visit tracking). */
export function onboardingStepForPath(pathname: string): OnboardingStepId | null {
  if (pathname === "/portfolio/risk" || pathname.startsWith("/portfolio/risk/")) return "risk";
  if (pathname === "/portfolio/overlap" || pathname.startsWith("/portfolio/overlap/")) return "overlap";
  if (pathname === "/funds/compare" || pathname.startsWith("/funds/compare")) return "compare";
  if (pathname === "/portfolio/report" || pathname.startsWith("/portfolio/report")) return "report";
  if (pathname === "/portfolio" || pathname.startsWith("/portfolio/")) return null;
  return null;
}
