'use client';

import { useRole } from '../../lib/access';

const PLANS = [
  { name: 'شهر امتحان', price: '10$', per: 'لمدة 30 يومًا', hot: false },
  { name: '3 أشهر', price: '20$', per: 'الأكثر اختيارًا', hot: true },
  { name: 'وصول دائم', price: '29$', per: 'ادفع مرة واحدة', hot: false },
];

export default function PremiumPage() {
  const { role } = useRole();

  return (
    <main className="container">
      <div className="page-head">
        <h1 className="page-title">Premium 💎</h1>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      {role === 'premium' && (
        <div className="card" style={{ background: '#f0fdf4', textAlign: 'center', marginBottom: 18 }}>
          🎉 حسابك Premium فعّال — استمتع بكل المحتوى!
        </div>
      )}

      <div className="card" style={{ marginBottom: 18, lineHeight: 2 }}>
        <b>ماذا يفتح Premium؟</b>
        <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
          <li>60 نموذج Goethe كاملًا (بدل 5 لكل مستوى)</li>
          <li>كل مقاطع الاستماع والقراءة والشفوي والكتابة</li>
          <li>معلم AI غير محدود (بدل 5 رسائل يوميًا)</li>
          <li>شهادات إتمام PDF باسمك</li>
        </ul>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 14,
          marginBottom: 20,
        }}
      >
        {PLANS.map((p) => (
          <div
            key={p.name}
            className="card"
            style={{
              textAlign: 'center',
              border: p.hot ? '2px solid var(--primary)' : undefined,
              position: 'relative',
            }}
          >
            {p.hot && (
              <span className="chip" style={{ position: 'absolute', top: -12, right: 16, background: 'var(--primary)', color: '#fff' }}>
                الأفضل قيمة
              </span>
            )}
            <div style={{ fontWeight: 900, fontSize: 18 }}>{p.name}</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--primary-dark)', margin: '8px 0' }}>
              {p.price}
            </div>
            <div className="muted small">{p.per}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ lineHeight: 2.1 }}>
        <b>🛒 طريقة الاشتراك:</b>
        <ol style={{ margin: '8px 0 0', paddingLeft: 18 }}>
          <li>حوّل المبلغ عبر أحد الطرق بالأسفل.</li>
          <li>أرسل صورة الإيصال مع بريدك الإلكتروني المسجل في المنصة.</li>
          <li>يُفعَّل اشتراكك خلال أقل من 24 ساعة.</li>
        </ol>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
          <a className="btn btn-primary" href="https://buy.stripe.com/رابطك-هنا" target="_blank" rel="noreferrer">
            💳 بطاقة (Stripe)
          </a>
          <a className="btn btn-ghost" href="https://paypal.me/معرفك-هنا" target="_blank" rel="noreferrer">
            ️ PayPal
          </a>
          <a className="btn btn-ghost" href="https://wa.me/رقمك-هنا" target="_blank" rel="noreferrer">
            📱 واتساب (حوالة محلية)
          </a>
        </div>
        <p className="muted small" style={{ marginTop: 10 }}>
          * استبدل الروابط أعلاه بروابطك الحقيقية من ملف app/premium/page.js
        </p>
      </div>
    </main>
  );
}