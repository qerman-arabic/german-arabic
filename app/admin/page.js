'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const ADMIN_EMAIL = 'moayad.ahmad2014@gmail.com';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [tab, setTab] = useState('words');
  const [levels, setLevels] = useState([]);
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

      const { data: lv } = await supabase
        .from('levels')
        .select('*, modules(*, lessons(id, title_ar))')
        .order('sort_order');

      setLevels(lv || []);
      setLoading(false);
    }

    load();
  }, []);

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
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