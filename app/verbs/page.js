'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function VerbsPage() {
  const [verbs, setVerbs] = useState([]);
  const [level, setLevel] = useState('all');
  const [q, setQ] = useState('');
  const [testMode, setTestMode] = useState(false);
  const [revealed, setRevealed] = useState({});

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('irregular_verbs')
        .select('*')
        .order('sort_order');
      setVerbs(data || []);
    }
    load();
  }, []);

  const filtered = verbs.filter((v) => {
    const okLevel = level === 'all' || v.level_code === level;
    const s = q.trim().toLowerCase();
    const okQ =
      !s ||
      v.infinitive.toLowerCase().includes(s) ||
      v.praeteritum.toLowerCase().includes(s) ||
      v.perfekt.toLowerCase().includes(s) ||
      v.meaning_ar.includes(q.trim());
    return okLevel && okQ;
  });

  return (
    <main className="container">
      <div className="page-head">
        <h1 className="page-title">الأفعال الشاذة 🔀</h1>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <p className="muted" style={{ margin: 0, lineHeight: 2 }}>
          أقوى 60 فعلًا غير منتظم في الألمانية — التصريف الكامل مع الترجمة.
          فعّل «🙈 اختبر نفسي» ثم اضغط أي فعل لكشف إجابته وأثبت حفظك!
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          marginBottom: 14,
          alignItems: 'center',
        }}
      >
        <div className="pills" style={{ margin: 0 }}>
          {['all', 'A1', 'A2', 'B1'].map((l) => (
            <button
              key={l}
              className="pill"
              onClick={() => setLevel(l)}
              style={
                level === l
                  ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
                  : {}
              }
            >
              {l === 'all' ? 'الكل' : l}
            </button>
          ))}
        </div>
        <input
          className="input"
          style={{ flex: 1, minWidth: 160 }}
          placeholder="ابحث بالألماني أو العربي..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button
          className="btn btn-ghost"
          onClick={() => {
            setTestMode(!testMode);
            setRevealed({});
          }}
        >
          {testMode ? '✅ وضع الاختبار مفعّل' : '🙈 اختبر نفسي'}
        </button>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {filtered.map((v) => {
          const open = !testMode || revealed[v.id];
          return (
            <button
              key={v.id}
              className="card"
              style={{ textAlign: 'right', cursor: 'pointer' }}
              onClick={() => testMode && setRevealed((p) => ({ ...p, [v.id]: true }))}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                <div dir="ltr" style={{ fontWeight: 900, fontSize: 17, textAlign: 'left', flex: 1 }}>
                  {v.infinitive}
                  {open ? (
                    <span style={{ color: 'var(--primary-dark)' }}>
                      {' '}— {v.praeteritum} — {v.perfekt}
                    </span>
                  ) : (
                    <span className="muted"> — ؟ — ؟</span>
                  )}
                </div>
                <div style={{ fontWeight: 800 }}>{v.meaning_ar}</div>
              </div>
              <div className="muted small" style={{ marginTop: 4 }}>
                {v.level_code}
                {testMode && !open && ' — اضغط للكشف'}
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="card muted" style={{ textAlign: 'center' }}>
            لا نتائج — جرّب كلمة أخرى
          </div>
        )}
      </div>
    </main>
  );
}