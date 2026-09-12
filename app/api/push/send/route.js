import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'moayad.ahmad2014@gmail.com';

export async function POST(req) {
  const body = await req.json();
  if (body.email !== ADMIN_EMAIL) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  webpush.setVapidDetails(
    'mailto:' + ADMIN_EMAIL,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data: subs } = await supabase.from('push_subscriptions').select('*');

  let sent = 0;
  for (const row of subs || []) {
    try {
      await webpush.sendNotification(
        row.subscription,
        JSON.stringify({
          title: body.title || 'German بالعربي 🇩🇪',
          body: body.body || 'حان وقت درسك اليومي! 🔥',
          url: body.url || '/dashboard',
        })
      );
      sent++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', row.endpoint);
      }
    }
  }

  return NextResponse.json({ ok: true, sent });
}