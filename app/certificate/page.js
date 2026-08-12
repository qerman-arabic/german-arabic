'use client';

import { useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
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
  const [downloading, setDownloading] = useState(null);

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

  async function downloadPdf(id, code) {
    setDownloading(id);
    try {
      const el = document.getElementById('cert-' + id);
      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0b3d39',
      });

      const img = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

      const w = 277;
      const h = (canvas.height * w) / canvas.width;
      const y = (210 - h) / 2;

      pdf.addImage(img, 'PNG', 10, y > 0 ? y : 10, w, h);
      pdf.save(`شهادة-${code}.pdf`);
    } finally {
      setDownloading(null);
    }
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
              id={'cert-' + c.level.id}
              style={{
                background: 'linear-gradient(135deg,#FFCE00,#f59e0b)',
                borderRadius: 26,
                padding: 6,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  background: 'linear-gradient(160deg,#0b3d39,#0f766e)',
                  borderRadius: 22,
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
                    style={{ borderRadius: 14, border: '3px solid #FFCE00' }}
                  />
                  <b style={{ fontSize: 22, color: '#FFCE00' }}>German بالعربي</b>
                </div>

                <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 13 }}>
                  شهادة إتمام • Zertifikat
                </div>

                <div
                  style={{
                    fontFamily: 'Georgia, serif',
                    fontStyle: 'italic',
                    fontSize: 21,
                    color: '#FFCE00',
                    margin: '12px 0 4px',
                  }}
                >
                  {GERMAN_WISHES[c.level.code] || GERMAN_WISHES.A1}
                </div>

                <h2 style={{ fontSize: 30, fontWeight: 900, color: '#ffffff', margin: '10px 0' }}>
                  {profile?.full_name || 'متعلم متميز'}
                </h2>

                <p style={{ marginBottom: 8, color: '#e6fffa' }}>
                  أتمّ بنجاح جميع دروس مستوى
                </p>

                <div
                  style={{
                    margin: '0 auto 12px',
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: '#FFCE00',
                    color: '#0b3d39',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: 22,
                  }}
                >
                  {c.level.code}
                </div>

                <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 13 }}>
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
                        color: '#FFCE00',
                      }}
                    >
                      إدارة German بالعربي
                    </div>
                    <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 12 }}>
                      التوقيع الرسمي
                    </div>
                  </div>

                  <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 12, direction: 'ltr' }}>
                    رقم الشهادة: {certNo}
                  </div>

                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=https://german-arabic.vercel.app/"
                    width={80}
                    height={80}
                    crossOrigin="anonymous"
                    style={{ borderRadius: 8, background: '#fff', padding: 6 }}
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
              <button
                className="btn btn-primary"
                disabled={downloading === c.level.id}
                onClick={() => downloadPdf(c.level.id, c.level.code)}
              >
                {downloading === c.level.id ? '⏳ جارٍ التحضير...' : '⬇️ تحميل PDF'}
              </button>
            </div>
          </div>
        );
      })}
    </main>
  );
}