"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"LOGIN" | "SIGNUP">("LOGIN");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const endpoint = mode === "LOGIN" ? "/api/auth/login" : "/api/auth/signup";
      const payload = mode === "LOGIN" ? { email, password } : { name, email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "An error occurred");
        setLoading(false);
        return;
      }

      // Success! Refresh router and navigate home
      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f11] text-gray-100 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md bg-[#18181b] border border-[#27272a] rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-cyan-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2 mb-3">
            <span className="text-2xl font-bold font-mono tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
              Velicham
            </span>
          </Link>
          <h1 className="text-xl font-bold text-white">
            {mode === "LOGIN" ? "Welcome back" : "Create an account"}
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            {mode === "LOGIN"
              ? "Sign in to access your custom space & admin features"
              : "Join Velicham to explore structured knowledge notes"}
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-[#0f0f11] p-1 rounded-xl mb-6 border border-[#27272a]">
          <button
            type="button"
            onClick={() => { setMode("LOGIN"); setError(""); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              mode === "LOGIN" ? "bg-[#27272a] text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode("SIGNUP"); setError(""); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
              mode === "SIGNUP" ? "bg-[#27272a] text-white shadow-sm" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-fadeIn">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {mode === "SIGNUP" && (
            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0f0f11] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#0f0f11] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#0f0f11] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition shadow-lg shadow-purple-600/20 disabled:opacity-50 mt-2"
          >
            {loading ? "Processing..." : mode === "LOGIN" ? "Sign In" : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
