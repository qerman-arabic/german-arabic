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
  background: '#2563eb',
  color: '#fff',
  fontWeight: 800,
  cursor: 'pointer',
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

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

          {message && (
            <div style={{ marginTop: 12, color: '#dc2626', fontWeight: 700 }}>{message}</div>
          )}
        </form>

        <p style={{ textAlign: 'center', marginTop: 14, color: '#64748b' }}>
          ليس لديك حساب؟{' '}
          <a href="/register" style={{ color: '#2563eb', fontWeight: 700 }}>
            إنشاء حساب
          </a>
        </p>
      </div>
    </main>
  );
}