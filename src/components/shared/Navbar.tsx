"use client";

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { TrendingUp, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/portfolio', label: 'Portfolio' },
  { href: '/portfolio/risk', label: 'Risk' },
  { href: '/portfolio/overlap', label: 'Overlap' },
  { href: '/funds/compare', label: 'Compare' },
  { href: '/top-funds', label: 'Top Funds' },
  { href: '/risk-analysis', label: 'Fund Ratings' },
  { href: '/tools/sip-calculator', label: 'SIP Calculator' },
  { href: '/about', label: 'About' },
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();

  if (pathname === '/' || pathname.startsWith('/auth')) return null;

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/auth/signin');
  };

  return (
    <nav className="print:hidden sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center justify-between h-14">
        <div
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 font-bold text-lg text-slate-900 cursor-pointer shrink-0"
        >
          <TrendingUp className="text-blue-600" size={20} />
          <span className="hidden xs:inline">Folio<span className="text-blue-600">Veda</span></span>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1 overflow-x-auto no-scrollbar">
          {links.map(link => (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {link.label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors ml-1"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
