'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

const ADMIN_EMAIL = 'moayad.ahmad2014@gmail.com';

function isActive(u) {
  return (
    u.is_premium &&
    (!u.premium_until || new Date(u.premium_until).getTime() > Date.now())
  );
}

function statusText(u) {
  if (!isActive(u)) return u.is_premium ? '⏰ منتهي' : 'مجاني';
  if (!u.premium_until) return '💎 دائم';
  const left = Math.ceil(
    (new Date(u.premium_until).getTime() - Date.now()) / 86400000
  );
  return `💎 متبقٍ ${left} يوم`;
}

export default function PremiumAdminPage() {
  const [users, setUsers] = useState([]);
  const [allowed, setAllowed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session || session.user.email !== ADMIN_EMAIL) {
        setAllowed(false);
        return;
      }

      setAllowed(true);

      const { data: rows, error: err } = await supabase
        .from('profiles')
        .select('*')
        .order('points', { ascending: false });

      if (err) {
        setError(err.message);
        return;
      }

      setUsers(rows || []);
    }

    load();
  }, []);

  async function activate(u, days) {
    const until = days
      ? new Date(Date.now() + days * 86400000).toISOString()
      : null;

    await supabase
      .from('profiles')
      .update({ is_premium: true, premium_until: until })
      .eq('id', u.id);

    setUsers((prev) =>
      prev.map((x) =>
        x.id === u.id ? { ...x, is_premium: true, premium_until: until } : x
      )
    );
  }

  async function cancel(u) {
    await supabase
      .from('profiles')
      .update({ is_premium: false, premium_until: null })
      .eq('id', u.id);

    setUsers((prev) =>
      prev.map((x) =>
        x.id === u.id ? { ...x, is_premium: false, premium_until: null } : x
      )
    );
  }

  if (!allowed) {
    return (
      <main className="container" style={{ textAlign: 'center', padding: 60 }}>
        <p className="muted" style={{ fontWeight: 800 }}>هذه الصفحة للمدير فقط.</p>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="page-head">
        <h1 className="page-title">إدارة المشتركين 💎</h1>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      {error && (
        <div className="card" style={{ background: '#fef2f2', color: '#b91c1c', marginBottom: 14 }}>
          خطأ: {error}
        </div>
      )}

      <p className="muted small" style={{ marginBottom: 14 }}>
        عدد المستخدمين: {users.length}
      </p>

      <div style={{ display: 'grid', gap: 10 }}>
        {users.map((u) => (
          <div key={u.id} className="card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 10,
                marginBottom: 10,
              }}
            >
              <div>
                <b>{u.email || u.full_name || 'مستخدم'}</b>
                <div className="muted small">
                  {u.full_name || ''} — {u.points || 0} نقطة
                </div>
              </div>
              <span className="chip">{statusText(u)}</span>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn" style={{ background: '#e5e7eb' }} onClick={() => activate(u, 30)}>
                شهر (30 يوم)
              </button>
              <button className="btn" style={{ background: '#e5e7eb' }} onClick={() => activate(u, 90)}>
                3 أشهر (90 يوم)
              </button>
              <button className="btn" style={{ background: '#16a34a', color: '#fff' }} onClick={() => activate(u, null)}>
                دائم ♾️
              </button>
              {u.is_premium && (
                <button className="btn" style={{ background: '#dc2626', color: '#fff' }} onClick={() => cancel(u)}>
                  إلغاء
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}