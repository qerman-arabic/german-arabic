'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AnalysisPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase.auth.getSession();
      if (!s?.session) {
        window.location.href = '/login';
        return;
      }

      const [mistRes, wordsRes] = await Promise.all([
        supabase.from('wrong_words').select('*').eq('user_id', s.session.user.id),
        supabase
          .from('words')
          .select('word_de, lessons(title_ar, modules(levels(code)))'),
      ]);

      const rows = mistRes.data || [];
      const wordMap = {};
      (wordsRes.data || []).forEach((w) => {
        if (!wordMap[w.word_de]) wordMap[w.word_de] = w;
      });

      const active = rows.filter((r) => r.wrong_count > r.right_count);
      const mastered = rows.length - active.length;

      const byLevel = { A1: 0, A2: 0, B1: 0, B2: 0 };
      const byLesson = {};

      active.forEach((r) => {
        const w = wordMap[r.word_de];
        const code = w?.lessons?.modules?.levels?.code;
        const lesson = w?.lessons?.title_ar;

        if (code && byLevel[code] !== undefined) byLevel[code] += 1;
        if (lesson) byLesson[lesson] = (byLesson[lesson] || 0) + 1;
      });

      const topLessons = Object.entries(byLesson)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const topWords = rows
        .filter((r) => r.wrong_count >= 2)
        .sort((a, b) => b.wrong_count - a.wrong_count)
        .slice(0, 10);

      const totalWrong = rows.reduce((n, r) => n + r.wrong_count, 0);
      const totalRight = rows.reduce((n, r) => n + r.right_count, 0);
      const accuracy =
        totalWrong + totalRight > 0
          ? Math.round((totalRight / (totalWrong + totalRight)) * 100)
          : 0;

      const worstLevel = Object.entries(byLevel).sort((a, b) => b[1] - a[1])[0];

      setData({
        rows,
        active,
        mastered,
        byLevel,
        topLessons,
        topWords,
        accuracy,
        worstLevel,
      });
    }

    load();
  }, []);

  if (!data) {
    return (
      <main className="container" style={{ textAlign: 'center', padding: 60 }}>
        <p className="muted" style={{ fontWeight: 800 }}>جارٍ التحليل...</p>
      </main>
    );
  }

  if (data.rows.length === 0) {
    return (
      <main className="container">
        <div className="page-head">
          <h1 className="page-title">تحليل الأخطاء 📈</h1>
          <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🧠</div>
          <p style={{ fontWeight: 800, marginBottom: 12 }}>
            لا توجد بيانات بعد — العب جولة اختبار سريع وسيحلل النظام نمط أخطائك هنا.
          </p>
          <a className="btn btn-primary btn-lg" href="/quiz">🎯 ابدأ الاختبار</a>
        </div>
      </main>
    );
  }

  const maxLevel = Math.max(...Object.values(data.byLevel), 1);

  const recs = [];
  if (data.worstLevel && data.worstLevel[1] > 0) {
    recs.push({
      icon: '📚',
      text: `مفردات ${data.worstLevel[0]} أضعف مستوياتك (${data.worstLevel[1]} كلمة نشطة) — خصص لها جولتي اختبار سريع يوميًا.`,
      href: '/quiz',
      btn: 'اختبار سريع',
    });
    recs.push({
      icon: '📘',
      text: `بما أن معظم أخطائك في ${data.worstLevel[0]}، راجع قواعد هذا المستوى لتثبيت الأساس.`,
      href: '/grammar',
      btn: 'قواعد ' + data.worstLevel[0],
    });
  }
  if (data.topLessons[0]) {
    recs.push({
      icon: '🎯',
      text: `أكثر موضوع تخطئ به: «${data.topLessons[0][0]}» — أعد قراءة درسه في لوحتك.`,
      href: '/dashboard',
      btn: 'لوحة التعلم',
    });
  }
  recs.push({
    icon: '📕',
    text: `لديك ${data.active.length} كلمة نشطة في قاموس أخطائك — تدرّب عليها الآن لتتخرجها.`,
    href: '/mistakes',
    btn: 'قاموس أخطائك',
  });

  return (
    <main className="container">
      <div className="page-head">
        <h1 className="page-title">تحليل الأخطاء 📈</h1>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      {/* الملخص */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#dc2626' }}>
            {data.active.length}
          </div>
          <div className="muted small">كلمة ضعيفة نشطة</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: '#16a34a' }}>
            {data.mastered}
          </div>
          <div className="muted small">كلمة أتقنتها</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--primary-dark)' }}>
            {data.accuracy}%
          </div>
          <div className="muted small">دقة إجاباتك الكلية</div>
        </div>
      </div>

      {/* التوزيع حسب المستوى */}
      <div className="card" style={{ marginBottom: 16 }}>
        <h2 className="section-title">أخطاؤك حسب المستوى</h2>
        {Object.entries(data.byLevel).map(([code, n]) => (
          <div key={code} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontWeight: 800 }}>{code}</span>
              <span className="muted small">{n} كلمة</span>
            </div>
            <div className="progress" style={{ margin: 0 }}>
              <div
                className="progress-fill"
                style={{ width: `${(n / maxLevel) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* أضعف المواضيع */}
      {data.topLessons.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 className="section-title">أضعف المواضيع لديك</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {data.topLessons.map(([title, n]) => (
              <span key={title} className="chip">
                {title} × {n}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* الكلمات المتكررة */}
      {data.topWords.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 className="section-title">كلمات تخطئ بها مرارًا</h2>
          <div style={{ display: 'grid', gap: 8 }}>
            {data.topWords.map((w) => (
              <div
                key={w.word_de}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div>
                  <b dir="ltr">{w.word_de}</b>{' '}
                  <span className="muted small">{w.word_ar}</span>
                </div>
                <span className="chip">❌ {w.wrong_count} مرات</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* التوصيات */}
      <div className="card" style={{ background: '#f0fdf4' }}>
        <h2 className="section-title"> توصيات ذكية لك</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {recs.map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: 220, lineHeight: 1.9 }}>
                {r.icon} {r.text}
              </div>
              <a className="btn btn-primary" href={r.href}>{r.btn}</a>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}