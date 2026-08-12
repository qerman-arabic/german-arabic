'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRole, LIMITS } from '../../lib/access';
import Upsell from '../../components/Upsell';

export default function GrammarPage() {
  const { role, userId } = useRole();
  const [topics, setTopics] = useState([]);
  const [activeLevel, setActiveLevel] = useState('A1');
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('grammar_topics')
        .select('*, levels(code)')
        .order('sort_order');

      setTopics(data || []);
      setLoading(false);
    }

    load();
  }, []);

  const filtered = topics.filter((t) => t.levels?.code === activeLevel);
  const visible = filtered.slice(0, role === 'guest' && activeLevel !== 'A1' ? 0 : LIMITS[role].grammar);

  if (loading) {
    return (
      <main className="container">
        <p className="muted">جارٍ تحميل القواعد...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <Upsell role={role} feature="القواعد" />

      <div className="page-head">
        <h1 className="page-title">القواعد الألمانية 📘</h1>
        <a className="btn btn-ghost" href="/explore">← تصفح الأقسام</a>
      </div>

      {!active && (
        <>
          <div className="pills" style={{ marginBottom: 20 }}>
            {['A1', 'A2', 'B1', 'B2'].map((l) => (
              <button
                key={l}
                className="pill"
                onClick={() => setActiveLevel(l)}
                style={
                  activeLevel === l
                    ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
                    : {}
                }
              >
                {l}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {visible.map((t) => (
              <button
                key={t.id}
                className="card"
                style={{ textAlign: 'right', cursor: 'pointer' }}
                onClick={() => setActive(t)}
              >
                <div style={{ fontWeight: 800, marginBottom: 4 }}>{t.title_ar}</div>
                <div className="muted small">اضغط لشرح القاعدة مع الأمثلة</div>
              </button>
            ))}
          </div>
        </>
      )}

      {active && (
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
              marginBottom: 14,
            }}
          >
            <b style={{ fontSize: 18 }}>{active.title_ar}</b>
            <button className="btn btn-ghost" onClick={() => setActive(null)}>
              ← كل القواعد
            </button>
          </div>

          <div style={{ lineHeight: 2, marginBottom: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>الشرح:</div>
            <div style={{ whiteSpace: 'pre-wrap' }}>{active.explanation_ar}</div>
          </div>

          <div style={{ lineHeight: 2, marginBottom: 16 }}>
            <div style={{ fontWeight: 800, marginBottom: 8 }}>القاعدة الألمانية:</div>
            <div dir="ltr" style={{ whiteSpace: 'pre-wrap', textAlign: 'left' }}>
              {active.rule_de}
            </div>
          </div>

          {(active.examples || []).length > 0 && (
            <div style={{ lineHeight: 2 }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>أمثلة:</div>
              {active.examples.map((ex, i) => (
                <div
                  key={i}
                  className="card"
                  style={{ background: '#f8fafc', marginBottom: 8, padding: 12 }}
                >
                  <div dir="ltr" style={{ fontWeight: 700, textAlign: 'left', marginBottom: 4 }}>
                    {ex.de}
                  </div>
                  <div className="muted">{ex.ar}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}