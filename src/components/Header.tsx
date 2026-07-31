"use client";

import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useState } from "react";
import SearchBar from "./SearchBar";

const ADMIN_EMAIL = "satyamkamat4@gmail.com";

export default function Header() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  const navLinks = [
    { href: "/", label: "Home", icon: <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg> },
    { href: "/browse", label: "Comics", icon: <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h5v8l-2.5-1.5L6 12V4z" /></svg> },
    { href: "/novels", label: "Novels", icon: <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 4h12v16H6V4z" /></svg> },
    { href: "/categories", label: "Categories", icon: <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l-5.5 9h11L12 2zm0 3.84L13.93 9h-3.87L12 5.84zM17.5 13c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5zm0 7c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zM3 21.5h8v-8H3v8zm2-6h4v4H5v-4z" /></svg> },
    { href: "/latest", label: "Latest", icon: <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg> },
    { href: "/bookmarks", label: "Bookmarks", icon: <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" /></svg> },
    { href: "/downloads", label: "Downloads", icon: <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg> },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm overflow-hidden">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-3 sm:gap-3 sm:px-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
            M
          </div>
          <span className="hidden font-bold text-white sm:block">Manhwa Reader</span>
        </Link>

        <nav className="hidden h-full items-center gap-0.5 overflow-x-auto lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex h-full items-center gap-1 whitespace-nowrap px-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.icon}
              <span className="hidden xl:inline">{link.label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex-1 min-w-0" />

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="hidden sm:block">
            <SearchBar placeholder="Search..." className="w-32 lg:w-48" />
          </div>

          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground sm:hidden"
            aria-label="Toggle search"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {user ? (
            <div className="flex items-center gap-1.5">
              {user.email === ADMIN_EMAIL && (
                <Link href="/admin" className="hidden h-8 items-center gap-1 rounded-lg bg-primary/20 px-2 text-xs font-medium text-primary hover:bg-primary/30 lg:flex">
                  <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Admin
                </Link>
              )}
              {user.photoURL && (
                <Link href="/profile" aria-label="Profile" className="block">
                  <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-primary/30 transition-transform hover:scale-105" />
                </Link>
              )}
              {!user.photoURL && (
                <Link href="/profile" aria-label="Profile" className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  {user.email?.[0]?.toUpperCase()}
                </Link>
              )}
              <button onClick={logout} className="hidden text-xs text-muted-foreground hover:text-foreground sm:block">
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex h-8 items-center gap-1 rounded-lg bg-primary/20 px-2 text-xs font-medium text-primary transition-colors hover:bg-primary/30"
              aria-label="Sign in"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )}

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-card-hover lg:hidden"
            aria-label="Toggle menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {showMobileSearch && (
        <div className="border-t border-border bg-card/95 px-4 py-3 sm:hidden">
          <SearchBar placeholder="Search comics..." className="w-full" />
        </div>
      )}

      {menuOpen && (
        <div className="border-t border-border bg-card lg:hidden">
          <div className="flex flex-col px-4 py-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
                onClick={() => setMenuOpen(false)}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                onClick={() => setMenuOpen(false)}
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12c2.67 0 8 1.34 8 4v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2c0-2.66 1.33-4 4-4.5V8a4 4 0 118 0v4.5c2.67.5 4 1.84 4 4.5z" /></svg>
                Profile
              </Link>
            )}
            {user?.email === ADMIN_EMAIL && (
              <Link
                href="/admin"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-primary hover:text-primary-hover"
                onClick={() => setMenuOpen(false)}
              >
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Admin Panel
              </Link>
            )}
            {user && (
              <button
                onClick={() => { logout(); setMenuOpen(false); }}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground text-left"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
