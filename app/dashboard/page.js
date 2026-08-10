'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const ADMIN_EMAIL = 'moayad.ahmad2014@gmail.com';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
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

      setIsAdmin(session.user.email === ADMIN_EMAIL);

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

  const features = [
    { href: '/ai', icon: '🤖', title: 'المعلم الذكي', desc: 'اسأل وصحّح بالألمانية' },
    { href: '/goethe', icon: '🎓', title: 'نماذج Goethe', desc: '60 نموذجًا بأسلوب الامتحان' },
    { href: '/listening', icon: '🎧', title: 'الاستماع', desc: '60 مقطعًا بنبرتين' },
    { href: '/reading', icon: '📖', title: 'القراءة', desc: '60 نصًا طويلًا بأسئلة' },
    { href: '/writing', icon: '✍️', title: 'الكتابة', desc: 'مهام وتصحيح ذكي' },
    { href: '/speaking', icon: '🗣️', title: 'الشفوي', desc: '60 سيناريو بالمايك' },
    { href: '/grammar', icon: '📘', title: 'القواعد', desc: '96 قاعدة شاملة' },
    { href: '/review', icon: '🧠', title: 'المراجعة الذكية', desc: 'تكرار متباعد للكلمات' },
    { href: '/quiz', icon: '🎯', title: 'اختبار سريع', desc: 'أسئلة عشوائية فورية' },
    { href: '/stats', icon: '📊', title: 'الإحصائيات', desc: 'تقدمك بالأرقام' },
    { href: '/certificate', icon: '🏅', title: 'شهاداتي', desc: 'شهادات PDF باسمك' },
    { href: '/profile', icon: '👤', title: 'حسابي', desc: 'الاسم والهدف اليومي' },
  ];

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
            <span>أيام 🔥</span>
          </div>
          <button className="pill pill-danger" onClick={handleLogout}>خروج</button>
        </div>
      </div>

      {/* الميزات الكبيرة */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
          gap: 14,
          marginBottom: 26,
        }}
      >
        {features.map((f) => (
          <a
            key={f.href}
            href={f.href}
            className="card"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              textAlign: 'center',
              padding: '22px 12px',
              transition: 'transform .15s, box-shadow .15s',
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>{f.icon}</div>
            <div style={{ fontWeight: 900, fontSize: 17, marginBottom: 4 }}>{f.title}</div>
            <div className="muted small">{f.desc}</div>
          </a>
        ))}

        {isAdmin && (
          <a
            href="/admin"
            className="card"
            style={{
              textDecoration: 'none',
              color: '#fff',
              background: '#111827',
              textAlign: 'center',
              padding: '22px 12px',
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 8 }}>🛠️</div>
            <div style={{ fontWeight: 900, fontSize: 17, marginBottom: 4 }}>الإدارة</div>
            <div style={{ opacity: 0.7 }} className="small">إضافة محتوى</div>
          </a>
        )}
      </div>

      {/* المستويات */}
      <h2 className="section-title">مستويات التعلم 🇩</h2>

      <div style={{ display: 'grid', gap: 14 }}>
        {levels.map((level) => {
          const allLessons = (level.modules || []).flatMap((m) => m.lessons || []);
          const doneCount = allLessons.filter((l) => completedLessons.includes(l.id)).length;
          const pct = allLessons.length
            ? Math.round((doneCount / allLessons.length) * 100)
            : 0;

          return (
            <a
              key={level.id}
              href={`/level/${level.id}`}
              className="card"
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div className="level-badge">{level.code}</div>
                  <div>
                    <div style={{ fontWeight: 900, fontSize: 18 }}>{level.name_ar}</div>
                    <div className="muted small">{level.description_ar}</div>
                  </div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 800, color: 'var(--primary-dark)' }}>{pct}%</div>
                  <div className="muted small">
                    {doneCount}/{allLessons.length} درسًا
                  </div>
                </div>
              </div>

              <div className="progress" style={{ marginTop: 12, marginBottom: 0 }}>
                <div className="progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </a>
          );
        })}
      </div>
    </main>
  );
}