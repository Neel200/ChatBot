"use client";

import Link from "next/link";
import React from "react";

interface Props {
  children: React.ReactNode;
  navLink?: { href: string; label: string };
}

const SparkleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path fillRule="evenodd" d="M9 4.5a.75.75 0 0 1 .721.544l.813 2.846a3.75 3.75 0 0 0 2.576 2.576l2.846.813a.75.75 0 0 1 0 1.442l-2.846.813a3.75 3.75 0 0 0-2.576 2.576l-.813 2.846a.75.75 0 0 1-1.442 0l-.813-2.846a3.75 3.75 0 0 0-2.576-2.576l-2.846-.813a.75.75 0 0 1 0-1.442l2.846-.813A3.75 3.75 0 0 0 7.466 7.89l.813-2.846A.75.75 0 0 1 9 4.5ZM18 1.5a.75.75 0 0 1 .728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 0 1 0 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 0 1-1.456 0l-.258-1.036a2.625 2.625 0 0 0-1.91-1.91l-1.036-.258a.75.75 0 0 1 0-1.456l1.036-.258a2.625 2.625 0 0 0 1.91-1.91l.258-1.036A.75.75 0 0 1 18 1.5Z" clipRule="evenodd" />
  </svg>
);

export default function AuthLayout({ children, navLink }: Props) {
  return (
    <main className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_left,#dbeafe,transparent_34%),linear-gradient(135deg,#f8fafc,#eef2ff_52%,#f8fafc)] text-slate-950">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/75 px-4 backdrop-blur-xl sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-200">
            <SparkleIcon />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600">ChatBot</p>
            <h1 className="text-lg font-semibold text-slate-950">AI workspace</h1>
          </div>
        </Link>

        {navLink && (
          <Link
            href={navLink.href}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md"
          >
            {navLink.label}
          </Link>
        )}
      </header>

      <section className="flex flex-1 items-center justify-center px-4 py-8">
        {children}
      </section>
    </main>
  );
}
