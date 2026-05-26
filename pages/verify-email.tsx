"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import AuthLayout from "@/components/AuthLayout";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const { token } = router.query;
    if (!token) return;

    const verify = async () => {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${token}`);
        const data = await res.json();

        if (res.ok) {
          setStatus("success");
        } else {
          setStatus("error");
          setMessage(data.error ?? "Verification failed.");
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again.");
      }
    };

    verify();
  }, [router.query]);

  return (
    <AuthLayout navLink={{ href: "/login", label: "Login" }}>
      <div className="w-full max-w-md rounded-[28px] border border-white/80 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur-xl text-center">
        {status === "loading" && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.15s]" />
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.3s]" />
              </div>
            </div>
            <h2 className="text-xl font-semibold text-slate-950">Verifying your email…</h2>
            <p className="mt-2 text-sm text-slate-500">Just a moment, please wait.</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-8 w-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-slate-950">Email verified!</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Your account is now active. You can log in and start chatting.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block w-full rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700"
            >
              Go to login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-8 w-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-slate-950">Link expired</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>
            <Link
              href="/signup"
              className="mt-6 inline-block w-full rounded-2xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:-translate-y-0.5 hover:bg-indigo-700"
            >
              Sign up again
            </Link>
          </>
        )}
      </div>
    </AuthLayout>
  );
}
