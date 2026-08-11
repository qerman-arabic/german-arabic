'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';

const ADMIN_EMAIL = 'moayad.ahmad2014@gmail.com';

export default function PremiumAdminPage() {
  const [users, setUsers] = useState([]);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session || session.user.email !== ADMIN_EMAIL) {
        setAllowed(false);
        return;
      }

      setAllowed(true);
      const { data: rows } = await supabase
        .from('profiles')
        .select('id, full_name, email, points, is_premium')
        .order('points', { ascending: false });

      setUsers(rows || []);
    }
    load();
  }, []);

  async function toggle(u) {
    const next = !u.is_premium;

    await supabase
      .from('profiles')
      .update({ is_premium: next })
      .eq('id', u.id);

    setUsers((prev) =>
      prev.map((x) => (x.id === u.id ? { ...x, is_premium: next } : x))
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

      <div style={{ display: 'grid', gap: 10 }}>
        {users.map((u) => (
          <div
            key={u.id}
            className="card"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div>
              <b>{u.full_name || u.email}</b>
              <div className="muted small">{u.email} — {u.points} نقطة</div>
            </div>
            <button
              className="btn"
              style={
                u.is_premium
                  ? { background: '#16a34a', color: '#fff' }
                  : { background: '#e5e7eb', color: '#111827' }
              }
              onClick={() => toggle(u)}
            >
              {u.is_premium ? '✅ Premium — اضغط للإلغاء' : 'تفعيل Premium'}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}