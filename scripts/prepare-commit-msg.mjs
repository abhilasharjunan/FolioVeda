#!/usr/bin/env node
/**
 * prepare-commit-msg hook body (tracked in-repo).
 * Bumps package.json and prepends a Version History entry for user-visible commits.
 *
 * Files are written here; `post-commit` amends once so they land in the same commit
 * (plain `git add` during prepare-commit-msg is too late for the commit index).
 *
 * Install / refresh local hooks:
 *   node scripts/install-git-hooks.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pendingPath = path.join(root, ".git", "FOLIOVEDA_VERSION_PENDING");

// Skip when post-commit is amending to attach the bump.
if (process.env.FOLIOVEDA_AMENDING === "1") {
  process.exit(0);
}

const commitMsgFile = process.argv[2];
if (!commitMsgFile) {
  process.exit(0);
}

const raw = fs.readFileSync(commitMsgFile, "utf8");
const commitMsg = raw
  .split(/\r?\n/)
  .map((l) => l.trimEnd())
  .find((l) => l.trim() && !l.trim().startsWith("#"))
  ?.trim();

if (!commitMsg || commitMsg.startsWith("Merge")) {
  process.exit(0);
}

const packageJsonPath = path.join(root, "package.json");
const changelogPath = path.join(root, "src/lib/changelog-data.json");

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
const currentVersion = packageJson.version;
const [major, minor, patch] = currentVersion.split(".").map(Number);

let newMajor = major;
let newMinor = minor;
let newPatch = patch;

if (/^(BREAKING CHANGE|[a-z]+(\(.*\))?!:)/.test(commitMsg)) {
  newMajor = major + 1;
  newMinor = 0;
  newPatch = 0;
} else if (/^feat(\(.*\))?:/.test(commitMsg)) {
  newMinor = minor + 1;
  newPatch = 0;
} else {
  newPatch = patch + 1;
}

const newVersion = `${newMajor}.${newMinor}.${newPatch}`;
packageJson.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + "\n");

/** Skip noisy version-only chores from Version History. */
function shouldSkipChangelog(msg) {
  return /^(chore|docs)(\(.*\))?:\s*(bump|sync).*\bversion\b/i.test(msg);
}

function humanizeCommit(msg) {
  const stripped = msg
    .replace(/^(BREAKING CHANGE:\s*|[a-z]+(\([^)]*\))?!?:\s*)/i, "")
    .trim();
  if (!stripped) return msg;
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

function changelogDate(d = new Date()) {
  return d.toLocaleString("en-US", { month: "short", year: "numeric" });
}

let changelogUpdated = false;
if (!shouldSkipChangelog(commitMsg) && fs.existsSync(changelogPath)) {
  const changelog = JSON.parse(fs.readFileSync(changelogPath, "utf8"));
  const item = humanizeCommit(commitMsg);

  if (Array.isArray(changelog) && item) {
    if (changelog[0]?.version === newVersion) {
      if (!changelog[0].items.includes(item)) {
        changelog[0].items.unshift(item);
        changelogUpdated = true;
      }
    } else {
      changelog.unshift({
        version: newVersion,
        date: changelogDate(),
        items: [item],
      });
      changelogUpdated = true;
    }
    if (changelogUpdated) {
      fs.writeFileSync(changelogPath, JSON.stringify(changelog, null, 2) + "\n");
    }
  }
}

fs.writeFileSync(
  pendingPath,
  JSON.stringify({
    from: currentVersion,
    to: newVersion,
    files: ["package.json", ...(changelogUpdated ? ["src/lib/changelog-data.json"] : [])],
  }) + "\n"
);

console.log(`✓ Version bumped: ${currentVersion} → ${newVersion}`);
process.exit(0);
