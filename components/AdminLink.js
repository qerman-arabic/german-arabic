'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const ADMIN_EMAIL = 'moayad.ahmad2014@gmail.com';

export default function AdminLink() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user?.email === ADMIN_EMAIL) setShow(true);
    });
  }, []);

  if (!show) return null;

  return (
    <a
      href="/admin/premium"
      title="إدارة المشتركين"
      style={{
        position: 'fixed',
        bottom: 18,
        left: 18,
        width: 54,
        height: 54,
        borderRadius: '50%',
        background: 'linear-gradient(135deg,#0f766e,#10b981)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 26,
        boxShadow: '0 6px 18px rgba(0,0,0,.25)',
        zIndex: 999,
        textDecoration: 'none',
      }}
    >
      💎
    </a>
  );
}