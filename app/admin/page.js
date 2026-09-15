'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const ADMIN_EMAIL = 'moayad.ahmad2014@gmail.com';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [tab, setTab] = useState('words');
  const [levels, setLevels] = useState([]);
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [pushTitle, setPushTitle] = useState('');
  const [pushBody, setPushBody] = useState('');
  const [pushBusy, setPushBusy] = useState(false);
  const [toast, setToast] = useState('');

  const [wLesson, setWLesson] = useState('');
  const [wDe, setWDe] = useState('');
  const [wAr, setWAr] = useState('');

  const [lModule, setLModule] = useState('');
  const [lTitle, setLTitle] = useState('');
  const [lContent, setLContent] = useState('');

  const [gLevel, setGLevel] = useState('');
  const [gTitleAr, setGTitleAr] = useState('');
  const [gTitleDe, setGTitleDe] = useState('');
  const [gExpl, setGExpl] = useState('');
  const [gExDe, setGExDe] = useState('');
  const [gExAr, setGExAr] = useState('');

  const [eLesson, setELesson] = useState('');
  const [eQ, setEQ] = useState('');
  const [eOpts, setEOpts] = useState(['', '', '', '']);
  const [eCorrect, setECorrect] = useState(0);

  const [vLevel, setVLevel] = useState('A1');
  const [vInf, setVInf] = useState('');
  const [vPraesIch, setVPraesIch] = useState('');
  const [vPraesDu, setVPraesDu] = useState('');
  const [vPraesEr, setVPraesEr] = useState('');
  const [vPraesWir, setVPraesWir] = useState('');
  const [vPraesIhr, setVPraesIhr] = useState('');
  const [vPraesSie, setVPraesSie] = useState('');
  const [vPraet, setVPraet] = useState('');
  const [vPP, setVPP] = useState('');
  const [vHilfs, setVHilfs] = useState('haben');
  const [vImp, setVImp] = useState('');
  const [vMean, setVMean] = useState('');
  const [vExDe, setVExDe] = useState('');
  const [vExAr, setVExAr] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session) {
        window.location.href = '/login';
        return;
      }

      if (session.user.email !== ADMIN_EMAIL) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      setAllowed(true);

      const [lv, us, req] = await Promise.all([
        supabase
          .from('levels')
          .select('*, modules(*, lessons(id, title_ar))')
          .order('sort_order'),
        supabase.from('profiles').select('*').order('points', { ascending: false }),
        supabase.from('payment_requests').select('*').order('created_at', { ascending: false }),
      ]);

      setLevels(lv.data || []);
      setUsers(us.data || []);
      setRequests(req.data || []);
      setLoading(false);
    }

    load();
  }, []);

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  }

  function timeAgo(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'الآن';
    if (m < 60) return 'قبل ' + m + ' دقيقة';
    const h = Math.floor(m / 60);
    if (h < 24) return 'قبل ' + h + ' ساعة';
    const d = Math.floor(h / 24);
    return 'قبل ' + d + ' يوم';
  }

  async function refreshUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('points', { ascending: false });
    setUsers(data || []);
  }

  async function refreshRequests() {
    const { data } = await supabase
      .from('payment_requests')
      .select('*')
      .order('created_at', { ascending: false });
    setRequests(data || []);
  }

  async function sendPush() {
    setPushBusy(true);
    try {
      const res = await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, title: pushTitle, body: pushBody }),
      });
      const json = await res.json();
      showToast(json.ok ? 'أُرسل إلى ' + json.sent + ' مشترك ✅' : 'فشل الإرسال');
    } catch (e) {
      showToast('فشل الإرسال');
    }
    setPushBusy(false);
  }

  async function fulfillRequest(req) {
    const user = users.find((u) => u.email === req.email);
    if (!user) return showToast('لم نجد مستخدمًا بهذا البريد: ' + req.email);

    const daysMap = { 'شهر امتحان': 30, '3 أشهر': 90, 'سنة كاملة': 365 };
    const days = daysMap[req.plan] || 30;

    const until = new Date(Date.now() + days * 86400000).toISOString();
    const { error: upErr } = await supabase.from('profiles').update({
      is_premium: true,
      premium_until: until,
    }).eq('id', user.id);

    if (upErr) return showToast('خطأ في التفعيل: ' + upErr.message);

    await supabase.from('payment_requests').update({ status: 'fulfilled' }).eq('id', req.id);
    showToast('تم تفعيل ' + req.email + ' ✅ (' + days + ' يومًا)');
    refreshRequests();
    refreshUsers();
  }

  async function rejectRequest(id) {
    await supabase.from('payment_requests').update({ status: 'rejected' }).eq('id', id);
    showToast('تم رفض الطلب');
    refreshRequests();
  }

  async function setPremium(userId, days) {
    const until = new Date(Date.now() + days * 86400000).toISOString();
    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: true, premium_until: until })
      .eq('id', userId);
    if (error) return showToast('خطأ: ' + error.message);
    showToast('تم التفعيل ✅ (' + days + ' يومًا)');
    refreshUsers();
  }

  async function setPermanent(userId) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: true, premium_until: null })
      .eq('id', userId);
    if (error) return showToast('خطأ: ' + error.message);
    showToast('تم التفعيل دائمًا ✅');
    refreshUsers();
  }

  async function removePremium(userId) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: false, premium_until: null })
      .eq('id', userId);
    if (error) return showToast('خطأ: ' + error.message);
    showToast('تم إلغاء الاشتراك');
    refreshUsers();
  }

  const allLessons = (levels || []).flatMap((lv) =>
    (lv.modules || []).flatMap((m) =>
      (m.lessons || []).map((l) => ({ id: l.id, label: `${lv.code} — ${l.title_ar}` }))
    )
  );

  const allModules = (levels || []).flatMap((lv) =>
    (lv.modules || []).map((m) => ({ id: m.id, label: `${lv.code} — ${m.title_ar}` }))
  );

  async function addWord(e) {
    e.preventDefault();
    const { error } = await supabase.from('words').insert({
      lesson_id: wLesson,
      word_de: wDe,
      word_ar: wAr,
    });
    if (error) return showToast('خطأ: ' + error.message);
    showToast('تمت إضافة الكلمة ✅');
    setWDe('');
    setWAr('');
  }

  async function addLesson(e) {
    e.preventDefault();
    const { error } = await supabase.from('lessons').insert({
      module_id: lModule,
      title_ar: lTitle,
      content_ar: lContent,
      sort_order: 99,
    });
    if (error) return showToast('خطأ: ' + error.message);
    showToast('تمت إضافة الدرس ✅');
    setLTitle('');
    setLContent('');
  }

  async function addGrammar(e) {
    e.preventDefault();
    const { error } = await supabase.from('grammar_topics').insert({
      level_id: gLevel,
      title_ar: gTitleAr,
      title_de: gTitleDe,
      explanation_ar: gExpl,
      examples_de: gExDe,
      examples_ar: gExAr,
      sort_order: 99,
    });
    if (error) return showToast('خطأ: ' + error.message);
    showToast('تمت إضافة القاعدة ✅');
    setGTitleAr('');
    setGTitleDe('');
    setGExpl('');
    setGExDe('');
    setGExAr('');
  }

  async function addExercise(e) {
    e.preventDefault();
    if (eOpts.some((o) => !o.trim())) return showToast('املأ الخيارات الأربعة');
    const { error } = await supabase.from('lesson_exercises').insert({
      lesson_id: eLesson,
      question_ar: eQ,
      options: eOpts,
      correct_answer: eCorrect,
      sort_order: 99,
    });
    if (error) return showToast('خطأ: ' + error.message);
    showToast('تمت إضافة التمرين ✅');
    setEQ('');
    setEOpts(['', '', '', '']);
  }

  async function addVerb(e) {
    e.preventDefault();
    const { error } = await supabase.from('verbs').insert({
      level_code: vLevel,
      infinitive: vInf,
      praesens_ich: vPraesIch,
      praesens_du: vPraesDu,
      praesens_er: vPraesEr,
      praesens_wir: vPraesWir,
      praesens_ihr: vPraesIhr,
      praesens_sie: vPraesSie,
      praeteritum: vPraet,
      partizip_ii: vPP,
      hilfsverb: vHilfs,
      imperativ: vImp,
      meaning_ar: vMean,
      example_de: vExDe,
      example_ar: vExAr,
      sort_order: 99,
    });
    if (error) return showToast('خطأ: ' + error.message);
    showToast('تمت إضافة الفعل ✅');
    setVInf('');
    setVPraesIch('');
    setVPraesDu('');
    setVPraesEr('');
    setVPraesWir('');
    setVPraesIhr('');
    setVPraesSie('');
    setVPraet('');
    setVPP('');
    setVImp('');
    setVMean('');
    setVExDe('');
    setVExAr('');
  }

  if (loading) {
    return (
      <main className="container">
        <p className="muted">جارٍ التحميل...</p>
      </main>
    );
  }

  if (!allowed) {
    return (
      <main className="container" style={{ textAlign: 'center' }}>
        <div className="card" style={{ maxWidth: 420, margin: '60px auto' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🔒</div>
          <h1 className="page-title">منطقة الإدارة</h1>
          <p className="muted">هذه الصفحة مخصصة لمدير المنصة فقط.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="page-head">
        <h1 className="page-title">لوحة الإدارة 🛠️</h1>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      <div className="pills" style={{ marginBottom: 20 }}>
        {[
          ['push', 'إشعارات 🔔'],
          ['requests', 'طلبات الدفع 💰'],
          ['users', 'المستخدمون 👥'],
          ['verbs', 'أفعال شاذة 🔀'],
          ['words', 'كلمات 📖'],
          ['lessons', 'دروس 📘'],
          ['grammar', 'قواعد 📘'],
          ['exercises', 'تمارين 🎯'],
        ].map(([key, label]) => (
          <button
            key={key}
            className="pill"
            onClick={() => setTab(key)}
            style={
              tab === key
                ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
                : {}
            }
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'push' && (
        <div className="card">
          <h2 className="section-title">إرسال تذكير لكل المشتركين 🔔</h2>
          <p className="muted small" style={{ marginBottom: 14, lineHeight: 1.9 }}>
            يصل الإشعار فورًا لكل من ضغط زر الجرس في لوحته وسمح بالإشعارات.
          </p>
          <div className="field">
            <label>العنوان</label>
            <input
              className="input"
              value={pushTitle}
              onChange={(e) => setPushTitle(e.target.value)}
              placeholder="مثال: درسك اليومي ينتظرك!"
            />
          </div>
          <div className="field">
            <label>نص الإشعار</label>
            <input
              className="input"
              value={pushBody}
              onChange={(e) => setPushBody(e.target.value)}
              placeholder="مثال: 5 دقائق اليوم تحافظ على سلسلة أيامك 🔥"
            />
          </div>
          <button className="btn btn-primary btn-lg" onClick={sendPush} disabled={pushBusy}>
            {pushBusy ? 'جارٍ الإرسال...' : '📨 إرسال للجميع'}
          </button>
        </div>
      )}

      {tab === 'requests' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {requests.length === 0 && (
            <div className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>📭</div>
              <p className="muted">لا توجد طلبات حتى الآن.</p>
            </div>
          )}
          {requests.map((r) => {
            const isPending = r.status === 'pending';
            return (
              <div
                key={r.id}
                className="card"
                style={{
                  opacity: isPending ? 1 : 0.55,
                  borderLeft: isPending ? '4px solid var(--primary)' : '4px solid #e2e8f0',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <b>{r.plan}</b>
                    <div dir="ltr" style={{ textAlign: 'right', color: '#475569', fontSize: 13 }}>
                      {r.email}
                    </div>
                  </div>
                  <div className="muted small" style={{ fontWeight: 900, fontSize: 18, color: 'var(--primary-dark)' }}>
                    {r.amount}$
                    {!isPending && (
                      <span style={{ fontSize: 12, marginRight: 6, color: '#64748b' }}>
                        {r.status === 'fulfilled' ? ' ✅' : ' ❌'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="muted small" style={{ marginBottom: 10 }}>
                  {new Date(r.created_at).toLocaleString('ar-EG')}
                </div>
                {isPending && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-primary" onClick={() => fulfillRequest(r)}>
                      ✅ تفعيل الاشتراك
                    </button>
                    <button className="btn btn-ghost" onClick={() => rejectRequest(r.id)}>
                      رفض
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'users' && (
        <div style={{ display: 'grid', gap: 12 }}>
          {users.map((u) => {
            const left = u.premium_until
              ? Math.ceil((new Date(u.premium_until).getTime() - Date.now()) / 86400000)
              : null;
            const active = u.is_premium && (left === null || left > 0);

            return (
              <div key={u.id} className="card">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <b>{u.full_name || u.email}</b>
                    <div className="muted small" dir="ltr" style={{ textAlign: 'right' }}>
                      {u.email}
                    </div>
                    <div className="muted small" style={{ marginTop: 2 }}>
                      {u.last_login
                        ? '🕐 آخر دخول: ' + timeAgo(u.last_login)
                        : '🕐 لم يفتح المنصة بعد'}
                    </div>
                  </div>
                  <div className="muted small" style={{ fontWeight: 800 }}>
                    {u.points ?? 0} نقطة ⭐
                    {active && (
                      <span style={{ color: '#0f766e', fontWeight: 900 }}>
                        {' '}— 💎 {left === null ? 'دائم' : left + ' يومًا'}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-ghost" onClick={() => setPremium(u.id, 30)}>
                    شهر (30)
                  </button>
                  <button className="btn btn-ghost" onClick={() => setPremium(u.id, 90)}>
                    3 أشهر (90)
                  </button>
                  <button className="btn btn-primary" onClick={() => setPremium(u.id, 365)}>
                    سنة (365) 🗓️
                  </button>
                  <button className="btn btn-ghost" onClick={() => setPermanent(u.id)}>
                    دائم ♾️
                  </button>
                  {active && (
                    <button className="pill pill-danger" onClick={() => removePremium(u.id)}>
                      إلغاء
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'verbs' && (
        <form className="card" onSubmit={addVerb}>
          <h2 className="section-title">إضافة فعل شاذ 🔀</h2>
          <div className="field">
            <label>المستوى</label>
            <select className="input" value={vLevel} onChange={(e) => setVLevel(e.target.value)}>
              {['A1', 'A2', 'B1', 'B2'].map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>المصدر (Infinitiv)</label>
            <input className="input" dir="ltr" value={vInf} onChange={(e) => setVInf(e.target.value)} required placeholder="gehen" />
          </div>
          <div className="card" style={{ background: '#f8fafc', marginBottom: 12 }}>
            <b>🔤 Präsens (الحاضر):</b>
            <div className="field" style={{ marginTop: 8 }}>
              <label>ich</label>
              <input className="input" dir="ltr" value={vPraesIch} onChange={(e) => setVPraesIch(e.target.value)} required placeholder="gehe" />
            </div>
            <div className="field">
              <label>du</label>
              <input className="input" dir="ltr" value={vPraesDu} onChange={(e) => setVPraesDu(e.target.value)} required placeholder="gehst" />
            </div>
            <div className="field">
              <label>er/sie/es</label>
              <input className="input" dir="ltr" value={vPraesEr} onChange={(e) => setVPraesEr(e.target.value)} required placeholder="geht" />
            </div>
            <div className="field">
              <label>wir</label>
              <input className="input" dir="ltr" value={vPraesWir} onChange={(e) => setVPraesWir(e.target.value)} required placeholder="gehen" />
            </div>
            <div className="field">
              <label>ihr</label>
              <input className="input" dir="ltr" value={vPraesIhr} onChange={(e) => setVPraesIhr(e.target.value)} required placeholder="geht" />
            </div>
            <div className="field">
              <label>sie/Sie</label>
              <input className="input" dir="ltr" value={vPraesSie} onChange={(e) => setVPraesSie(e.target.value)} required placeholder="gehen" />
            </div>
          </div>
          <div className="field">
            <label>Präteritum (الماضي البسيط)</label>
            <input className="input" dir="ltr" value={vPraet} onChange={(e) => setVPraet(e.target.value)} required placeholder="ging" />
          </div>
          <div className="field">
            <label>PP (Partizip II)</label>
            <input className="input" dir="ltr" value={vPP} onChange={(e) => setVPP(e.target.value)} required placeholder="gegangen" />
          </div>
          <div className="field">
            <label>الفعل المساعد</label>
            <select className="input" value={vHilfs} onChange={(e) => setVHilfs(e.target.value)}>
              <option value="haben">haben</option>
              <option value="sein">sein</option>
            </select>
          </div>
          <div className="field">
            <label>Imperativ (الأمر - اختياري)</label>
            <input className="input" dir="ltr" value={vImp} onChange={(e) => setVImp(e.target.value)} placeholder="geh!" />
          </div>
          <div className="field">
            <label>المعنى بالعربية</label>
            <input className="input" value={vMean} onChange={(e) => setVMean(e.target.value)} required placeholder="يذهب" />
          </div>
          <div className="field">
            <label>مثال بالألمانية (اختياري)</label>
            <input className="input" dir="ltr" value={vExDe} onChange={(e) => setVExDe(e.target.value)} placeholder="Ich gehe zur Schule." />
          </div>
          <div className="field">
            <label>ترجمة المثال (اختياري)</label>
            <input className="input" value={vExAr} onChange={(e) => setVExAr(e.target.value)} placeholder="أنا أذهب إلى المدرسة." />
          </div>
          <button className="btn btn-primary">إضافة الفعل</button>
        </form>
      )}

      {tab === 'words' && (
        <form className="card" onSubmit={addWord}>
          <h2 className="section-title">إضافة كلمة جديدة</h2>
          <div className="field">
            <label>الدرس</label>
            <select className="input" value={wLesson} onChange={(e) => setWLesson(e.target.value)} required>
              <option value="">اختر درسًا...</option>
              {allLessons.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>الكلمة بالألمانية</label>
            <input className="input" dir="ltr" value={wDe} onChange={(e) => setWDe(e.target.value)} required />
          </div>
          <div className="field">
            <label>الترجمة العربية</label>
            <input className="input" value={wAr} onChange={(e) => setWAr(e.target.value)} required />
          </div>
          <button className="btn btn-primary">إضافة الكلمة</button>
        </form>
      )}

      {tab === 'lessons' && (
        <form className="card" onSubmit={addLesson}>
          <h2 className="section-title">إضافة درس جديد</h2>
          <div className="field">
            <label>الوحدة</label>
            <select className="input" value={lModule} onChange={(e) => setLModule(e.target.value)} required>
              <option value="">اختر وحدة...</option>
              {allModules.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>عنوان الدرس</label>
            <input className="input" value={lTitle} onChange={(e) => setLTitle(e.target.value)} required />
          </div>
          <div className="field">
            <label>محتوى الدرس (الشرح بالعربية)</label>
            <textarea className="input" value={lContent} onChange={(e) => setLContent(e.target.value)} required style={{ minHeight: 100 }} />
          </div>
          <button className="btn btn-primary">إضافة الدرس</button>
        </form>
      )}

      {tab === 'grammar' && (
        <form className="card" onSubmit={addGrammar}>
          <h2 className="section-title">إضافة قاعدة جديدة</h2>
          <div className="field">
            <label>المستوى</label>
            <select className="input" value={gLevel} onChange={(e) => setGLevel(e.target.value)} required>
              <option value="">اختر مستوى...</option>
              {(levels || []).map((lv) => (
                <option key={lv.id} value={lv.id}>{lv.code}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>العنوان بالعربية</label>
            <input className="input" value={gTitleAr} onChange={(e) => setGTitleAr(e.target.value)} required />
          </div>
          <div className="field">
            <label>العنوان بالألمانية</label>
            <input className="input" dir="ltr" value={gTitleDe} onChange={(e) => setGTitleDe(e.target.value)} required />
          </div>
          <div className="field">
            <label>الشرح بالعربية</label>
            <textarea className="input" value={gExpl} onChange={(e) => setGExpl(e.target.value)} required style={{ minHeight: 90 }} />
          </div>
          <div className="field">
            <label>الأمثلة بالألمانية (افصل بينها بـ / )</label>
            <input className="input" dir="ltr" value={gExDe} onChange={(e) => setGExDe(e.target.value)} required />
          </div>
          <div className="field">
            <label>ترجمة الأمثلة (بنفس الترتيب)</label>
            <input className="input" value={gExAr} onChange={(e) => setGExAr(e.target.value)} required />
          </div>
          <button className="btn btn-primary">إضافة القاعدة</button>
        </form>
      )}

      {tab === 'exercises' && (
        <form className="card" onSubmit={addExercise}>
          <h2 className="section-title">إضافة تمرين جديد</h2>
          <div className="field">
            <label>الدرس</label>
            <select className="input" value={eLesson} onChange={(e) => setELesson(e.target.value)} required>
              <option value="">اختر درسًا...</option>
              {allLessons.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>السؤال</label>
            <input className="input" value={eQ} onChange={(e) => setEQ(e.target.value)} required />
          </div>
          {eOpts.map((opt, i) => (
            <div className="field" key={i}>
              <label>الخيار {i + 1}</label>
              <input
                className="input"
                value={opt}
                onChange={(e) => {
                  const next = [...eOpts];
                  next[i] = e.target.value;
                  setEOpts(next);
                }}
                required
              />
            </div>
          ))}
          <div className="field">
            <label>الإجابة الصحيحة</label>
            <select className="input" value={eCorrect} onChange={(e) => setECorrect(Number(e.target.value))}>
              <option value={0}>الخيار 1</option>
              <option value={1}>الخيار 2</option>
              <option value={2}>الخيار 3</option>
              <option value={3}>الخيار 4</option>
            </select>
          </div>
          <button className="btn btn-primary">إضافة التمرين</button>
        </form>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}