"use client";

import { useState, useRef, useEffect } from "react";
import { useAgentStore } from "@/lib/store";

export default function FloatingAiAgent() {
  const { isOpen, toggleOpen, messages, addMessage, context } = useAgentStore();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput("");
    addMessage({ id: Date.now().toString(), role: "user", content: userMsg, timestamp: new Date() });
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, context }),
      });

      if (!res.ok) throw new Error("Network response was not ok");
      if (!res.body) throw new Error("No body in response");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiContent = "";
      const msgId = (Date.now() + 1).toString();

      addMessage({ id: msgId, role: "assistant", content: "", timestamp: new Date() });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        aiContent += chunk;

        useAgentStore.setState((state) => ({
          messages: state.messages.map((m) => (m.id === msgId ? { ...m, content: aiContent } : m)),
        }));
      }
    } catch (error) {
      console.error("Chat error:", error);
      addMessage({
        id: Date.now().toString(),
        role: "assistant",
        content: "Sorry, I encountered an issue connecting to OpenRouter AI.",
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating AI Button (Pill with Black Icon & Text Label) */}
      <button
        onClick={toggleOpen}
        type="button"
        className="fixed bottom-6 right-6 px-4 py-3 rounded-full bg-white text-black hover:bg-gray-200 border-2 border-white shadow-2xl flex items-center gap-2 hover:scale-105 transition-all z-50 font-bold text-xs"
        title="Open Velicham AI Assistant"
        style={{ color: "black" }}
      >
        <i className="lni lni-sparkles text-sm" style={{ color: "black" }} />
        <span className="font-bold text-black" style={{ color: "black" }}>AI Guide</span>
      </button>

      {/* Floating AI Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 h-[30rem] bg-[#18181b] rounded-3xl flex flex-col overflow-hidden border-2 border-white shadow-2xl z-50 animate-fade-in-up">
          {/* Header */}
          <div className="p-4 bg-[#18181b] border-b border-[#27272a] flex justify-between items-center">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <i className="lni lni-sparkles text-white text-base" /> Velicham AI Guide
            </h3>
            <button
              onClick={toggleOpen}
              type="button"
              className="text-gray-400 hover:text-white p-1 rounded-lg text-sm transition"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs">
            {messages.length === 0 && (
              <div className="text-gray-300 text-center py-8 space-y-2">
                <i className="lni lni-bot text-2xl text-white block" />
                <p className="font-bold text-white text-xs">How can I assist your learning?</p>
                <p className="text-[11px] text-gray-300">Ask questions about notes, topics, or YouTube content on this page.</p>
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                    msg.role === "user"
                      ? "bg-white text-black font-semibold rounded-br-none shadow"
                      : "bg-[#0f0f11] text-white border border-white/20 rounded-bl-none"
                  }`}
                  style={msg.role === "user" ? { color: "black" } : { color: "white" }}
                >
                  {msg.content || (msg.role === "assistant" && isLoading ? "Thinking..." : "")}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-[#27272a] bg-[#18181b] flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Velicham AI..."
              className="flex-1 bg-[#0f0f11] border border-[#27272a] rounded-full px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white transition"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-9 h-9 rounded-full bg-white hover:bg-gray-200 text-black flex items-center justify-center transition disabled:opacity-40 shrink-0 shadow"
            >
              <i className="lni lni-rocket text-black text-xs" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
