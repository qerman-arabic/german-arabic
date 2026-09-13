import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req) {
  try {
    const body = await req.json();
    const sub = body.subscription;
    const email = body.email || 'anon';

    if (!sub || !sub.endpoint) {
      return NextResponse.json({ ok: false, error: 'no endpoint' }, { status: 400 });
    }

    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, key);

    const { error } = await supabase.from('push_subscriptions').upsert(
      { endpoint: sub.endpoint, subscription: sub, email },
      { onConflict: 'endpoint' }
    );

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}