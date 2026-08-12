export default function Upsell({ role, feature }) {
  if (role === 'premium') return null;

  if (role === 'guest') {
    return (
      <div className="card" style={{ background: '#eff6ff', textAlign: 'center', marginBottom: 16 }}>
        <b style={{ color: '#1e40af' }}>👀 تتصفح عينة مجانية!</b>
        <p className="muted" style={{ margin: '6px 0 12px' }}>
          أنشئ حسابًا مجانيًا لفتح كل الدروس والمزيد من التدريبات في كل ميزة.
        </p>
        <a className="btn btn-primary" href="/register">إنشاء حساب مجاني</a>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        background: 'linear-gradient(135deg,#0f766e,#10b981)',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 16,
      }}
    >
      <b>🔒 وصلت إلى حد المجاني في {feature}</b>
      <p style={{ opacity: 0.92, margin: '6px 0 12px' }}>
        افتح كل المحتوى بلا حدود مع Premium — بسعر وجبة واحدة.
      </p>
      <a className="btn" style={{ background: '#fff', color: '#0f766e' }} href="/premium">
        💎 شاهد الباقات
      </a>
    </div>
  );
}