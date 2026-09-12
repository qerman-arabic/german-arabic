'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export default function PushButton() {
  const [status, setStatus] = useState('hidden');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !PUBLIC_KEY) return;
    if (Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then((reg) =>
        reg.pushManager.getSubscription().then((sub) => setStatus(sub ? 'on' : 'off'))
      );
    } else if (Notification.permission !== 'denied') {
      setStatus('off');
    }
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setBusy(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
        });
      }

      const { data } = await supabase.auth.getSession();
      const email = data?.session?.user?.email || 'anon';

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), email }),
      });

      setStatus('on');
    } catch (e) {
      console.error(e);
    }
    setBusy(false);
  }

  if (status === 'hidden') return null;

  if (status === 'on') {
    return (
      <span className="chip" style={{ background: '#dcfce7', color: '#166534' }}>
        🔔 تذكيراتك مفعّلة
      </span>
    );
  }

  return (
    <button
      className="btn btn-ghost"
      onClick={enable}
      disabled={busy}
      style={{ borderColor: 'var(--primary)', color: 'var(--primary)', fontWeight: 800 }}
    >
      {busy ? 'جارٍ التفعيل...' : '🔔 فعّل تذكير الدرس اليومي'}
    </button>
  );
}