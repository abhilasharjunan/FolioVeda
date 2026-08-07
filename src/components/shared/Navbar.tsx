"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { TrendingUp, LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const primaryLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/funds/compare", label: "Compare" },
  { href: "/top-funds", label: "Top Funds" },
  { href: "/risk-analysis", label: "Fund Ratings" },
  { href: "/tools/sip-calculator", label: "SIP Calculator" },
  { href: "/about", label: "About" },
];

const publicLinks = [
  { href: "/tools/sip-calculator", label: "SIP Calculator" },
  { href: "/about", label: "About" },
];

const portfolioSubLinks = [
  { href: "/portfolio", label: "Holdings" },
  { href: "/portfolio/risk", label: "Risk" },
  { href: "/portfolio/overlap", label: "Overlap" },
  { href: "/portfolio/report", label: "Report" },
];

/** Longest-matching href wins so /portfolio and /portfolio/risk don't both highlight. */
function getActiveHref(pathname: string, hrefs: string[]): string | null {
  let best: string | null = null;
  for (const href of hrefs) {
    const matches =
      pathname === href ||
      (href !== "/" && pathname.startsWith(`${href}/`));
    if (matches && (best === null || href.length > best.length)) {
      best = href;
    }
  }
  return best;
}

function navButtonClass(active: boolean) {
  return `px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
    active
      ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
  }`;
}

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (pathname === "/" || pathname.startsWith("/auth")) return null;

  const isAuthenticated = status === "authenticated" && !!session;
  const links = isAuthenticated ? primaryLinks : publicLinks;
  const activePrimary = getActiveHref(
    pathname,
    links.map((l) => l.href)
  );
  const showPortfolioSub =
    isAuthenticated && pathname.startsWith("/portfolio");
  // Sub-nav uses exact path matches only so Holdings (/portfolio) never
  // stays highlighted on /portfolio/risk, /portfolio/overlap, etc.
  const activeSub = showPortfolioSub
    ? (portfolioSubLinks.find((l) => pathname === l.href)?.href ?? null)
    : null;

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/auth/signin");
  };

  const brandHome = isAuthenticated ? "/dashboard" : "/";

  return (
    <nav className="print:hidden sticky top-0 z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center justify-between h-14">
        <div
          onClick={() => router.push(brandHome)}
          className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-slate-50 cursor-pointer shrink-0 font-heading"
        >
          <TrendingUp className="text-blue-600" size={20} />
          <span className="hidden sm:inline">
            Folio<span className="text-blue-600">Veda</span>
          </span>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar">
          {links.map((link) => (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              className={navButtonClass(activePrimary === link.href)}
            >
              {link.label}
            </button>
          ))}
          <ThemeToggle />
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 transition-colors ml-1"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : (
            <button
              onClick={() => router.push("/auth/signin")}
              className="px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors ml-1 whitespace-nowrap"
            >
              Sign in
            </button>
          )}
        </div>
      </div>

      {showPortfolioSub && (
        <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60">
          <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center gap-1 h-10 overflow-x-auto no-scrollbar">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mr-1 shrink-0">
              Portfolio
            </span>
            {portfolioSubLinks.map((link) => (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                className={navButtonClass(activeSub === link.href)}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
