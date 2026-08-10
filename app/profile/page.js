'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [email, setEmail] = useState('');
  const [goal, setGoal] = useState(10);
  const [toast, setToast] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session) {
        window.location.href = '/login';
        return;
      }

      setEmail(session.user.email);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      setProfile(profileData);
      setGoal(profileData?.daily_goal_minutes ?? 10);
      setLoading(false);
    }

    load();
  }, []);

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  }

  async function saveGoal() {
    if (!profile) return;

    const { error } = await supabase
      .from('profiles')
      .update({ daily_goal_minutes: goal })
      .eq('id', profile.id);

    if (error) {
      showToast('حدث خطأ: ' + error.message);
      return;
    }

    setProfile({ ...profile, daily_goal_minutes: goal });
    showToast('تم حفظ الهدف اليومي ✅');
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  if (loading) {
    return (
      <main className="container">
        <p className="muted">جارٍ التحميل...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="page-head">
        <h1 className="page-title">حسابي 👤</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a className="btn btn-ghost" href="/dashboard">لوحة التعلم</a>
          <a className="btn btn-ghost" href="/stats">الإحصائيات</a>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 900 }}>
          {profile?.full_name || 'متعلم الألمانية'}
        </h2>
        <p className="muted small" style={{ margin: '0 0 18px' }}>{email}</p>

        <div className="stat-grid" style={{ marginBottom: 0 }}>
          <div className="stat">
            <b>{profile?.current_level ?? 'A1'}</b>
            <span>المستوى الحالي</span>
          </div>
          <div className="stat">
            <b>{profile?.points ?? 0}</b>
            <span>النقاط ⭐</span>
          </div>
          <div className="stat">
            <b>{profile?.streak ?? 0} 🔥</b>
            <span>سلسلة الأيام</span>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h2 className="section-title">الهدف اليومي</h2>
        <p className="muted small">كم دقيقة تريد أن تتعلم يوميًا؟</p>

        <select
          className="input"
          value={goal}
          onChange={(e) => setGoal(Number(e.target.value))}
          style={{ marginBottom: 12 }}
        >
          <option value={5}>5 دقائق</option>
          <option value={10}>10 دقائق</option>
          <option value={20}>20 دقيقة</option>
          <option value={30}>30 دقيقة</option>
        </select>

        <br />
        <button className="btn btn-primary" onClick={saveGoal}>حفظ الهدف</button>
      </div>

      <div className="card">
        <h2 className="section-title">الحساب</h2>
        <button
          className="btn"
          style={{ background: '#fee2e2', color: '#dc2626' }}
          onClick={handleLogout}
        >
          تسجيل الخروج
        </button>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}