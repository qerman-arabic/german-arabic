'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function StatsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [progressRows, setProgressRows] = useState([]);
  const [totalLessons, setTotalLessons] = useState(0);
  const [cardsCount, setCardsCount] = useState(0);
  const [dueCount, setDueCount] = useState(0);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session) {
        window.location.href = '/login';
        return;
      }

      const today = new Date().toISOString().slice(0, 10);

      const [profileRes, progressRes, lessonsRes, cardsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('lesson_progress').select('*').eq('user_id', session.user.id),
        supabase.from('lessons').select('*', { count: 'exact', head: true }),
        supabase.from('flashcards').select('next_review_date').eq('user_id', session.user.id),
      ]);

      setProfile(profileRes.data);
      setProgressRows(progressRes.data || []);
      setTotalLessons(lessonsRes.count || 0);

      const cards = cardsRes.data || [];
      setCardsCount(cards.length);
      setDueCount(cards.filter((c) => !c.next_review_date || c.next_review_date <= today).length);

      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <main className="container">
        <p className="muted">جارٍ التحميل...</p>
      </main>
    );
  }

  const completed = progressRows.filter((p) => p.status === 'completed');
  const percent = totalLessons ? Math.round((completed.length / totalLessons) * 100) : 0;
  const scored = progressRows.filter((p) => typeof p.score === 'number');
  const avgScore = scored.length
    ? Math.round(scored.reduce((s, p) => s + p.score, 0) / scored.length)
    : 0;

  return (
    <main className="container">
      <div className="page-head">
        <h1 className="page-title">الإحصائيات 📊</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a className="btn btn-ghost" href="/dashboard">لوحة التعلم</a>
          <a className="btn btn-ghost" href="/profile">حسابي</a>
        </div>
      </div>

      <div className="stat-grid">
        <div className="card stat">
          <b>{completed.length}/{totalLessons}</b>
          <span>دروس مكتملة</span>
        </div>
        <div className="card stat">
          <b>{percent}%</b>
          <span>نسبة الإكمال</span>
        </div>
        <div className="card stat">
          <b>{avgScore}%</b>
          <span>متوسط النتائج</span>
        </div>
        <div className="card stat">
          <b>{profile?.points ?? 0}</b>
          <span>النقاط ⭐</span>
        </div>
        <div className="card stat">
          <b>{profile?.streak ?? 0} 🔥</b>
          <span>سلسلة الأيام</span>
        </div>
        <div className="card stat">
          <b>{cardsCount}</b>
          <span>بطاقات المراجعة</span>
        </div>
        <div className="card stat">
          <b>{dueCount}</b>
          <span>مستحقة اليوم</span>
        </div>
      </div>

      <div className="card">
        <h2 className="section-title">تقدمك العام</h2>
        <div className="progress">
          <div className="progress-fill" style={{ width: `${percent}%` }} />
        </div>
        <p className="muted" style={{ marginTop: 12, lineHeight: 2, marginBottom: 0 }}>
          أكملت {percent}% من الدروس المتاحة حاليًا في المستويات الثلاثة.
          <br />
          واصل التعلم يوميًا للحفاظ على سلسلة الأيام 🔥
        </p>
      </div>
    </main>
  );
}