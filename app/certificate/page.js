'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function CertificatePage() {
  const [userId, setUserId] = useState('');
  const [userName, setUserName] = useState('');
  const [points, setPoints] = useState(0);
  const [levels, setLevels] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session) {
        window.location.href = '/login';
        return;
      }

      setUserId(session.user.id);

      const [profileRes, levelsRes, progressRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase
          .from('levels')
          .select('*, modules(*, lessons(*))')
          .order('sort_order'),
        supabase
          .from('lesson_progress')
          .select('lesson_id, status')
          .eq('user_id', session.user.id),
      ]);

      setUserName(profileRes.data?.full_name || session.user.email);
      setPoints(profileRes.data?.points ?? 0);
      setLevels(levelsRes.data || []);
      setCompleted(
        (progressRes.data || [])
          .filter((p) => p.status === 'completed')
          .map((p) => p.lesson_id)
      );
      setLoading(false);
    }

    load();
  }, []);

  const stats = levels.map((level) => {
    const lessons = (level.modules || []).flatMap((m) => m.lessons || []);
    const done = lessons.filter((l) => completed.includes(l.id)).length;
    return {
      level,
      total: lessons.length,
      done,
      complete: lessons.length > 0 && done === lessons.length,
    };
  });

  const current = stats.find((s) => s.level.id === selected);

  const today = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return (
      <main className="container">
        <p className="muted">جارٍ التحميل...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #cert, #cert * { visibility: visible; }
          #cert { position: fixed; inset: 0; width: 100%; margin: 0; border-radius: 0; }
        }
      `}</style>

      <div className="page-head no-print">
        <h1 className="page-title">شهاداتي 🎓</h1>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      <div className="pills no-print" style={{ marginBottom: 20 }}>
        {stats.map((s) => (
          <button
            key={s.level.id}
            className="pill"
            onClick={() => setSelected(s.level.id)}
            style={
              selected === s.level.id
                ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
                : {}
            }
          >
            {s.complete ? '🎓' : '🔒'} {s.level.code}
          </button>
        ))}
      </div>

      {!current && (
        <div className="card no-print">
          <p className="muted" style={{ margin: 0, lineHeight: 2 }}>
            أكمل جميع دروس أي مستوى لتحصل على شهادة إتمام رسمية باسمك قابلة للتحميل PDF.
          </p>
          <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
            {stats.map((s) => (
              <div key={s.level.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 800 }}>{s.level.name_ar}</span>
                  <span className="muted small">
                    {s.done}/{s.total} درسًا
                  </span>
                </div>
                <div className="progress" style={{ margin: 0 }}>
                  <div
                    className="progress-fill"
                    style={{ width: `${s.total ? Math.round((s.done / s.total) * 100) : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {current && !current.complete && (
        <div className="card no-print" style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 800, marginBottom: 8 }}>
            🔒 شهادة {current.level.code} مقفلة
          </p>
          <p className="muted" style={{ marginBottom: 14 }}>
            أكملت {current.done} من {current.total} درسًا. أكمل الباقي لفتح الشهادة.
          </p>
          <a className="btn btn-primary" href="/dashboard">متابعة التعلم</a>
        </div>
      )}

      {current && current.complete && (
        <>
          <div
            id="cert"
            style={{
              background: '#fff',
              border: '14px solid #0f766e',
              outline: '4px solid #f59e0b',
              outlineOffset: '-24px',
              borderRadius: 8,
              padding: '50px 30px',
              textAlign: 'center',
              position: 'relative',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 6 }}>🇩🇪</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0f766e', letterSpacing: 2 }}>
              GERMAN بالعربي
            </div>

            <h2 style={{ fontSize: 34, fontWeight: 900, margin: '18px 0 6px', color: '#0f172a' }}>
              شهادة إتمام
            </h2>
            <p style={{ color: '#64748b', marginBottom: 22 }}>
              تُمنح هذه الشهادة بكل فخر إلى
            </p>

            <div
              style={{
                fontSize: 30,
                fontWeight: 900,
                color: '#0f766e',
                borderBottom: '2px solid #f59e0b',
                display: 'inline-block',
                padding: '0 30px 8px',
                marginBottom: 22,
              }}
            >
              {userName}
            </div>

            <p style={{ lineHeight: 2, maxWidth: 560, margin: '0 auto 22px', color: '#334155' }}>
              لإتمامه بنجاح جميع دروس ومتطلبات{' '}
              <b>{current.level.name_ar}</b> في منصة German بالعربي،
              واجتيازه التمارين والاختبارات المقررة فيه.
            </p>

            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 30,
                flexWrap: 'wrap',
                marginBottom: 26,
              }}
            >
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f766e' }}>
                  {current.done}/{current.total}
                </div>
                <div className="muted small">درسًا مكتملًا</div>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f766e' }}>{points}</div>
                <div className="muted small">نقطة إجمالية</div>
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#0f766e' }}>{today}</div>
                <div className="muted small">تاريخ الإصدار</div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                maxWidth: 560,
                margin: '0 auto',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 800 }}>إدارة المنصة</div>
                <div className="muted small">التوقيع</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="muted small">
                  رقم الشهادة: {current.level.code}-
                  {userId.slice(0, 6).toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          <div className="no-print" style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => window.print()}>
              ⬇️ تحميل الشهادة PDF
            </button>
          </div>
        </>
      )}
    </main>
  );
}