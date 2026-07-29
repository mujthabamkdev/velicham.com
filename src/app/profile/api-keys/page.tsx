"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ApiKeysPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // OpenRouter Free AI API Key State
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
        if (data?.user) {
          setUser(data.user);
          fetchKeyStatus();
        } else {
          router.push("/login");
        }
      })
      .catch((e) => {
        console.error("API Keys page auth error:", e);
      })
      .finally(() => {
        setLoading(false);
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
        setKeySuccess("⚡ OpenRouter Free AI API Key encrypted and saved successfully!");
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
        setKeySuccess("OpenRouter API key removed.");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setKeyStatusLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full flex-1 text-white flex flex-col font-sans">
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="animate-pulse flex items-center gap-3 text-sm text-gray-400">
            <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            Loading API keys configuration...
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="w-full flex-1 text-gray-100 flex flex-col font-sans">
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 sm:py-12">
        <div className="bg-[#18181b] border border-[#27272a] rounded-3xl p-6 sm:p-10 shadow-2xl space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#27272a] pb-6">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                <i className="lni lni-key text-xl" /> My API Keys
              </h1>
              <p className="text-xs text-gray-400 mt-1">
                Manage your personal API keys for generating AI notes.
              </p>
            </div>
            <Link
              href="/profile"
              className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 text-xs font-mono font-bold transition flex items-center gap-2"
            >
              <i className="lni lni-arrow-left text-xs" /> Back to Profile
            </Link>
          </div>

          {/* OpenRouter Free AI API Key Card */}
          <div className="bg-[#0f0f11] border border-[#27272a] rounded-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <i className="lni lni-key text-base" /> OpenRouter Free AI API Key
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Configure your OpenRouter Free AI API key to generate custom knowledge notes.
                </p>
              </div>
              {hasKey && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Encrypted Key Active
                </span>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-[#18181b] border border-[#27272a] rounded-xl p-4 text-xs text-gray-300 space-y-2">
              <p className="font-bold text-white flex items-center gap-1.5">
                <i className="lni lni-book text-sm" /> How to get your OpenRouter Free AI API Key:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-gray-400 font-mono">
                <li>
                  Visit{" "}
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white underline hover:text-gray-300"
                  >
                    openrouter.ai/keys ↗
                  </a>
                </li>
                <li>Sign in or register a free OpenRouter account</li>
                <li>Click <strong>"Create Key"</strong> and copy your key (starts with <code className="text-gray-200">sk-or-v1-</code>)</li>
                <li>Paste your key below and click <strong>Save API Key</strong></li>
              </ol>
              <p className="text-[11px] text-gray-500 italic mt-1 flex items-center gap-1">
                <i className="lni lni-lock text-xs" /> Note: Your API key is stored encrypted (AES-256-GCM) and used exclusively for your note creations.
              </p>
            </div>

            {/* Status or Form */}
            {keyStatusLoading ? (
              <p className="text-xs text-gray-400 animate-pulse">Checking API key status...</p>
            ) : (
              <div>
                {hasKey && (
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 mb-4">
                    <div>
                      <p className="text-[11px] font-mono text-gray-400">Stored Key (Masked)</p>
                      <p className="text-xs font-mono font-bold text-white mt-0.5">{maskedKey}</p>
                    </div>
                    <button
                      onClick={handleDeleteApiKey}
                      className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium transition flex items-center gap-1"
                    >
                      <i className="lni lni-trash-can text-xs" /> Remove Key
                    </button>
                  </div>
                )}

                {/* Input Form */}
                <form onSubmit={handleSaveApiKey} className="space-y-3">
                  {keyError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                      <i className="lni lni-warning text-sm" /> {keyError}
                    </div>
                  )}

                  {keySuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                      <i className="lni lni-checkmark text-sm" /> {keySuccess}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="sk-or-v1-••••••••"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      className="flex-1 bg-[#18181b] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white transition font-mono"
                    />
                    <button
                      type="submit"
                      disabled={keySaving || !apiKeyInput.trim()}
                      className="px-5 py-2.5 rounded-xl bg-white hover:bg-gray-200 text-black text-xs font-bold transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {keySaving ? "Encrypting & Saving..." : "Save API Key"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
