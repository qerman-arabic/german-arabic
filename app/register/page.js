'use client';

import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    window.location.href = '/dashboard';
  }

  return (
    <main className="container">
      <div className="auth-wrap">
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <div className="level-code">🌱</div>
            <h1 className="page-title">إنشاء حساب جديد</h1>
            <p className="muted small">ابدأ رحلتك مع الألمانية اليوم.</p>
          </div>

          <form onSubmit={handleRegister}>
            <div className="field">
              <label>الاسم</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>البريد الإلكتروني</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>كلمة المرور</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'جارٍ الإنشاء...' : 'إنشاء الحساب'}
            </button>

            {error && <p className="error-text">{error}</p>}
          </form>

          <p className="muted small" style={{ textAlign: 'center', marginTop: 14 }}>
            لديك حساب بالفعل؟ <a className="link" href="/login">سجّل دخولك</a>
          </p>
        </div>

  function google() {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' },
    });
  }

          <button
            type="button"
            onClick={google}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '12px 0',
              borderRadius: 12,
              border: '1px solid #ddd',
              background: '#fff',
              fontWeight: 800,
              cursor: 'pointer',
              marginBottom: 12,
            }}
          >
            <span style={{ fontSize: 18 }}>🇬</span>
            متابعة عبر Google
          </button>

          <div
            style={{
              textAlign: 'center',
              color: 'var(--muted)',
              fontSize: 12,
              margin: '0 0 12px',
            }}
          >
            — أو بالبريد وكلمة السر —
          </div>

        <p style={{ textAlign: 'center', marginTop: 14 }}>
          <a className="link" href="/">← الصفحة الرئيسية</a>
        </p>
      </div>
    </main>
  );
}