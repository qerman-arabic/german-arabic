'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const FEATURES = [
  { icon: '🎓', title: 'نماذج بأسلوب Goethe', desc: '60 نموذج امتحان يقيس الاستماع والقراءة والمفردات والقواعد.' },
  { icon: '🤖', title: 'معلم ذكاء اصطناعي', desc: 'يشرح القواعد ويصحح كتابتك ويقيّم نطقك بالعربية.' },
  { icon: '🎧', title: 'استماع وشفوي حقيقيان', desc: '60 مقطعًا و60 سيناريو محاكاة بالمايك كما في الامتحان.' },
  { icon: '🏅', title: 'شهادات إتمام', desc: 'شهادة PDF باسمك عند إنهاء كل مستوى، بنقاط وسلسلة أيام.' },
];

export default function HomePage() {
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
        { icon: '📘', label: 'درسًا مترابطًا', value: stats.lessons },
        { icon: '📖', label: 'كلمة مترجمة', value: stats.words },
        { icon: '📐', label: 'قاعدة شاملة', value: stats.grammar },
        { icon: '📄', label: 'نص قراءة واستماع', value: stats.reading },
        { icon: '🎧', label: 'مقطع استماع', value: stats.listening },
        { icon: '🗣️', label: 'سيناريو شفوي', value: stats.speaking },
        { icon: '✍️', label: 'مهمة كتابة', value: stats.writing },
        { icon: '🎓', label: 'نموذج Goethe', value: 60 },
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
    <main>
      <header
        className="container"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '18px 0',
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 20 }}>🇩 German بالعربي</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a className="btn btn-ghost" href="/login">تسجيل الدخول</a>
          <a className="btn btn-primary" href="/register">إنشاء حساب</a>
        </div>
      </header>

      <section className="container" style={{ textAlign: 'center', padding: '60px 0 30px' }}>
        <span className="chip" style={{ marginBottom: 16 }}>
          منصة عربية متكاملة للتحضير لامتحان Goethe
        </span>
        <h1 style={{ fontSize: 'clamp(30px, 6vw, 54px)', fontWeight: 900, lineHeight: 1.4, margin: '10px 0' }}>
          تعلّم الألمانية <span style={{ color: 'var(--primary)' }}>بالعربية</span>
          <br />
          من الصفر حتى B2
        </h1>
        <p className="muted" style={{ maxWidth: 640, margin: '0 auto 26px', lineHeight: 2 }}>
          دروس مترابطة، مفردات، قواعد شاملة، واستماع وقراءة وكتابة وشفوي بأسلوب
          الامتحان، ومعلم ذكاء اصطناعي يصحح لك — في مكان واحد.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a className="btn btn-primary btn-lg" href="/register">ابدأ التعلم مجانًا</a>
          <a className="btn btn-ghost btn-lg" href="/login">لديّ حساب بالفعل</a>
        </div>
      </section>

      <section className="container" style={{ padding: '20px 0' }}>
        <div
          className="card"
          style={{
            textAlign: 'center',
            background: 'linear-gradient(135deg, #0f766e, #10b981)',
            color: '#fff',
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 46, fontWeight: 900 }}>
            {stats ? total.toLocaleString('ar-EG') : '...'}
          </div>
          <div style={{ opacity: 0.92, fontWeight: 700 }}>
            عنصرًا تعليميًا ينتظرك داخل المنصة
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: 12,
          }}
        >
          {items.map((it) => (
            <div key={it.label} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 4 }}>{it.icon}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--primary-dark)' }}>
                {it.value.toLocaleString('ar-EG')}+
              </div>
              <div className="muted small" style={{ fontWeight: 700 }}>{it.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container" style={{ padding: '26px 0 60px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 14,
          }}
        >
          {FEATURES.map((f) => (
            <div key={f.title} className="card">
              <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
              <b>{f.title}</b>
              <p className="muted small" style={{ margin: '6px 0 0', lineHeight: 1.9 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}