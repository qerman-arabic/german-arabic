'use client';

import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function PaymentConfirm({ plan, amount }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    await supabase.from('payment_requests').insert({
      email,
      plan,
      amount,
    });
    setSent(true);
    setLoading(false);
    setTimeout(() => { setOpen(false); setSent(false); setEmail(''); }, 3500);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          marginTop: 8,
          width: '100%',
          padding: '10px',
          background: 'transparent',
          border: '1px solid var(--primary)',
          color: 'var(--primary)',
          borderRadius: 10,
          fontWeight: 800,
          cursor: 'pointer',
          fontSize: 14,
        }}
      >
        ✅ دفعت؟ أكّد طلبك هنا
      </button>

      {open && (
        <div
          onClick={() => !sent && setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 18,
              padding: 26,
              maxWidth: 440,
              width: '100%',
            }}
          >
            {!sent ? (
              <>
                <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>
                  تأكيد الدفع — {plan} ({amount}$)
                </h3>
                <p className="muted" style={{ marginBottom: 16, lineHeight: 1.9 }}>
                  أدخل نفس البريد المسجّل في المنصة لنصل إلى طلبك ونفعّل اشتراكك خلال ساعات.
                </p>
                <form onSubmit={submit}>
                  <input
                    className="input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="بريدك المسجل في المنصة"
                    style={{ marginBottom: 12 }}
                  />
                  <button className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                    {loading ? 'جارٍ الإرسال...' : 'إرسال التأكيد'}
                  </button>
                </form>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div style={{ fontSize: 50, marginBottom: 10 }}>✅</div>
                <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>
                  وصلنا طلبك!
                </h3>
                <p className="muted" style={{ lineHeight: 1.9 }}>
                  سنفعّل اشتراكك يدويًا خلال ساعات قليلة، وسيصلك إشعار على بريدك.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}