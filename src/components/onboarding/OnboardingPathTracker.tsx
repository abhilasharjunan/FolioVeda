"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { markOnboardingStep, onboardingStepForPath } from "@/lib/onboarding";

/** Marks checklist steps when the user visits key routes while signed in. */
export function OnboardingPathTracker() {
  const pathname = usePathname();
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    const step = onboardingStepForPath(pathname);
    if (step) markOnboardingStep(step);
  }, [pathname, status]);

  return null;
}
