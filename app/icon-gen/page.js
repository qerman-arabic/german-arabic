'use client';

import { useEffect, useState } from 'react';

export default function IconGenPage() {
  const [img, setImg] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const image = new Image();
    image.onload = () => setImg(image);
    image.onerror = () => setError('تعذر تحميل /logo.png — تأكد من وجوده في مجلد public');
    image.src = '/logo.png';
  }, []);

  function make(size) {
    if (!img) return;

    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');

    // قصّ مربع من منتصف الشعار
    const side = Math.min(img.width, img.height);
    const sx = (img.width - side) / 2;
    const sy = (img.height - side) / 2;
    ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);

    const a = document.createElement('a');
    a.download = `icon-${size}.png`;
    a.href = c.toDataURL('image/png');
    a.click();
  }

  return (
    <main className="container" style={{ textAlign: 'center', padding: 60 }}>
      <h1 className="page-title">أيقونات من الشعار الجديد 🎨</h1>
      <p className="muted">
        تقصّ الصفحة مربعًا من منتصف logo.png وتحوّله لأيقونات التطبيق.
      </p>

      {img && (
        <img
          src="/logo.png"
          alt="الشعار"
          style={{ width: 180, borderRadius: 20, margin: '16px auto', display: 'block' }}
        />
      )}

      {error && <p style={{ color: '#dc2626', fontWeight: 800 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 10 }}>
        <button className="btn btn-primary btn-lg" onClick={() => make(192)} disabled={!img}>
          ⬇️ icon-192.png
        </button>
        <button className="btn btn-primary btn-lg" onClick={() => make(512)} disabled={!img}>
          ⬇️ icon-512.png
        </button>
      </div>
    </main>
  );
}