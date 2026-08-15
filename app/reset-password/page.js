'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  marginBottom: 14,
  outline: 'none',
  background: '#fff',
};

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      const raw =
        window.location.hash.substring(1) || window.location.search.substring(1);
      const params = new URLSearchParams(raw);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
        window.history.replaceState(null, '', window.location.pathname);
      }

      setReady(true);
    }

    init();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();

    if (password.length < 6) {
      setMsg('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (password !== confirm) {
      setMsg('كلمتا المرور غير متطابقتين');
      return;
    }

    setLoading(true);
    setMsg('');

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMsg('خطأ: ' + error.message);
    } else {
      setMsg('');
      setDone(true);
    }
    setLoading(false);
  }

  return (
    <main
      dir="rtl"
      style={{
        minHeight: '100vh',
        padding: '40px 20px',
        fontFamily: 'Tajawal, Arial, sans-serif',
        background: '#f8fafc',
        color: '#0f172a',
      }}
    >
      <div style={{ maxWidth: 460, margin: 'auto' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, textAlign: 'center' }}>
          كلمة مرور جديدة
        </h1>
        <p style={{ color: '#64748b', textAlign: 'center', marginBottom: 24 }}>
          German بالعربي 🇩🇪
        </p>

        <form
          onSubmit={handleSubmit}
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: 20,
          }}
        >
          {done ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 48, marginBottom: 10 }}>✅</div>
              <p style={{ fontWeight: 800, marginBottom: 14 }}>تم تحديث كلمة المرور</p>
              <a
                href="/login"
                style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  background: '#0f766e',
                  color: '#fff',
                  borderRadius: 10,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                تسجيل الدخول
              </a>
            </div>
          ) : (
            <>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>
                كلمة المرور الجديدة
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={inputStyle}
              />
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>
                تأكيد كلمة المرور
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                style={inputStyle}
              />
              <button
                disabled={loading || !ready}
                style={{
                  width: '100%',
                  padding: 12,
                  borderRadius: 12,
                  border: 'none',
                  background: '#0f766e',
                  color: '#fff',
                  fontWeight: 800,
                  cursor: 'pointer',
                }}
              >
                {loading ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور'}
              </button>
            </>
          )}

          {msg && !done && (
            <div style={{ marginTop: 12, color: '#dc2626', fontWeight: 700 }}>{msg}</div>
          )}
        </form>
      </div>
    </main>
  );
}