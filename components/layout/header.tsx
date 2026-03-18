"use client";

import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

// TODO: Re-enable Dashboard and Conflicts when UCDP API token is available.
// Both pages depend on getDemoConflicts() fallback until a valid UCDP_TOKEN
// is set in .env.local — see lib/api/conflicts.ts.
//
// const NAV_ITEMS = [
//   { href: "/dashboard", label: "Dashboard" },  // waiting for UCDP API token
//   { href: "/conflicts", label: "Conflicts" },   // waiting for UCDP API token
// ];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link href="/" className="flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
            <path d="M2 12h20"/>
          </svg>
        </Link>
        <div className="ml-auto flex items-center space-x-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
