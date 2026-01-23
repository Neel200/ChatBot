// pages/signup.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/router";

interface SignupResponse {
  success?: true;
  error?: string;
}

export default function Signup() {
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  async function signup(): Promise<void> {
    setLoading(true);

    try {
      const res: Response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data: SignupResponse = await res.json();

      if (!res.ok) {
        alert(data.error ?? "Signup failed");
        return;
      }

      router.push("/login");
    } catch {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-700">
      <div className="bg-white/10 backdrop-blur p-6 rounded-lg w-80">
        <h1 className="text-white text-2xl mb-4 text-center">Sign Up</h1>

        <input
          className="w-full mb-3 p-2 rounded"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full mb-4 p-2 rounded"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          disabled={loading}
          onClick={signup}
          className="w-full bg-white/30 text-white py-2 rounded hover:bg-white/40 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create account"}
        </button>
      </div>
    </div>
  );
}