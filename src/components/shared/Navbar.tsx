"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, LogOut, Menu, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const primaryLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/funds/compare", label: "Compare" },
  { href: "/top-funds", label: "Top Funds" },
  { href: "/risk-analysis", label: "Fund Ratings" },
  { href: "/tools/sip-calculator", label: "SIP Calculator" },
  { href: "/academy", label: "MF Academy" },
  { href: "/about", label: "About" },
];

const publicLinks = [
  { href: "/tools/sip-calculator", label: "SIP Calculator" },
  { href: "/academy", label: "MF Academy" },
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

function navLinkClass(active: boolean, block = false) {
  return `${block ? "flex w-full" : "inline-flex"} items-center px-3 py-2.5 md:py-1.5 rounded-lg text-sm font-medium transition-colors ${
    active
      ? "bg-teal-500/15 text-teal-700 dark:bg-teal-400/10 dark:text-teal-300"
      : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-slate-50"
  }`;
}

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  if (pathname === "/" || pathname.startsWith("/auth")) return null;

  const isAuthenticated = status === "authenticated" && !!session;
  const links = isAuthenticated ? primaryLinks : publicLinks;
  const activePrimary = getActiveHref(
    pathname,
    links.map((l) => l.href)
  );
  const showPortfolioSub =
    isAuthenticated && pathname.startsWith("/portfolio");
  const activeSub = showPortfolioSub
    ? (portfolioSubLinks.find((l) => pathname === l.href)?.href ?? null)
    : null;

  const handleLogout = async () => {
    setMenuOpen(false);
    await signOut({ callbackUrl: "/auth/signin" });
  };

  const brandHome = isAuthenticated ? "/dashboard" : "/";

  return (
    <nav
      className="print:hidden sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800/80 shadow-sm"
      style={{ backgroundColor: "var(--nav-bg)" }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between h-14 gap-2">
        <Link
          href={brandHome}
          prefetch
          className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-slate-50 shrink-0 font-heading"
        >
          <TrendingUp className="text-teal-600 dark:text-teal-400" size={20} />
          <span>
            Folio<span className="text-teal-600 dark:text-teal-400">Veda</span>
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1 min-w-0">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch
              className={navLinkClass(activePrimary === link.href)}
            >
              {link.label}
            </Link>
          ))}
          <ThemeToggle />
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 transition-colors ml-1"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          ) : (
            <Link
              href="/auth/signin"
              prefetch
              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors ml-1 whitespace-nowrap"
            >
              Sign in
            </Link>
          )}
        </div>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-1.5">
          <ThemeToggle />
          <button
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="inline-flex items-center justify-center size-10 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-200/70 dark:hover:bg-slate-800/80 transition-colors"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Desktop portfolio sub-nav */}
      {showPortfolioSub && (
        <div className="hidden md:block border-t border-slate-200/70 dark:border-slate-800/70 bg-slate-100/50 dark:bg-slate-900/40">
          <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center gap-1 h-10 overflow-x-auto no-scrollbar">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mr-1 shrink-0">
              Portfolio
            </span>
            {portfolioSubLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch
                className={navLinkClass(activeSub === link.href)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-[var(--nav-bg)] max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain">
          <div className="px-3 py-3 space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch
                onClick={() => setMenuOpen(false)}
                className={navLinkClass(activePrimary === link.href, true)}
              >
                {link.label}
              </Link>
            ))}

            {showPortfolioSub && (
              <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                <p className="px-3 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  Portfolio
                </p>
                {portfolioSubLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    prefetch
                    onClick={() => setMenuOpen(false)}
                    className={navLinkClass(activeSub === link.href, true)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}

            <div className="pt-3 mt-2 border-t border-slate-200 dark:border-slate-800">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              ) : (
                <Link
                  href="/auth/signin"
                  prefetch
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center justify-center px-3 py-2.5 rounded-lg text-sm font-medium bg-teal-700 text-white hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 transition-colors"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
