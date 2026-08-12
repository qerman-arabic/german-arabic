'use client';

import { useEffect, useState } from 'react';
import { useRole, LIMITS } from '../../lib/access';
import Upsell from '../../components/Upsell';

const suggestions = [
  'تحدث معي بالألمانية بمستوى A1',
  'صحح هذه الجملة: Ich habe ein Brief geschrieben.',
  'اشرح لي الفرق بين der و den',
  'اختبرني شفويًا كما في امتحان Goethe A1',
];

export default function AIPage() {
  const { role, loading: roleLoading } = useRole();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [used, setUsed] = useState(0);

  const today = new Date().toDateString();

  useEffect(() => {
    setUsed(Number(localStorage.getItem('ai_' + today) || 0));
  }, [today]);

  useEffect(() => {
    const saved = localStorage.getItem('ai_history');
    if (saved) setMessages(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem('ai_history', JSON.stringify(messages));
  }, [messages]);

  const limit = LIMITS[role].ai;
  const locked = !roleLoading && used >= limit;

  function bump() {
    const next = used + 1;
    setUsed(next);
    localStorage.setItem('ai_' + today, String(next));
  }

  async function send(text) {
    const message = (text || input).trim();
    if (!message || loading || locked) return;

    setInput('');
    const newMessages = [...messages, { role: 'user', text: message }];
    setMessages(newMessages);
    setLoading(true);
    bump();

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history: messages }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: 'ai', text: data.text || 'حدث خطأ غير متوقع.' }]);
    } catch {
      setMessages([
        ...newMessages,
        { role: 'ai', text: 'تعذر الاتصال بالمعلم الذكي. تأكد من تشغيل الخادم وإضافة المفتاح.' },
      ]);
    }

    setLoading(false);
  }

  return (
    <main className="container">
      <Upsell role={role} feature="المعلم الذكي" />

      <div className="page-head">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <h1 className="page-title" style={{ margin: 0 }}>المعلم الذكي 🤖</h1>
          {messages.length > 0 && (
            <button className="pill" onClick={() => { setMessages([]); localStorage.removeItem('ai_history'); }}>
              🗑️ محادثة جديدة
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {role !== 'premium' && (
            <span className="chip">
              المتبقي اليوم: {Math.max(limit - used, 0)} من {limit}
            </span>
          )}
          <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
        </div>
      </div>

      <div
        className="card"
        style={{
          minHeight: 420,
          maxHeight: 560,
          overflowY: 'auto',
          marginBottom: 14,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--muted)', margin: 'auto', padding: 20 }}>
            <div style={{ fontSize: 46, marginBottom: 10 }}>🤖</div>
            <p style={{ fontWeight: 800, marginBottom: 6, color: 'var(--text)' }}>
              مرحبًا! أنا معلمك الذكي للألمانية.
            </p>
            <p style={{ marginBottom: 18 }}>أحادثك، أصحح كتابتك، وأشرح القواعد بالعربية.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
              {suggestions.map((s) => (
                <button key={s} className="pill" onClick={() => send(s)} disabled={locked}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '82%',
                padding: '12px 16px',
                borderRadius: 16,
                background:
                  m.role === 'user'
                    ? 'linear-gradient(135deg, var(--primary-dark), var(--primary))'
                    : '#f1f5f9',
                color: m.role === 'user' ? '#fff' : 'var(--text)',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.9,
                fontWeight: 500,
              }}
            >
              {m.text}
            </div>
          </div>
        ))}

        {loading && <p className="muted small">المعلم يكتب الرد...</p>}
      </div>

      {locked ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <b>⏳ انتهت رسائل اليوم المجانية</b>
          <p className="muted" style={{ margin: '6px 0 0' }}>
            عد غدًا، أو افتح المحادثات غير المحدودة مع Premium.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            className="input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="اكتب بالألمانية أو العربية..."
          />
          <button className="btn btn-primary btn-lg" onClick={() => send()} disabled={loading}>
            إرسال
          </button>
        </div>
      )}
    </main>
  );
}