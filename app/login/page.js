'use client';

import { useState } from 'react';
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

const buttonStyle = {
  width: '100%',
  padding: '12px',
  borderRadius: 12,
  border: 'none',
  background: '#0f766e',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage('حدث خطأ: ' + error.message);
      setLoading(false);
      return;
    }

    window.location.href = '/dashboard';
  }

  async function handleReset(e) {
    e.preventDefault();
    setResetLoading(true);
    setResetMsg('');

    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: window.location.origin + '/reset-password',
    });

    if (error) {
      setResetMsg('خطأ: ' + error.message);
    } else {
      setResetMsg(
        '✅ أرسلنا رابط الاستعادة إلى بريدك — افتحه خلال ساعة. إن لم تجده خلال دقيقة، تفقد مجلد الرسائل المزعجة Spam.'
      );
    }
    setResetLoading(false);
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
          تسجيل الدخول
        </h1>
        <p style={{ color: '#64748b', textAlign: 'center', marginBottom: 24 }}>
          German بالعربي 🇩🇪
        </p>

        <form
          onSubmit={handleLogin}
          style={{
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: 16,
            padding: 20,
          }}
        >
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>البريد الإلكتروني</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="example@mail.com"
            style={inputStyle}
          />

          <label style={{ display: 'block', marginBottom: 6, fontWeight: 700 }}>كلمة المرور</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="******"
            style={inputStyle}
          />

          <button disabled={loading} style={buttonStyle}>
            {loading ? 'جارٍ الدخول...' : 'دخول'}
          </button>

          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button
              type="button"
              onClick={() => { setResetOpen(true); setResetEmail(email); setResetMsg(''); }}
              style={{
                background: 'none',
                border: 'none',
                color: '#0f766e',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: 14,
                textDecoration: 'underline',
              }}
            >
              نسيت كلمة المرور؟
            </button>
          </div>

          {message && (
            <div style={{ marginTop: 12, color: '#dc2626', fontWeight: 700 }}>{message}</div>
          )}
        </form>

        <p style={{ textAlign: 'center', marginTop: 14, color: '#64748b' }}>
          ليس لديك حساب؟{' '}
          <a href="/register" style={{ color: '#0f766e', fontWeight: 700 }}>
            إنشاء حساب
          </a>
        </p>
      </div>

  async function google() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' },
    });
  }

      {resetOpen && (
        <div
          onClick={() => setResetOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 18,
              padding: 26,
              maxWidth: 420,
              width: '100%',
            }}
          >
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>استعادة كلمة المرور</h3>
            <p style={{ color: '#64748b', marginBottom: 14, fontSize: 14, lineHeight: 1.8 }}>
              أدخل بريدك وسنرسل لك رابطًا لإعادة تعيين كلمة المرور.
            </p>
            <form onSubmit={handleReset}>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                required
                placeholder="example@mail.com"
                style={inputStyle}
              />
              <button disabled={resetLoading} style={buttonStyle}>
                {resetLoading ? 'جارٍ الإرسال...' : 'إرسال الرابط'}
              </button>
            </form>
            {resetMsg && (
              <div
                style={{
                  marginTop: 12,
                  padding: 10,
                  borderRadius: 10,
                  background: resetMsg.startsWith('✅') ? '#f0fdf4' : '#fef2f2',
                  color: resetMsg.startsWith('✅') ? '#166534' : '#b91c1c',
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {resetMsg}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}