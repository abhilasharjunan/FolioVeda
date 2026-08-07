import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/animations", () => ({
  FadeIn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/components/ui/ThemeToggle", () => ({
  ThemeToggle: () => null,
}));

import { AuthShell } from "./AuthShell";

describe("AuthShell", () => {
  it("links Home, MF Academy, and SIP Calculator", () => {
    render(
      <AuthShell>
        <div>form</div>
      </AuthShell>
    );
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("link", { name: "MF Academy" }).getAttribute("href")).toBe("/academy");
    expect(screen.getByRole("link", { name: "SIP Calculator" }).getAttribute("href")).toBe(
      "/tools/sip-calculator"
    );
  });
});
