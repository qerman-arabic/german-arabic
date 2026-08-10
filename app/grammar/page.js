'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function GrammarPage() {
  const [topics, setTopics] = useState([]);
  const [activeLevel, setActiveLevel] = useState('A1');
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <main className="container">
        <p className="muted">جارٍ تحميل القواعد...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="page-head">
        <h1 className="page-title">القواعد الألمانية 📘</h1>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      <div className="pills" style={{ marginBottom: 20 }}>
        {['A1', 'A2', 'B1'].map((l) => (
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

      {filtered.length === 0 && (
        <div className="card">
          <p className="muted">لا توجد قواعد لهذا المستوى بعد.</p>
        </div>
      )}

      {filtered.map((topic) => {
        const deList = (topic.examples_de || '').split(' / ');
        const arList = (topic.examples_ar || '').split(' / ');

        return (
          <div key={topic.id} className="card" style={{ marginBottom: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 10,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900 }}>{topic.title_ar}</h2>
              <span className="chip">{topic.title_de}</span>
            </div>

            <p className="muted" style={{ lineHeight: 2, marginBottom: 14 }}>
              {topic.explanation_ar}
            </p>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid var(--line)',
                borderRadius: 14,
                padding: 14,
              }}
            >
              {deList.map((de, i) => (
                <div key={i} style={{ marginBottom: i < deList.length - 1 ? 10 : 0 }}>
                  <div style={{ fontWeight: 700 }}>{de}</div>
                  <div className="muted small">{arList[i] || ''}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </main>
  );
}