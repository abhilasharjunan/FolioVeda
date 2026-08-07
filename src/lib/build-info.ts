export type BuildInfo = {
  version: string;
  buildTime: string | null;
  gitCommit: string | null;
  gitCommitUrl: string | null;
  environment: string;
};

function readGitCommit(): string | null {
  const sha =
    process.env.NEXT_PUBLIC_GIT_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    '';
  return sha.length > 0 ? sha : null;
}

function readGitCommitUrl(sha: string | null): string | null {
  if (!sha) return null;

  const owner =
    process.env.NEXT_PUBLIC_GIT_REPO_OWNER ||
    process.env.VERCEL_GIT_REPO_OWNER ||
    '';
  const slug =
    process.env.NEXT_PUBLIC_GIT_REPO_SLUG ||
    process.env.VERCEL_GIT_REPO_SLUG ||
    '';

  if (!owner || !slug) return null;
  return `https://github.com/${owner}/${slug}/commit/${sha}`;
}

export function getBuildInfo(): BuildInfo {
  const sha = readGitCommit();

  return {
    version: process.env.NEXT_PUBLIC_APP_VERSION ?? 'unknown',
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME ?? null,
    gitCommit: sha ? sha.slice(0, 7) : null,
    gitCommitUrl: readGitCommitUrl(sha),
    environment:
      process.env.NEXT_PUBLIC_VERCEL_ENV ||
      process.env.VERCEL_ENV ||
      process.env.NODE_ENV ||
      'development',
  };
}

export function formatBuildTime(iso: string | null): string {
  if (!iso) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(iso));
}
