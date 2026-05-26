"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import AuthLayout from "@/components/AuthLayout";

interface SignupResponse {
  success?: true;
  message?: string;
  error?: string;
}

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function signup(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data: SignupResponse = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Signup failed.");
        return;
      }

      setDone(true);
    } catch {
      setError("Unable to create an account right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout navLink={{ href: "/login", label: "Login" }}>
      <div className="w-full max-w-md rounded-[28px] border border-white/80 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8">
        {!done ? (
          <>
            <div className="mb-8">
              <p className="text-sm font-semibold text-indigo-600">Create account</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Start using ChatBot
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Save conversations, revisit threads, and keep your AI workspace organized.
              </p>
            </div>

            <form onSubmit={signup} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Email</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
                <input
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>

              {error && (
                <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                disabled={loading}
                type="submit"
                className="w-full rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 disabled:translate-y-0 disabled:opacity-60"
              >
                {loading ? "Creating account…" : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-indigo-600 hover:underline">
                Log in
              </Link>
            </p>
          </>
        ) : (
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor" className="h-8 w-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-slate-950">Check your inbox</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              We sent a verification link to <strong>{email}</strong>. Click the link to activate your account.
            </p>
            <p className="mt-3 text-xs text-slate-400">
              Didn't get it? Check your spam folder. The link expires in 24 hours.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-indigo-50 hover:text-indigo-700"
            >
              Back to login
            </Link>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
