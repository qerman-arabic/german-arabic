'use client';

const SECTIONS = [
  { href: '/grammar', icon: '📘', title: 'القواعد', desc: 'قواعد مشروحة بالعربية مع أمثلة' },
  { href: '/reading', icon: '📖', title: 'القراءة', desc: 'نصوص بأسلوب الامتحان مع أسئلة' },
  { href: '/listening', icon: '🎧', title: 'الاستماع', desc: 'مقاطع حقيقية بسرعتين' },
  { href: '/speaking', icon: '🗣️', title: 'الشفوي', desc: 'سيناريوهات محاكاة الامتحان' },
  { href: '/writing', icon: '✍️', title: 'الكتابة', desc: 'مهام كتابة مع نموذج إجابة' },
  { href: '/goethe', icon: '🎓', title: 'نماذج Goethe', desc: 'امتحانات كاملة بأسلوب الاختبار' },
];

export default function ExplorePage() {
  return (
    <main className="container">
      <div className="page-head">
        <h1 className="page-title">تصفح المنصة 👀</h1>
        <a className="btn btn-primary" href="/register">إنشاء حساب مجاني</a>
      </div>

      <p className="muted" style={{ marginBottom: 18, lineHeight: 1.9 }}>
        تتصفح الآن كزائر: 3 عينات من كل قسم بدون تسجيل.
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
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div style={{ fontSize: 30, marginBottom: 8 }}>{s.icon}</div>
            <b>{s.title}</b>
            <p className="muted small" style={{ margin: '6px 0 0', lineHeight: 1.8 }}>
              {s.desc}
            </p>
          </a>
        ))}
      </div>
    </main>
  );
}