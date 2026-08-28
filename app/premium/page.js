'use client';

import { useRole } from '../../lib/access';

const PLANS = [
  { name: 'شهر امتحان', price: '10$', per: 'لمدة 30 يومًا', hot: false },
  { name: '3 أشهر', price: '25$', per: 'الأكثر اختيارًا — 17$/شهر', hot: true },
  { name: 'سنة, price: '80$', per: 'تاكد انك ستكون الافضل', hot: false },
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
          <li>80 نموذج Goethe كاملًا (بدل 5 لكل مستوى)</li>
          <li>كل مقاطع الاستماع والقراءة والشفوي والكتابة</li>
          <li>معلم AI غير محدود (بدل 5 رسائل يوميًا)</li>
          <li>شهادات إتمام PDF باسمك</li>
        </ul>
      </div>

      <div className="card" style={{ background: '#eff6ff', marginBottom: 18, lineHeight: 2 }}>
        <b>📊 لماذا منصتنا الصفقة الأفضل؟</b>
        <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
          <li>دورة Goethe رسمية في المعهد = 400$ إلى 1000$</li>
          <li>دورة خاصة + كتب + سفر = 500$ وأكثر</li>
          <li>امتحان Goethe الواحد = 100$ إلى 200$</li>
          <li>
            منصتنا — لمدة سنة ={' '}
            <b style={{ color: '#16a34a' }}>80$ فقط ✅</b>
          </li>
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
              <span
                className="chip"
                style={{
                  position: 'absolute',
                  top: -12,
                  right: 16,
                  background: 'var(--primary)',
                  color: '#fff',
                }}
              >
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
          <li>اضغط زر الباقة المناسبة — سيتم تحويلك إلى PayPal.</li>
          <li>
            في صفحة الدفع اكتب <b>بريدك الإلكتروني المسجل في المنصة</b> داخل خانة
            «Add a note / إضافة ملاحظة».
          </li>
          <li>أتمم الدفع — يصلنا بريدك مع المعاملة ونفعّل اشتراكك خلال 24 ساعة. ✅</li>
        </ol> 

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
          <a className="btn btn-primary btn-lg" href="https://paypal.me/germanarabic/10" target="_blank" rel="noreferrer">
            💙 ادفع 10$ — شهر امتحان
          </a>
          <a className="btn btn-primary btn-lg" href="https://paypal.me/germanarabic/25" target="_blank" rel="noreferrer">
            💙 ادفع 25$ — 3 أشهر
          </a>
          <a className="btn btn-primary btn-lg" href="https://paypal.me/germanarabic/80" target="_blank" rel="noreferrer">
            💙 ادفع 80$ — سنة مع تخفيض 30%
          </a>
        </div>
      </div>
    </main>
  );
}