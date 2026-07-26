'use client';

import { useState, useRef, useEffect } from 'react';
import { useAgentStore } from '@/lib/store';

export default function FloatingAiAgent() {
  const { isOpen, toggleOpen, messages, addMessage, context } = useAgentStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    addMessage({ id: Date.now().toString(), role: 'user', content: userMsg, timestamp: new Date() });
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, context }),
      });

      if (!res.ok) throw new Error('Network response was not ok');
      if (!res.body) throw new Error('No body in response');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let aiContent = '';
      const msgId = (Date.now() + 1).toString();
      
      addMessage({ id: msgId, role: 'assistant', content: '', timestamp: new Date() });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        aiContent += chunk;
        
        useAgentStore.setState(state => ({
          messages: state.messages.map(m => m.id === msgId ? { ...m, content: aiContent } : m)
        }));
      }
    } catch (error) {
      console.error('Chat error:', error);
      addMessage({ id: Date.now().toString(), role: 'assistant', content: 'Sorry, I encountered an error connecting to the cosmic network.', timestamp: new Date() });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={toggleOpen}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-[--color-accent-cyan] to-[--color-accent-purple] flex items-center justify-center shadow-lg hover:scale-110 transition z-50"
      >
        ✨
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 md:w-96 h-[30rem] glass-card rounded-2xl flex flex-col overflow-hidden border border-[--color-nebula-mid] shadow-2xl z-50 animate-fade-in-up">
          <div className="p-4 bg-[--color-nebula-dark] border-b border-[--color-nebula-mid] flex justify-between items-center">
            <h3 className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-[--color-accent-cyan] to-[--color-accent-purple]">Velicham AI Guide</h3>
            <button onClick={toggleOpen} className="text-gray-400 hover:text-white">&times;</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <p className="text-gray-400 text-center text-sm mt-4">Ask me anything about the content on this page.</p>
            )}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-[--color-accent-purple] text-white rounded-br-none' : 'bg-[--color-nebula-dark] text-gray-200 border border-[--color-nebula-mid] rounded-bl-none'}`}>
                  {msg.content || (msg.role === 'assistant' && isLoading ? '...' : '')}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-3 border-t border-[--color-nebula-mid] flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the cosmos..." 
              className="flex-1 bg-[--color-nebula-dark] border border-[--color-nebula-mid] rounded-full px-4 py-2 text-sm focus:outline-none focus:border-[--color-accent-cyan]"
              disabled={isLoading}
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 rounded-full bg-[--color-accent-purple] flex items-center justify-center hover:bg-purple-500 transition disabled:opacity-50"
            >
              🚀
            </button>
          </form>
        </div>
      )}
    </>
  );
}
