'use client';

export default function IconGenPage() {
  function make(size) {
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');

    // خلفية مستديرة تركوازية
    const r = size * 0.22;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(0, 0, size, size, r);
    else ctx.rect(0, 0, size, size);
    ctx.fillStyle = '#0f766e';
    ctx.fill();

    // دائرة داخلية
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(16,185,129,0.35)';
    ctx.fill();

    // النصوص
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size * 0.3}px Tahoma, Arial`;
    ctx.fillText('DE', size / 2, size * 0.46);
    ctx.font = `bold ${size * 0.3}px Tahoma, Arial`;
    ctx.fillText('ع', size / 2, size * 0.8);

    const a = document.createElement('a');
    a.download = `icon-${size}.png`;
    a.href = c.toDataURL('image/png');
    a.click();
  }

  return (
    <main className="container" style={{ textAlign: 'center', padding: 60 }}>
      <h1 className="page-title">توليد أيقونات PNG 🎨</h1>
      <p className="muted">اضغط كل زر وسيُنزَّل ملف PNG، ثم ضعه في مجلد public.</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
        <button className="btn btn-primary btn-lg" onClick={() => make(192)}>
          ⬇️ icon-192.png
        </button>
        <button className="btn btn-primary btn-lg" onClick={() => make(512)}>
          ⬇️ icon-512.png
        </button>
      </div>
    </main>
  );
}