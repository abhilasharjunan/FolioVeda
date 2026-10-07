#!/usr/bin/env node
/**
 * Attaches package.json / changelog bumps written in prepare-commit-msg
 * into the commit that just completed (one amend, guarded against loops).
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

if (process.env.FOLIOVEDA_AMENDING === "1") {
  process.exit(0);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pendingPath = path.join(root, ".git", "FOLIOVEDA_VERSION_PENDING");

if (!fs.existsSync(pendingPath)) {
  process.exit(0);
}

let pending;
try {
  pending = JSON.parse(fs.readFileSync(pendingPath, "utf8"));
} catch {
  fs.unlinkSync(pendingPath);
  process.exit(0);
}

fs.unlinkSync(pendingPath);

const files = (pending.files || []).filter((f) => fs.existsSync(path.join(root, f)));
if (files.length === 0) {
  process.exit(0);
}

try {
  execSync(`git add ${files.map((f) => `"${f}"`).join(" ")}`, {
    cwd: root,
    stdio: "pipe",
    shell: true,
  });
  execSync("git commit --amend --no-edit", {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, FOLIOVEDA_AMENDING: "1" },
  });
  console.log(`✓ Version ${pending.to} included in commit`);
} catch (err) {
  console.warn("⚠ Could not amend version bump into commit:", err.message || err);
}

process.exit(0);
