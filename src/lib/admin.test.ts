import { describe, it, expect, afterEach } from "vitest";
import { isAdminEmail, parseAdminEmails } from "@/lib/admin";

describe("admin helpers", () => {
  const prev = process.env.ADMIN_EMAILS;

  afterEach(() => {
    if (prev === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = prev;
  });

  it("parses ADMIN_EMAILS allowlist", () => {
    process.env.ADMIN_EMAILS = " Admin@X.com , other@y.com ";
    expect(parseAdminEmails().has("admin@x.com")).toBe(true);
    expect(isAdminEmail("ADMIN@x.com")).toBe(true);
    expect(isAdminEmail("nope@z.com")).toBe(false);
  });
});
