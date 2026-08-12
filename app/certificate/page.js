'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRole } from '../../lib/access';

const GERMAN_WISHES = {
  A1: '„Herzlichen Glückwunsch! Dein erster Schritt ist geschafft!"',
  A2: '„Weiter so! Du wirst immer besser!"',
  B1: '„Toll gemacht! Dein Fleiß hat sich gelohnt!"',
  B2: '„Wir sind stolz auf dich!"',
};

export default function CertificatePage() {
  const { role, userId, profile } = useRole();
  const [levels, setLevels] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printId, setPrintId] = useState(null);

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

  function printCert(id) {
    setPrintId(id);
    setTimeout(() => {
      window.print();
      setPrintId(null);
    }, 150);
  }

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
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .cert-active, .cert-active * { visibility: visible; }
          .cert-active { position: absolute; inset: 0; margin: 0; }
        }
      `}</style>

      <div className="page-head">
        <h1 className="page-title">شهاداتي 🏅</h1>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      {certs.length === 0 && (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>🏅</div>
          <p style={{ fontWeight: 800 }}>
            لم تكمل أي مستوى بعد — أكمل كل دروس المستوى لتحصل على شهادته.
          </p>
        </div>
      )}

      {certs.map((c) => {
        const certNo = `GA-${c.level.code}-${new Date().getFullYear()}-${(userId || '')
          .slice(0, 4)
          .toUpperCase()}`;

        return (
          <div key={c.level.id}>
            <div
              className={printId === c.level.id ? 'cert-active' : ''}
              style={{
                background: 'linear-gradient(135deg,#0f766e,#10b981)',
                borderRadius: 26,
                padding: 8,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  background: '#fff',
                  borderRadius: 20,
                  padding: '34px 26px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 12,
                    marginBottom: 6,
                  }}
                >
                  <img
                    src="/logo.png"
                    alt="شعار المنصة"
                    width={64}
                    height={64}
                    style={{ borderRadius: 14 }}
                  />
                  <b style={{ fontSize: 22, color: '#0f766e' }}>German بالعربي</b>
                </div>

                <div className="muted small">شهادة إتمام • Zertifikat</div>

                <div
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    fontSize: 21,
                    color: '#0f766e',
                    margin: '12px 0 4px',
                  }}
                >
                  {GERMAN_WISHES[c.level.code] || GERMAN_WISHES.A1}
                </div>

                <h2 style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', margin: '10px 0' }}>
                  {profile?.full_name || 'متعلم متميز'}
                </h2>

                <p style={{ marginBottom: 8 }}>أتمّ بنجاح جميع دروس مستوى</p>

                <div
                  className="level-badge"
                  style={{ margin: '0 auto 12px', width: 64, height: 64, fontSize: 22 }}
                >
                  {c.level.code}
                </div>

                <p className="muted small">
                  {c.done} درسًا — {new Date().toLocaleDateString('ar-EG')}
                </p>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    marginTop: 24,
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontFamily: 'Georgia, serif',
                        fontStyle: 'italic',
                        fontWeight: 700,
                        color: '#0f766e',
                      }}
                    >
                      إدارة German بالعربي
                    </div>
                    <div className="muted small">التوقيع الرسمي</div>
                  </div>

                  <div className="muted small" style={{ direction: 'ltr' }}>
                    رقم الشهادة: {certNo}
                  </div>

                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=https://german-arabic.vercel.app/"
                    width={80}
                    height={80}
                    style={{ borderRadius: 8 }}
                    alt="QR"
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    height: 8,
                    marginTop: 24,
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ flex: 1, background: '#000' }} />
                  <div style={{ flex: 1, background: '#DD0000' }} />
                  <div style={{ flex: 1, background: '#FFCE00' }} />
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 26 }}>
              <button className="btn btn-primary" onClick={() => printCert(c.level.id)}>
                🖨️ طباعة / حفظ PDF
              </button>
            </div>
          </div>
        );
      })}
    </main>
  );
}