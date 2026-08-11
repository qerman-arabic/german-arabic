'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

export default function LevelPage({ params }) {
  const [level, setLevel] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session;

        if (!session) {
          window.location.href = '/login';
          return;
        }

        const [levelRes, progressRes] = await Promise.all([
          supabase
            .from('levels')
            .select('*, modules(*, lessons(*))')
            .eq('id', params.id)
            .maybeSingle(),
          supabase
            .from('lesson_progress')
            .select('lesson_id, status')
            .eq('user_id', session.user.id),
        ]);

        if (levelRes.error) {
          setError('خطأ من القاعدة: ' + levelRes.error.message);
          return;
        }

        if (!levelRes.data) {
          setError('لم يتم العثور على هذا المستوى.');
          return;
        }

        setLevel(levelRes.data);
        setCompleted(
          (progressRes.data || [])
            .filter((p) => p.status === 'completed')
            .map((p) => p.lesson_id)
        );
      } catch (e) {
        setError('تعذر تحميل المستوى: ' + (e?.message || 'خطأ غير متوقع'));
      }
    }

    load();
  }, [params.id]);

  if (error) {
    return (
      <main className="container" style={{ textAlign: 'center', padding: 60 }}>
        <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>⚠️</div>
          <p style={{ fontWeight: 800, marginBottom: 12 }}>{error}</p>
          <a className="btn btn-primary" href="/dashboard">← العودة للوحة التعلم</a>
        </div>
      </main>
    );
  }

  if (!level) {
    return (
      <main className="container" style={{ textAlign: 'center', padding: 60 }}>
        <p className="muted" style={{ fontWeight: 800 }}>جارٍ التحميل...</p>
      </main>
    );
  }

  const allLessons = (level.modules || []).flatMap((m) => m.lessons || []);
  const doneCount = allLessons.filter((l) => completed.includes(l.id)).length;
  const pct = allLessons.length ? Math.round((doneCount / allLessons.length) * 100) : 0;

  return (
    <main className="container">
      <div className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="level-badge">{level.code}</div>
          <h1 className="page-title" style={{ margin: 0 }}>{level.name_ar}</h1>
        </div>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="progress" style={{ marginBottom: 6 }}>
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="muted small">
          أكملت {doneCount} من {allLessons.length} درسًا ({pct}%)
        </div>
      </div>

      {(level.modules || []).map((module) => (
        <section key={module.id} className="card" style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 19, fontWeight: 900, marginBottom: 4 }}>{module.title_ar}</h2>
          <p className="muted small" style={{ marginBottom: 14 }}>{module.description_ar}</p>

          <div style={{ display: 'grid', gap: 10 }}>
            {(module.lessons || []).map((lesson) => {
              const done = completed.includes(lesson.id);

              return (
                <a
                  key={lesson.id}
                  className={`lesson ${done ? 'done' : ''}`}
                  href={`/lesson/${lesson.id}`}
                >
                  <span>{done ? '✅' : '📘'}</span>
                  <span className="lesson-title">{lesson.title_ar}</span>
                  <span className="lesson-cta">{done ? 'مكتمل' : 'ابدأ'}</span>
                </a>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}