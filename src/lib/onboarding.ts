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

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  completed: {},
  welcomeDismissed: false,
  checklistDismissed: false,
};

/** Stable snapshot for useSyncExternalStore — new object refs cause infinite re-renders. */
let cachedRaw: string | null | undefined = undefined;
let cachedState: OnboardingState = DEFAULT_ONBOARDING_STATE;

function parseOnboardingState(raw: string | null): OnboardingState {
  if (!raw) return DEFAULT_ONBOARDING_STATE;
  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return {
      ...DEFAULT_ONBOARDING_STATE,
      ...parsed,
      completed: { ...DEFAULT_ONBOARDING_STATE.completed, ...parsed.completed },
    };
  } catch {
    return DEFAULT_ONBOARDING_STATE;
  }
}

export function readOnboardingState(): OnboardingState {
  if (typeof window === "undefined") return DEFAULT_ONBOARDING_STATE;
  try {
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (raw === cachedRaw) return cachedState;
    cachedRaw = raw;
    cachedState = parseOnboardingState(raw);
    return cachedState;
  } catch {
    cachedRaw = undefined;
    cachedState = DEFAULT_ONBOARDING_STATE;
    return DEFAULT_ONBOARDING_STATE;
  }
}

export function getServerOnboardingSnapshot(): OnboardingState {
  return DEFAULT_ONBOARDING_STATE;
}

export function writeOnboardingState(next: OnboardingState) {
  if (typeof window === "undefined") return;
  const serialized = JSON.stringify(next);
  localStorage.setItem(ONBOARDING_STORAGE_KEY, serialized);
  cachedRaw = serialized;
  cachedState = next;
}

export function markOnboardingStep(step: OnboardingStepId) {
  const current = readOnboardingState();
  if (current.completed[step]) return;
  writeOnboardingState({
    ...current,
    completed: { ...current.completed, [step]: true },
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("folioveda-onboarding"));
  }
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
