'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import OfferNote from '../../components/OfferNote';

const ADMIN_EMAIL = 'moayad.ahmad2014@gmail.com';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState(null);
  const [levels, setLevels] = useState([]);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [planOpen, setPlanOpen] = useState(false);
  const [planLevel, setPlanLevel] = useState('B1');
  const [planDate, setPlanDate] = useState('');

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
      setPlanLevel(profileRes.data?.plan_level || 'B1');
      setPlanDate(profileRes.data?.plan_exam_date || '');
      setLoading(false);
    }

    load();
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  async function savePlan() {
    if (!planDate) return;

    await supabase
      .from('profiles')
      .update({ plan_level: planLevel, plan_exam_date: planDate })
      .eq('id', profile.id);

    setProfile({ ...profile, plan_level: planLevel, plan_exam_date: planDate });
    setPlanOpen(false);
  }

  async function clearPlan() {
    await supabase
      .from('profiles')
      .update({ plan_level: null, plan_exam_date: null })
      .eq('id', profile.id);

    setProfile({ ...profile, plan_level: null, plan_exam_date: null });
  }

  if (loading) {
    return (
      <main className="container" style={{ textAlign: 'center', padding: 80 }}>
        <p className="muted" style={{ fontWeight: 800 }}>جارٍ التحميل...</p>
      </main>
    );
  }

  // ===== حساب الأيام المتبقية في Premium =====
  const isPremium = profile?.is_premium &&
    (!profile?.premium_until ||
      new Date(profile.premium_until).getTime() > Date.now());

  let premiumLeft = null;
  if (isPremium && profile?.premium_until) {
    premiumLeft = Math.ceil(
      (new Date(profile.premium_until).getTime() - Date.now()) / 86400000
    );
  }

  // ===== حسابات الخطة =====
  const daysLeft = profile?.plan_exam_date
    ? Math.ceil((new Date(profile.plan_exam_date) - new Date()) / 86400000)
    : null;

  const planLevelObj = levels.find((l) => l.code === profile?.plan_level);
  const planLessons = planLevelObj
    ? (planLevelObj.modules || []).flatMap((m) => m.lessons || [])
    : [];
  const remaining = planLessons.filter((l) => !completedLessons.includes(l.id));
  const doneInPlan = planLessons.length - remaining.length;
  const planPct = planLessons.length
    ? Math.round((doneInPlan / planLessons.length) * 100)
    : 0;
  const perDay =
    daysLeft && daysLeft > 0 ? Math.max(1, Math.ceil(remaining.length / daysLeft)) : remaining.length;
  const todayLessons = remaining.slice(0, perDay);

  const features = [
    { href: '/placement', icon: '🎯', title: 'حدد مستواك', desc: 'اختبار ذكي من 20 سؤالًا' },
    { href: '/ai', icon: '🤖', title: 'المعلم الذكي', desc: 'اسأل وصحّح بالألمانية' },
    { href: '/goethe', icon: '🎓', title: 'نماذج Goethe', desc: '60 نموذجًا بأسلوب الامتحان' },
    { href: '/listening', icon: '🎧', title: 'الاستماع', desc: '60 مقطعًا بنبرتين' },
    { href: '/reading', icon: '📖', title: 'القراءة', desc: '60 نصًا طويلًا بأسئلة' },
    { href: '/writing', icon: '✍️', title: 'الكتابة', desc: 'مهام وتصحيح ذكي' },
    { href: '/speaking', icon: '🗣️', title: 'الشفوي', desc: '60 سيناريو بالمايك' },
    { href: '/grammar', icon: '📘', title: 'القواعد', desc: '96 قاعدة شاملة' },
    { href: '/quiz', icon: '🎯', title: 'اختبار سريع', desc: 'يغذي قاموس أخطائك' },
    { href: '/mistakes', icon: '📕', title: 'قاموس أخطائك', desc: 'كلماتك الضعيفة تتجمع هنا' },
    { href: '/analysis', icon: '📈', title: 'تحليل الأخطاء', desc: 'اكتشف نمط ضعفك' },
    { href: '/review', icon: '🧠', title: 'المراجعة الذكية', desc: 'تكرار متباعد للكلمات' },
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
          {isPremium && (
            <div
              className="bstat"
              style={{
                background:
                  premiumLeft !== null && premiumLeft <= 3
                    ? 'rgba(234, 179, 8, .45)'
                    : 'rgba(16, 185, 129, .35)',
              }}
            >
              <b>{premiumLeft !== null ? premiumLeft : '♾️'}</b>
              <span>
                {premiumLeft !== null
                  ? premiumLeft <= 3
                    ? 'يومًا متبقيًا ⏰'
                    : 'يومًا متبقيًا 💎'
                  : 'سنه💎'}
              </span>
            </div>
          )}
          {daysLeft !== null && daysLeft >= 0 && (
            <div className="bstat" style={{ background: 'rgba(255,255,255,.25)' }}>
              <b>{daysLeft}</b>
              <span>يومًا للامتحان 🗓️</span>
            </div>
          )}
          <button className="pill pill-danger" onClick={handleLogout}>خروج</button>
        </div>
      </div>

      {/* ===== بطاقة الخطة الذكية ===== */}
      <div className="card" style={{ marginBottom: 22 }}>
        {!profile?.plan_exam_date ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: 30, marginBottom: 6 }}>🗓️</div>
            <b style={{ fontSize: 17 }}>أنشئ خطتك الذكية</b>
            <p className="muted" style={{ margin: '6px 0 14px', lineHeight: 1.9 }}>
              اختر مستوى امتحانك وتاريخه، وسنوزع الدروس المتبقية على أيامك
              تلقائيًا مع مهام يومية واضحة.
            </p>
            <button className="btn btn-primary" onClick={() => setPlanOpen(!planOpen)}>
              {planOpen ? 'إغلاق' : 'أنشئ خطتي الآن'}
            </button>
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 18 }}>
                🗓️ خطتك لامتحان {profile.plan_level}
                <span className="muted small" style={{ fontWeight: 700 }}>
                  {' '}— {profile.plan_exam_date}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" onClick={() => setPlanOpen(!planOpen)}>
                  تعديل
                </button>
                <button className="btn btn-ghost" onClick={clearPlan}>إلغاء</button>
              </div>
            </div>

            <div className="progress" style={{ marginBottom: 6 }}>
              <div className="progress-fill" style={{ width: `${planPct}%` }} />
            </div>
            <div className="muted small" style={{ marginBottom: 14 }}>
              أنجزت {doneInPlan} من {planLessons.length} درسًا في مستوى خطتك ({planPct}%) —
              مطلوب {perDay} درسًا يوميًا للإنهاء في الوقت.
            </div>

            <b>✅ مهام اليوم:</b>
            <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
              {todayLessons.length === 0 && (
                <div className="chip" style={{ width: 'fit-content' }}>
                  🎉 أكملت كل دروس مستوى خطتك! ركّز على النماذج والمحاكاة.
                </div>
              )}
              {todayLessons.map((l) => (
                <a key={l.id} className="lesson" href={`/lesson/${l.id}`}>
                  <span>📘</span>
                  <span className="lesson-title">{l.title_ar}</span>
                  <span className="lesson-cta">درس اليوم</span>
                </a>
              ))}
              <a className="lesson" href="/quiz">
                <span>🎯</span>
                <span className="lesson-title">جولة اختبار سريع (10 أسئلة)</span>
                <span className="lesson-cta">يومي</span>
              </a>
              <a className="lesson" href="/review">
                <span>🧠</span>
                <span className="lesson-title">جلسة المراجعة الذكية</span>
                <span className="lesson-cta">يومي</span>
              </a>
              {daysLeft !== null && daysLeft <= 30 && (
                <a className="lesson" href="/goethe">
                  <span>🎓</span>
                  <span className="lesson-title">نموذج امتحان تجريبي كامل</span>
                  <span className="lesson-cta">عدّاد نهائي</span>
                </a>
              )}
            </div>
          </>
        )}

        {planOpen && (
          <div
            style={{
              marginTop: 14,
              paddingTop: 14,
              borderTop: '1px solid var(--line)',
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              alignItems: 'flex-end',
            }}
          >
            <div className="field" style={{ flex: 1, minWidth: 140, margin: 0 }}>
              <label>مستوى الامتحان</label>
              <select className="input" value={planLevel} onChange={(e) => setPlanLevel(e.target.value)}>
                {['A1', 'A2', 'B1', 'B2'].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="field" style={{ flex: 1, minWidth: 160, margin: 0 }}>
              <label>تاريخ الامتحان</label>
              <input type="date" className="input" value={planDate} onChange={(e) => setPlanDate(e.target.value)} />
            </div>
            <button className="btn btn-primary" onClick={savePlan}>حفظ الخطة</button>
          </div>
        )}
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
      <OfferNote />
    </main>
  );
}