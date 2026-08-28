'use client';

import { useEffect, useState } from 'react';

export default function OfferNote() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('offer-note-hidden')) setShow(true);
  }, []);

  function hide() {
    setShow(false);
    localStorage.setItem('offer-note-hidden', '1');
  }

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 14,
        right: 14,
        background: 'linear-gradient(135deg, #0f766e, #10b981)',
        color: '#fff',
        borderRadius: 14,
        padding: '10px 16px',
        fontSize: 13,
        fontWeight: 700,
        boxShadow: '0 8px 24px rgba(15,118,110,.35)',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        zIndex: 998,
        maxWidth: 330,
        lineHeight: 1.8,
      }}
    >
      <span>🎉 تخفيضات الإطلاق: شهر $10 · 3 أشهر $30 · دائم $150</span>
      <button
        onClick={hide}
        aria-label="إخفاء"
        style={{
          background: 'none',
          border: 'none',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 14,
          padding: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}