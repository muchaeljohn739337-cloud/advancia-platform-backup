'use client';
import React, { useState, useEffect, useRef } from 'react';

type Message = { id: string; role: 'user' | 'assistant'; text: string };

export default function AdvanciaAIWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  const addMessage = (m: Message) => setMessages((s) => [...s, m]);

  async function send() {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: String(Date.now()),
      role: 'user',
      text: input,
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
      const assistantText = body?.reply || '(no reply)';
      addMessage({
        id: String(Date.now() + 1),
        role: 'assistant',
        text: assistantText,
      });
    } catch (err) {
      console.error('AI chat error:', err);
      addMessage({
        id: String(Date.now() + 2),
        role: 'assistant',
        text: 'Error: could not get response.',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 9999 }}>
      <div
        style={{
          width: 340,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
          borderRadius: 12,
          overflow: 'hidden',
          background: 'white',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            background: '#111827',
            color: '#fff',
          }}
        >
          <div style={{ fontWeight: 600 }}>Advancia AI</div>
          <div>
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label="toggle"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              {open ? '–' : '+'}
            </button>
          </div>
        </div>

        {open ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: 420 }}>
            <div
              ref={scrollRef}
              style={{
                padding: 12,
                overflowY: 'auto',
                flex: 1,
                background: '#f9fafb',
              }}
            >
              {messages.length === 0 && (
                <div style={{ color: '#6b7280' }}>
                  Ask me about onboarding, payments, or admin features.
                </div>
              )}
              {messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    margin: '8px 0',
                    textAlign: m.role === 'user' ? 'right' : 'left',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-block',
                      padding: '8px 12px',
                      borderRadius: 10,
                      background: m.role === 'user' ? '#e6fffa' : '#eef2ff',
                      color: '#111827',
                      maxWidth: '80%',
                    }}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: 8, borderTop: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="Ask Advancia AI..."
                  style={{
                    flex: 1,
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                  }}
                />
                <button
                  onClick={send}
                  disabled={loading}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {loading ? '…' : 'Send'}
                </button>
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 6 }}>
                Responses may be mocked in dev; configure real AI by setting OPENAI_API_KEY in the
                backend.
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
