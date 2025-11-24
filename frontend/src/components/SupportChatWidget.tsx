'use client';

import { Maximize2, MessageCircle, Minimize2, Send, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
};

export default function SupportChatWidget() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Add welcome message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        text: "👋 Hello! I'm here to help with any questions about Advancia Pay. How can I assist you today?",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [open, messages.length]);

  const addMessage = (m: Message) => setMessages((s) => [...s, m]);

  async function send() {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: String(Date.now()),
      role: 'user',
      text: input,
      timestamp: new Date(),
    };
    addMessage(userMsg);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMsg.text }),
      });

      if (!res.ok) throw new Error('AI API error');
      const body = await res.json();
      const assistantText =
        body?.reply || "I'm here to help! Could you provide more details about your question?";

      addMessage({
        id: String(Date.now() + 1),
        role: 'assistant',
        text: assistantText,
        timestamp: new Date(),
      });
    } catch (err) {
      console.error('Support chat error:', err);
      addMessage({
        id: String(Date.now() + 2),
        role: 'assistant',
        text: "I'm having trouble connecting right now. Please try submitting a support ticket above, and our team will respond within 24 hours.",
        timestamp: new Date(),
      });
    } finally {
      setLoading(false);
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full p-4 shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110 group"
        aria-label="Open support chat"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 bg-green-500 h-3 w-3 rounded-full animate-pulse"></span>
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transition-all duration-300"
      style={{
        width: minimized ? '320px' : '400px',
        height: minimized ? '64px' : '600px',
        maxHeight: 'calc(100vh - 100px)',
      }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <MessageCircle className="h-6 w-6" />
            <span className="absolute -bottom-1 -right-1 bg-green-400 h-3 w-3 rounded-full border-2 border-blue-600"></span>
          </div>
          <div>
            <h3 className="font-semibold text-sm">Support Chat</h3>
            <p className="text-xs text-blue-100">We typically reply in minutes</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMinimized(!minimized)}
            className="hover:bg-blue-600 p-1.5 rounded transition-colors"
            aria-label={minimized ? 'Maximize' : 'Minimize'}
          >
            {minimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setOpen(false)}
            className="hover:bg-blue-600 p-1.5 rounded transition-colors"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chat Messages */}
      {!minimized && (
        <>
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-slate-50 to-white space-y-4"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[80%] ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div
                    className={`inline-block px-4 py-2 rounded-2xl ${
                      m.role === 'user'
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-900 rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{m.text}</p>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 px-2">{formatTime(m.timestamp)}</p>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 text-slate-900 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0ms' }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: '150ms' }}
                    ></span>
                    <span
                      className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                      style={{ animationDelay: '300ms' }}
                    ></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
            <p className="text-xs text-slate-500 mb-2">Quick actions:</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setInput('How do I deposit funds?')}
                className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-full hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                💰 Deposits
              </button>
              <button
                onClick={() => setInput('What are the withdrawal fees?')}
                className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-full hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                💸 Withdrawals
              </button>
              <button
                onClick={() => setInput('How does the rewards system work?')}
                className="text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-full hover:border-blue-500 hover:text-blue-600 transition-colors"
              >
                🎁 Rewards
              </button>
            </div>
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-200">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none text-sm text-slate-900 placeholder-slate-400"
                disabled={loading}
              />
              <button
                onClick={send}
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-2.5 rounded-xl transition-colors"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2 text-center">
              Powered by Advancia AI • <span className="text-green-500">● Online</span>
            </p>
          </div>
        </>
      )}
    </div>
  );
}
