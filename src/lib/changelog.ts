import data from "./changelog-data.json";

export type ChangelogRelease = {
  version: string;
  date: string;
  items: string[];
};

/** Product Version History shown on /about — updated by scripts/prepare-commit-msg.mjs. */
export const CHANGELOG: ChangelogRelease[] = data;
