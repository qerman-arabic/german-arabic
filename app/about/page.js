'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AboutPage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function count(table) {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      return count ?? 0;
    }

    async function load() {
      const [lessons, words, grammar, listening, speaking, writing, reading] =
        await Promise.all([
          count('lessons'),
          count('words'),
          count('grammar_topics'),
          count('listening_exercises'),
          count('speaking_scenarios'),
          count('writing_tasks'),
          count('reading_texts'),
        ]);

      setStats({ lessons, words, grammar, listening, speaking, writing, reading });
    }

    load();
  }, []);

  const items = stats
    ? [
        { icon: '🎯', label: 'المستويات', value: 4 },
        { icon: '📘', label: 'الدروس', value: stats.lessons },
        { icon: '📖', label: 'المفردات المترجمة', value: stats.words },
        { icon: '📐', label: 'القواعد الشاملة', value: stats.grammar },
        { icon: '📄', label: 'نصوص القراءة والاستماع', value: stats.reading },
        { icon: '🎧', label: 'مقاطع الاستماع', value: stats.listening },
        { icon: '🗣️', label: 'سيناريوهات الشفوي', value: stats.speaking },
        { icon: '✍️', label: 'مهام الكتابة', value: stats.writing },
        { icon: '🎓', label: 'نماذج Goethe', value: 60 },
        { icon: '🏅', label: 'شهادات الإتمام', value: 4 },
      ]
    : [];

  const total = stats
    ? stats.lessons +
      stats.words +
      stats.grammar +
      stats.listening +
      stats.speaking +
      stats.writing +
      stats.reading
    : 0;

  return (
    <main className="container">
      <div className="page-head">
        <h1 className="page-title">المنصة بالأرقام 🔢</h1>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      <div
        className="card"
        style={{
          textAlign: 'center',
          background: 'linear-gradient(135deg, #0f766e, #10b981)',
          color: '#fff',
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 44, fontWeight: 900 }}>
          {stats ? total.toLocaleString('ar-EG') : '...'}
        </div>
        <div style={{ opacity: 0.9, fontWeight: 700 }}>
          عنصرًا تعليميًا من دروس وكلمات وقواعد وتدريبات
        </div>
        <div className="chip" style={{ marginTop: 10, background: 'rgba(255,255,255,.2)', color: '#fff' }}>
          تُحدَّث الأرقام مباشرة من قاعدة البيانات
        </div>
      </div>

      {!stats && <p className="muted">جارٍ العد...</p>}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
        }}
      >
        {items.map((it) => (
          <div key={it.label} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 30, marginBottom: 6 }}>{it.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--primary-dark)' }}>
              {it.value.toLocaleString('ar-EG')}
            </div>
            <div className="muted small" style={{ fontWeight: 700 }}>
              {it.label}
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 20, lineHeight: 2 }}>
        <b>German بالعربي</b> — منصة عربية متكاملة لإعدادك لامتحان Goethe من A1 حتى B2:
        دروس مترابطة، مفردات، قواعد شاملة، استماع، قراءة، كتابة، شفوي بالذكاء الاصطناعي،
        نماذج امتحان، وشهادات إتمام.
      </div>
    </main>
  );
}