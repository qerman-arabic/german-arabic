'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRole } from '../../lib/access';

export default function CertificatePage() {
  const { role, userId, profile } = useRole();
  const [levels, setLevels] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: levelsRes } = await supabase
        .from('levels')
        .select('*, modules(*, lessons(*))')
        .order('sort_order');

      setLevels(levelsRes || []);

      if (userId) {
        const { data: p } = await supabase
          .from('lesson_progress')
          .select('lesson_id, status')
          .eq('user_id', userId);

        setCompleted(
          (p || [])
            .filter((x) => x.status === 'completed')
            .map((x) => x.lesson_id)
        );
      }

      setLoading(false);
    }

    load();
  }, [userId]);

  if (role === 'guest') {
    return (
      <main className="container" style={{ textAlign: 'center', padding: 60 }}>
        <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🏅</div>
          <b style={{ fontSize: 18 }}>سجّل الدخول لرؤية شهاداتك</b>
          <p className="muted" style={{ margin: '8px 0 14px' }}>
            أكمل المستويات واحصل على شهادات إتمام باسمك.
          </p>
          <a className="btn btn-primary btn-lg" href="/login">تسجيل الدخول</a>
        </div>
      </main>
    );
  }

  if (role === 'free') {
    return (
      <main className="container" style={{ textAlign: 'center', padding: 60 }}>
        <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🔒</div>
          <b style={{ fontSize: 18 }}>الشهادات ميزة Premium</b>
          <p className="muted" style={{ margin: '8px 0 14px', lineHeight: 1.9 }}>
            تعلّم مجانًا كما تشاء، وعند إتمام مستوى احصل على شهادة PDF موثقة
            باسمك مع الاشتراك المميز.
          </p>
          <a className="btn btn-primary btn-lg" href="/premium">💎 شاهد الباقات</a>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="container" style={{ textAlign: 'center', padding: 60 }}>
        <p className="muted" style={{ fontWeight: 800 }}>جارٍ التحميل...</p>
      </main>
    );
  }

  const certs = levels
    .map((level) => {
      const all = (level.modules || []).flatMap((m) => m.lessons || []);
      const done = all.filter((l) => completed.includes(l.id)).length;
      return {
        level,
        total: all.length,
        done,
        complete: all.length > 0 && done === all.length,
      };
    })
    .filter((c) => c.complete);

  return (
    <main className="container">
      <div className="page-head">
        <h1 className="page-title">شهاداتي 🏅</h1>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      {certs.length === 0 && (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}></div>
          <p style={{ fontWeight: 800 }}>
            لم تكمل أي مستوى بعد — أكمل كل دروس المستوى لتحصل على شهادته.
          </p>
        </div>
      )}

      {certs.map((c) => (
        <div
          key={c.level.id}
          className="card"
          style={{
            textAlign: 'center',
            border: '3px double var(--primary)',
            padding: 30,
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 6 }}>🏅</div>
          <div className="muted small">شهادة إتمام</div>
          <h2 style={{ fontSize: 26, fontWeight: 900, margin: '8px 0' }}>
            {profile?.full_name || 'متعلم متميز'}
          </h2>
          <p style={{ marginBottom: 4 }}>أتمّ بنجاح جميع دروس مستوى</p>
          <div className="level-badge" style={{ margin: '0 auto 10px' }}>{c.level.code}</div>
          <p className="muted small">
            {c.done} درسًا — German بالعربي —{' '}
            {new Date().toLocaleDateString('ar-EG')}
          </p>
          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={() => window.print()}>
            🖨️ طباعة / حفظ PDF
          </button>
        </div>
      ))}
    </main>
  );
}