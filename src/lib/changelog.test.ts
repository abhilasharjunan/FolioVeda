import { describe, expect, it } from "vitest";
import { CHANGELOG } from "./changelog";
import packageJson from "../../package.json";

describe("CHANGELOG", () => {
  it("has a current release matching package.json", () => {
    expect(CHANGELOG.length).toBeGreaterThan(0);
    expect(CHANGELOG[0].version).toBe(packageJson.version);
    expect(CHANGELOG[0].items.length).toBeGreaterThan(0);
  });

  it("keeps versions newest-first", () => {
    const versions = CHANGELOG.map((r) => r.version.split(".").map(Number));
    for (let i = 1; i < versions.length; i++) {
      const [aMaj, aMin, aPat] = versions[i - 1];
      const [bMaj, bMin, bPat] = versions[i];
      const cmp =
        aMaj !== bMaj ? aMaj - bMaj : aMin !== bMin ? aMin - bMin : aPat - bPat;
      expect(cmp).toBeGreaterThan(0);
    }
  });
});
