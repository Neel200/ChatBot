"use client";

import Link from "next/link";
import { useRouter } from "next/router";
import { FormEvent, useState } from "react";
import AuthLayout from "@/components/AuthLayout";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Invalid email or password.");
        return;
      }

      localStorage.setItem("token", data.token);
      router.push("/");
    } catch {
      setError("Unable to sign in right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout navLink={{ href: "/signup", label: "Sign up" }}>
      <div className="w-full max-w-md rounded-[28px] border border-white/80 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl sm:p-8">
        <div className="mb-8">
          <p className="text-sm font-semibold text-indigo-600">Welcome back</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Log in to ChatBot
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Continue your saved conversations and start new AI sessions.
          </p>
        </div>

        <form onSubmit={login} className="space-y-4">
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
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-indigo-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
              type="password"
              placeholder="Enter your password"
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
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 disabled:translate-y-0 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Don't have an account?{" "}
          <Link href="/signup" className="font-semibold text-indigo-600 hover:underline">
            Sign up for free
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
