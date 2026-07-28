"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // OpenRouter API Key State
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState<string | null>(null);
  const [keyStatusLoading, setKeyStatusLoading] = useState(true);
  const [keySaving, setKeySaving] = useState(false);
  const [keyError, setKeyError] = useState("");
  const [keySuccess, setKeySuccess] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (!data?.user) {
          router.push("/login");
        } else {
          setUser(data.user);
          fetchKeyStatus();
        }
        setLoading(false);
      })
      .catch(() => {
        router.push("/login");
      });
  }, [router]);

  const fetchKeyStatus = async () => {
    try {
      setKeyStatusLoading(true);
      const res = await fetch("/api/auth/openrouter-key");
      if (res.ok) {
        const data = await res.json();
        setHasKey(data.hasKey);
        setMaskedKey(data.maskedKey);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setKeyStatusLoading(false);
    }
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setKeyError("");
    setKeySuccess("");

    if (!apiKeyInput.trim().startsWith("sk-or-v1-")) {
      setKeyError("OpenRouter API keys must start with 'sk-or-v1-'");
      return;
    }

    setKeySaving(true);
    try {
      const res = await fetch("/api/auth/openrouter-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: apiKeyInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        setKeyError(data.error || "Failed to save API Key");
      } else {
        setHasKey(data.hasKey);
        setMaskedKey(data.maskedKey);
        setApiKeyInput("");
        setKeySuccess("⚡ API Key encrypted and saved successfully!");
      }
    } catch (err) {
      setKeyError("Network error. Failed to save API Key.");
    } finally {
      setKeySaving(false);
    }
  };

  const handleDeleteApiKey = async () => {
    if (!confirm("Are you sure you want to remove your stored OpenRouter API key?")) return;
    setKeyStatusLoading(true);
    try {
      const res = await fetch("/api/auth/openrouter-key", { method: "DELETE" });
      if (res.ok) {
        setHasKey(false);
        setMaskedKey(null);
        setKeySuccess("API key removed.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setKeyStatusLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="w-full flex-1 text-white flex flex-col font-sans">
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="animate-pulse flex items-center gap-3 text-sm text-gray-400">
            <span className="w-4 h-4 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            Loading profile details...
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="w-full flex-1 text-gray-100 flex flex-col font-sans">
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12">
        {/* Profile Card Container */}
        <div className="bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-cyan-600/15 rounded-full blur-3xl pointer-events-none" />

          {/* Profile Header Block */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-8 border-b border-[#27272a]">
            {/* Avatar Circle */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-1 shadow-xl">
                <div className="w-full h-full bg-[#18181b] rounded-full flex items-center justify-center">
                  <span className="text-3xl font-black text-white">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <span className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-4 border-[#18181b] rounded-full" title="Active Session" />
            </div>

            {/* Basic Info */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {user.name || "User"}
                </h1>
                <span className="self-center sm:self-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                  {user.role} Account
                </span>
              </div>
              <p className="text-sm font-mono text-gray-400">{user.email}</p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="px-4 py-2 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600/30 text-xs font-mono font-bold transition flex items-center gap-2"
                >
                  ⚡ Admin Panel
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium transition"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* OpenRouter AI Key Section */}
          <div className="mt-8 space-y-6">
            <div className="bg-[#0f0f11] border border-[#27272a] rounded-2xl p-6 sm:p-7 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>🔑</span> OpenRouter Free AI API Key
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Set up your own free OpenRouter key to generate new AI notes.
                  </p>
                </div>
                {hasKey && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Encrypted Key Active
                  </span>
                )}
              </div>

              {/* How to Get Free Key Instructions */}
              <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 text-xs text-gray-300 space-y-2">
                <p className="font-bold text-purple-300 flex items-center gap-1.5">
                  <span>📖</span> How to get a free OpenRouter API Key:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-gray-400 font-mono">
                  <li>
                    Visit{" "}
                    <a
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 underline hover:text-cyan-300"
                    >
                      openrouter.ai/keys ↗
                    </a>
                  </li>
                  <li>Sign in or create a free OpenRouter account</li>
                  <li>Click <strong>"Create Key"</strong> and copy your key (starts with <code className="text-purple-300">sk-or-v1-</code>)</li>
                  <li>Paste your key below and click <strong>Save API Key</strong></li>
                </ol>
                <p className="text-[11px] text-gray-500 italic mt-1">
                  🔒 Note: Your API key is encrypted at rest using AES-256-GCM. Only your account can use it for AI note generation.
                </p>
              </div>

              {/* Status or Form */}
              {keyStatusLoading ? (
                <p className="text-xs text-gray-400 animate-pulse">Checking key status...</p>
              ) : (
                <div>
                  {hasKey && (
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 mb-4">
                      <div>
                        <p className="text-[11px] font-mono text-gray-400">Stored Key (Masked)</p>
                        <p className="text-xs font-mono font-bold text-cyan-300 mt-0.5">{maskedKey}</p>
                      </div>
                      <button
                        onClick={handleDeleteApiKey}
                        className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition"
                      >
                        Remove Key
                      </button>
                    </div>
                  )}

                  {/* Input Form */}
                  <form onSubmit={handleSaveApiKey} className="space-y-3">
                    {keyError && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                        <span>⚠️</span> {keyError}
                      </div>
                    )}

                    {keySuccess && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                        <span>✓</span> {keySuccess}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="sk-or-v1-••••••••"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        className="flex-1 bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition font-mono"
                      />
                      <button
                        type="submit"
                        disabled={keySaving || !apiKeyInput.trim()}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition disabled:opacity-50 flex items-center gap-2"
                      >
                        {keySaving ? "Encrypting & Saving..." : "Save API Key"}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Back to Feed */}
            <div className="pt-4 border-t border-[#27272a] flex items-center justify-between">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-medium text-purple-400 hover:text-purple-300 transition"
              >
                ← Return to Knowledge Feed
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
