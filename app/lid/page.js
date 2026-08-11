'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function LidPage() {
  const [userId, setUserId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [mode, setMode] = useState('learn');
  const [topic, setTopic] = useState('الكل');
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [exam, setExam] = useState(null);
  const [seconds, setSeconds] = useState(3600);
  const [finished, setFinished] = useState(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      if (data?.session) setUserId(data.session.user.id);

      const { data: q } = await supabase
        .from('lid_questions')
        .select('*')
        .order('sort_order');

      setQuestions(q || []);
    }
    load();
  }, []);

  useEffect(() => {
    if (!exam || finished) return;
    const t = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(t);
          finishExam();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [exam, finished]);

  const pool = topic === 'الكل' ? questions : questions.filter((q) => q.topic === topic);
  const current = mode === 'learn' ? pool[idx % Math.max(pool.length, 1)] : exam?.[idx];

  function speak(t) {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'de-DE';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  function startExam() {
    setExam(shuffle(questions).slice(0, 33));
    setIdx(0);
    setPicked(null);
    setScore(0);
    setSeconds(3600);
    setFinished(null);
    setMode('exam');
  }

  function pickLearn(oi) {
    if (picked !== null) return;
    setPicked(oi);
    if (oi === current.correct) setScore((s) => s + 1);
  }

  function pickExam(oi) {
    const next = [...exam];
    next[idx] = { ...next[idx], picked: oi };
    setExam(next);
  }

  async function finishExam() {
    const correct = exam.filter((q) => q.picked === q.correct).length;
    const passed = correct >= 15;
    setFinished({ correct, passed });

    if (userId && passed) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      await supabase
        .from('profiles')
        .update({ points: (profile?.points ?? 0) + 50 })
        .eq('id', userId);
    }
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <main className="container">
      <div className="page-head">
        <h1 className="page-title">الحياة في ألمانيا 🇩</h1>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      <div className="pills" style={{ marginBottom: 18 }}>
        <button
          className="pill"
          onClick={() => { setMode('learn'); setPicked(null); setIdx(0); setScore(0); }}
          style={mode === 'learn' ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' } : {}}
        >
          تعلّم حسب المحور 📚
        </button>
        <button className="pill" onClick={startExam}>
          امتحان تجريبي (33 سؤالًا / 60 دقيقة) ⏱️
        </button>
      </div>

      {mode === 'learn' && (
        <>
          <div className="pills" style={{ marginBottom: 16 }}>
            {['الكل', 'السياسة', 'التاريخ', 'المجتمع'].map((t) => (
              <button
                key={t}
                className="pill"
                onClick={() => { setTopic(t); setIdx(0); setPicked(null); }}
                style={topic === t ? { background: '#111827', color: '#fff', borderColor: '#111827' } : {}}
              >
                {t}
              </button>
            ))}
          </div>

          {current && (
            <>
              <div className="card" style={{ textAlign: 'center', marginBottom: 14 }}>
                <span className="chip">{current.topic} — سؤال {(idx % pool.length) + 1}</span>
                <p dir="ltr" style={{ fontSize: 19, fontWeight: 800, margin: '14px 0 4px' }}>
                  {current.question_de}
                </p>
                <p className="muted" style={{ marginBottom: 8 }}>{current.question_ar}</p>
                <button className="btn btn-ghost" onClick={() => speak(current.question_de)}>🔊 استمع</button>
              </div>

              <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
                {current.options.map((opt, oi) => {
                  let cls = 'option';
                  if (picked !== null && oi === current.correct) cls += ' correct';
                  else if (picked === oi && oi !== current.correct) cls += ' wrong';
                  return (
                    <button key={oi} className={cls} onClick={() => pickLearn(oi)}>
                      <span dir="ltr">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {picked !== null && (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => { setIdx(idx + 1); setPicked(null); }}
                >
                  السؤال التالي ←
                </button>
              )}
            </>
          )}
        </>
      )}

      {mode === 'exam' && !finished && current && (
        <>
          <div className="card" style={{ textAlign: 'center', marginBottom: 14 }}>
            <span className="chip">⏱️ {mm}:{ss}</span>{' '}
            <span className="chip">سؤال {idx + 1} من {exam.length}</span>
            <p dir="ltr" style={{ fontSize: 19, fontWeight: 800, margin: '14px 0 4px' }}>
              {current.question_de}
            </p>
            <p className="muted" style={{ marginBottom: 8 }}>{current.question_ar}</p>
          </div>

          <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
            {current.options.map((opt, oi) => {
              let cls = 'option';
              if (current.picked === oi) cls += ' selected';
              return (
                <button key={oi} className={cls} onClick={() => pickExam(oi)}>
                  <span dir="ltr">{opt}</span>
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {idx > 0 && (
              <button className="btn btn-ghost" onClick={() => setIdx(idx - 1)}>→ السابق</button>
            )}
            {idx + 1 < exam.length ? (
              <button className="btn btn-primary" onClick={() => setIdx(idx + 1)}>التالي ←</button>
            ) : null}
            <button className="btn btn-primary btn-lg" onClick={finishExam}>🏁 تسليم الامتحان</button>
          </div>
        </>
      )}

      {finished && (
        <div
          className="card"
          style={{
            textAlign: 'center',
            background: finished.passed ? '#f0fdf4' : '#fef2f2',
          }}
        >
          <div style={{ fontSize: 46, fontWeight: 900 }}>{finished.correct}/33</div>
          <p style={{ fontWeight: 800, marginBottom: 8 }}>
            {finished.passed
              ? '🎉 ناجح! حصلت على 50 نقطة. أنت جاهز للاختبار الرسمي.'
              : 'تحتاج 15 إجابة صحيحة للنجاح — راجع المحاور وأعد المحاولة.'}
          </p>
          <button className="btn btn-primary" onClick={startExam}>إعادة الامتحان</button>
        </div>
      )}
    </main>
  );
}