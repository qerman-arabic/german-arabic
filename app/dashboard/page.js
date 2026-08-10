'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [profile, setProfile] = useState(null);
  const [levels, setLevels] = useState([]);
  const [completedLessons, setCompletedLessons] = useState([]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session) {
        window.location.href = '/login';
        return;
      }

      const [profileRes, levelsRes, progressRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase
          .from('levels')
          .select('*, modules(*, lessons(*))')
          .order('sort_order')
          .order('sort_order', { foreignTable: 'modules' })
          .order('sort_order', { foreignTable: 'modules.lessons' }),
        supabase
          .from('lesson_progress')
          .select('lesson_id, status')
          .eq('user_id', session.user.id),
      ]);

      setUserName(profileRes.data?.full_name || session.user.email);
      setProfile(profileRes.data);
      setLevels(levelsRes.data || []);
      setCompletedLessons(
        (progressRes.data || [])
          .filter((p) => p.status === 'completed')
          .map((p) => p.lesson_id)
      );
      setLoading(false);
    }

    load();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  if (loading) {
    return (
      <main className="container" style={{ textAlign: 'center', padding: 60 }}>
        <p className="muted" style={{ fontWeight: 800 }}>جارٍ التحميل...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="banner">
        <div>
          <h1>مرحبًا، {userName} 👋</h1>
          <p>هدفك اليومي: {profile?.daily_goal_minutes ?? 10} دقائق من التعلم المنتظم.</p>
        </div>
        <div className="banner-stats">
          <div className="bstat">
            <b>{profile?.points ?? 0}</b>
            <span>نقطة ⭐</span>
          </div>
          <div className="bstat">
            <b>{profile?.streak ?? 0}</b>
            <span>أيام متتالية 🔥</span>
          </div>
        </div>
      </div>

      <nav className="pills">
        <a className="pill" href="/ai">المعلم الذكي 🤖</a>
        <a className="pill" href="/goethe">نماذج Goethe 🎓</a>
        <a className="pill" href="/grammar">القواعد 📘</a>
        <a className="pill" href="/review">المراجعة 🧠</a>
        <a className="pill" href="/quiz">اختبار سريع 🎯</a>
        <a className="pill" href="/stats">الإحصائيات 📊</a>
        <a className="pill" href="/profile">حسابي 👤</a>
        <button className="pill pill-danger" onClick={handleLogout}>خروج</button>
      </nav>

      {levels.map((level) => {
        const allLessons = (level.modules || []).flatMap((m) => m.lessons || []);
        const doneCount = allLessons.filter((l) => completedLessons.includes(l.id)).length;
        const pct = allLessons.length
          ? Math.round((doneCount / allLessons.length) * 100)
          : 0;

        return (
          <section key={level.id} className="card level-block">
            <div className="level-head">
              <div>
                <h2>{level.name_ar}</h2>
                <p className="muted small">{level.description_ar}</p>
              </div>
              <div className="level-badge">{level.code}</div>
            </div>

            <div className="progress">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="muted small">
              أكملت {doneCount} من {allLessons.length} درسًا ({pct}%)
            </div>

            {(level.modules || []).map((module) => (
              <div key={module.id} className="module">
                <h4>{module.title_ar}</h4>
                <div className="lessons">
                  {(module.lessons || []).map((lesson) => {
                    const done = completedLessons.includes(lesson.id);

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
              </div>
            ))}
          </section>
        );
      })}
    </main>
  );
}