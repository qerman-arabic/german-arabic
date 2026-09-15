'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function VerbsPage() {
  const [verbs, setVerbs] = useState([]);
  const [level, setLevel] = useState('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('verbs')
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
      v.meaning_ar.includes(q.trim());
    return okLevel && okQ;
  });

  return (
    <main className="container">
      <div className="page-head">
        <h1 className="page-title">قاموس الأفعال 📚</h1>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <p className="muted" style={{ margin: 0, lineHeight: 2 }}>
          جميع الأفعال الألمانية مع التصريف الكامل والأمثلة — اضغط أي فعل لرؤية التفاصيل!
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
          {['all', 'A1', 'A2', 'B1', 'B2'].map((l) => (
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
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {filtered.map((v) => (
          <button
            key={v.id}
            className="card"
            style={{ textAlign: 'right', cursor: 'pointer' }}
            onClick={() => setSelected(v)}
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
                <span className="muted" style={{ fontWeight: 400, marginLeft: 8 }}>
                  — {v.perfekt}
                </span>
              </div>
              <div style={{ fontWeight: 800 }}>{v.meaning_ar}</div>
            </div>
            <div className="muted small" style={{ marginTop: 4 }}>
              {v.level_code} · {v.hilfsverb}
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="card muted" style={{ textAlign: 'center' }}>
            لا نتائج — جرّب كلمة أخرى
          </div>
        )}
      </div>

      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{
              maxWidth: 520,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <h2 dir="ltr" style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>
                {selected.infinitive}
              </h2>
              <button className="btn btn-ghost" onClick={() => setSelected(null)}>
                ✕
              </button>
            </div>

            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 14 }}>
              {selected.meaning_ar}
            </div>

            <div className="card" style={{ background: '#f8fafc', marginBottom: 12 }}>
              <b>🔤 التصريف الكامل:</b>
              <div dir="ltr" style={{ marginTop: 8, lineHeight: 2.2 }}>
                <div><b>Präsens:</b> ich {selected.praesens_ich} · du {selected.praesens_du} · er/sie {selected.praesens_er}</div>
                <div><b>Präteritum:</b> {selected.praeteritum}</div>
                <div><b>Perfekt:</b> {selected.perfekt} <span className="muted">({selected.hilfsverb})</span></div>
                {selected.imperativ && <div><b>Imperativ:</b> {selected.imperativ}</div>}
              </div>
            </div>

            {selected.example_de && (
              <div className="card" style={{ background: '#eff6ff' }}>
                <b>📝 مثال:</b>
                <div dir="ltr" style={{ marginTop: 6, fontSize: 16, fontWeight: 700 }}>
                  {selected.example_de}
                </div>
                <div className="muted" style={{ marginTop: 4 }}>
                  {selected.example_ar}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}