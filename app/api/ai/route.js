import { NextResponse } from 'next/server';

const PREFERRED = ['gemini-3.6-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];

const SYSTEM =
  'أنت معلم لغة ألمانية ودود للناطقين باللغة العربية. أجب باختصار ووضوح، قدّم أمثلة ألمانية بسيطة، وصحح أخطاء المتعلم بلطف مع شرح قصير بالعربية. إذا طلب المستخدم محادثة، فاكتب جملة ألمانية بسيطة بمستواه واسأله سؤالًا ليكمل الحوار.';

async function callGemini(model, key, body) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    }
  );

  const data = await res.json();

  if (!res.ok) {
    return { error: data?.error?.message || `HTTP ${res.status}` };
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ? { text } : { error: 'لا يوجد نص في الرد' };
}

export async function POST(req) {
  const { message, history } = await req.json();

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json({
      text: '⚠️ أضف GEMINI_API_KEY في ملف .env.local ثم أعد تشغيل الخادم.',
    });
  }

  const contents = [
    ...(history || []).map((h) => ({
      role: h.role === 'ai' ? 'model' : 'user',
      parts: [{ text: h.text }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  const body = JSON.stringify({
    contents,
    systemInstruction: { parts: [{ text: SYSTEM }] },
  });

  let lastError = '';

  // 1) جرّب النماذج المفضلة
  for (const model of PREFERRED) {
    const r = await callGemini(model, key, body);
    if (r.text) return NextResponse.json({ text: r.text });
    lastError = r.error;
  }

  // 2) إذا فشلت جميعًا: اكتشف النماذج المتاحة تلقائيًا واختر أول نموذج flash
  try {
    const listRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}&pageSize=100`
    );
    const listData = await listRes.json();

    const usable = (listData?.models || []).filter((m) =>
      (m.supportedGenerationMethods || []).includes('generateContent')
    );

    const chosen = usable.find((m) => /flash/i.test(m.name)) || usable[0];

    if (chosen) {
      const modelName = chosen.name.replace('models/', '');
      const r = await callGemini(modelName, key, body);
      if (r.text) return NextResponse.json({ text: r.text });
      lastError = r.error;
    } else {
      lastError = 'لا يوجد أي نموذج متاح في هذا المفتاح';
    }
  } catch {
    lastError = lastError || 'فشل الاتصال بخدمة Gemini';
  }

  return NextResponse.json({ text: '⚠️ خطأ من Gemini: ' + lastError });
}