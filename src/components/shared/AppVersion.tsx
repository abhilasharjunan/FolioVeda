import Link from 'next/link';
import { getBuildInfo } from '@/lib/build-info';

export function AppVersion({ linkToAbout = true }: { linkToAbout?: boolean }) {
  const { version } = getBuildInfo();
  const label = `v${version}`;

  if (linkToAbout) {
    return (
      <Link
        href="/about"
        className="font-mono text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        title="View deployment details"
      >
        {label}
      </Link>
    );
  }

  return <span className="font-mono text-slate-400">{label}</span>;
}
