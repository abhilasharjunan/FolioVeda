import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA ?? '',
    NEXT_PUBLIC_GIT_REPO_OWNER: process.env.VERCEL_GIT_REPO_OWNER ?? '',
    NEXT_PUBLIC_GIT_REPO_SLUG: process.env.VERCEL_GIT_REPO_SLUG ?? '',
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV ?? '',
  },
};

export default nextConfig;