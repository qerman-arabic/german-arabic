'use client';

const SECTIONS = [
  {
    href: '/ai',
    icon: '🤖',
    title: 'المعلم الذكي',
    desc: 'يحادثك ويصحح كتابتك ونطقك فورًا — جرّب رسالة مجانية بدون تسجيل',
    hot: true,
  },
  { href: '/grammar', icon: '📘', title: 'القواعد', desc: 'قواعد مشروحة بالعربية مع أمثلة' },
  { href: '/reading', icon: '📖', title: 'القراءة', desc: 'نصوص بأسلوب الامتحان مع أسئلة' },
  { href: '/listening', icon: '🎧', title: 'الاستماع', desc: 'مقاطع حقيقية بسرعتين' },
  { href: '/speaking', icon: '🗣️', title: 'الشفوي', desc: 'سيناريوهات محاكاة الامتحان' },
  { href: '/writing', icon: '✍️', title: 'الكتابة', desc: 'مهام كتابة مع نموذج إجابة' },
  { href: '/goethe', icon: '🎓', title: 'نماذج Goethe', desc: 'امتحانات كاملة بأسلوب الاختبار' },
  { href: '/quiz', icon: '🧠', title: 'اختبار المستوى', desc: 'اعرف مستواك الحقيقي في 5 دقائق' },
  { href: '/review', icon: '🔁', title: 'المراجعة المتباعدة', desc: 'الكلمات تعود إليك قبل أن تنساها' },
  { href: '/mistakes', icon: '📚', title: 'قاموس أخطائك', desc: 'كل خطأ يُحفظ ويصبح درسًا خاصًا بك' },
  { href: '/certificate', icon: '🏅', title: 'الشهادات', desc: 'شهادة PDF باسمك بعد كل مستوى' },
];

export default function ExplorePage() {
  return (
    <main className="container">
      <div className="page-head">
        <h1 className="page-title">تصفح المنصة 👀</h1>
        <a className="btn btn-primary" href="/register">إنشاء حساب مجاني</a>
      </div>

      <p className="muted" style={{ marginBottom: 18, lineHeight: 1.9 }}>
        تتصفح الآن كزائر: 3 عينات من كل قسم بدون تسجيل،
        + رسالة مجانية يوميًا من المعلم الذكي 🤖
        أنشئ حسابًا مجانيًا لفتح حدود أوسع!
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 14,
        }}
      >
        {SECTIONS.map((s) => (
          <a
            key={s.href}
            href={s.href}
            className="card"
            style={{
              textDecoration: 'none',
              color: 'inherit',
              border: s.hot ? '2px solid var(--primary)' : undefined,
              background: s.hot ? 'linear-gradient(160deg,#f0fdfa,#ffffff)' : undefined,
            }}
          >
            <div style={{ fontSize: 30, marginBottom: 8 }}>{s.icon}</div>
            <b>
              {s.title}
              {s.hot && (
                <span
                  style={{
                    background: 'var(--primary)',
                    color: '#fff',
                    fontSize: 11,
                    borderRadius: 999,
                    padding: '2px 10px',
                    marginRight: 8,
                    verticalAlign: 'middle',
                  }}
                >
                  تجربة مجانية
                </span>
              )}
            </b>
            <p className="muted small" style={{ margin: '6px 0 0', lineHeight: 1.8 }}>
              {s.desc}
            </p>
          </a>
        ))}
      </div>
    </main>
  );
}