'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function ReadingPage() {
  const [userId, setUserId] = useState(null);
  const [texts, setTexts] = useState([]);
  const [level, setLevel] = useState('A1');
  const [current, setCurrent] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      if (data?.session) setUserId(data.session.user.id);

      const { data: t } = await supabase
        .from('reading_texts')
        .select('*')
        .order('sort_order');

      setTexts(t || []);

      if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
        window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
      }
    }
    load();
  }, []);

  const filtered = texts.filter((t) => t.level_code === level);

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  }

  function stopAudio() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setPlaying(false);
  }

  function play(text) {
    if (!('speechSynthesis' in window)) {
      showToast('المتصفح لا يدعم النطق');
      return;
    }

    stopAudio();

    const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
    sentences.forEach((s) => {
      const u = new SpeechSynthesisUtterance(s.trim());
      u.lang = 'de-DE';
      u.rate = 0.92;
      const voices = window.speechSynthesis.getVoices();
      const de = voices.find((v) => v.lang && v.lang.toLowerCase().startsWith('de'));
      if (de) u.voice = de;
      window.speechSynthesis.speak(u);
    });

    const end = new SpeechSynthesisUtterance(' ');
    end.onend = () => setPlaying(false);
    window.speechSynthesis.speak(end);
    setPlaying(true);
  }

  function open(t) {
    stopAudio();
    setCurrent(t);
    setAnswers({});
    setSubmitted(false);
    setResult(null);
  }

  function select(qi, oi) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qi]: oi }));
  }

  async function submit() {
    if (submitted) return;

    if (Object.keys(answers).length < current.questions.length) {
      showToast('أجب عن جميع الأسئلة أولًا');
      return;
    }

    let correct = 0;
    current.questions.forEach((q, i) => {
      if (answers[i] === q.c) correct++;
    });

    const total = current.questions.length;
    const percent = Math.round((correct / total) * 100);
    const passed = percent >= 60;
    let pointsEarned = 0;

    if (userId && passed) {
      pointsEarned = correct * 5 + 20;

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const today = new Date().toDateString();
      const last = profile?.last_activity_date
        ? new Date(profile.last_activity_date).toDateString()
        : null;

      let streak = profile?.streak ?? 0;
      if (last !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        streak = last === yesterday ? streak + 1 : 1;
      }

      await supabase
        .from('profiles')
        .update({
          points: (profile?.points ?? 0) + pointsEarned,
          streak,
          last_activity_date: new Date().toISOString(),
        })
        .eq('id', userId);
    }

    setSubmitted(true);
    setResult({ correct, total, percent, passed, pointsEarned });
  }

  return (
    <main className="container">
      <div className="page-head">
        <h1 className="page-title">القراءة والاستماع 📖</h1>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      {current === null ? (
        <>
          <div className="card" style={{ marginBottom: 18 }}>
            <p className="muted" style={{ margin: 0, lineHeight: 2 }}>
              60 نصًا طويلًا (20 سطرًا) بمفردات مستوى كل نص. اقرأ واستمع 🔊 ثم أجب عن 5 أسئلة فهم.
              أسئلة A1/A2 بالعربية وB1/B2 بالألمانية لمحاكاة الامتحان.
            </p>
          </div>

          {texts.length === 0 && (
            <div className="card result-warn" style={{ marginBottom: 18 }}>
              لا توجد نصوص بعد — نفّذ دفعات النصوص في SQL Editor.
            </div>
          )}

          <div className="pills" style={{ marginBottom: 20 }}>
            {['A1', 'A2', 'B1', 'B2'].map((l) => (
              <button
                key={l}
                className="pill"
                onClick={() => setLevel(l)}
                style={
                  level === l
                    ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }
                    : {}
                }
              >
                {l}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {filtered.map((t) => (
              <div
                key={t.id}
                className="card"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontWeight: 800 }}>📖 {t.title_ar}</div>
                  <span className="chip" style={{ marginTop: 6 }}>
                    {t.text_de.trim().split(/\s+/).length} كلمة
                  </span>
                </div>
                <button className="btn btn-primary" onClick={() => open(t)}>
                  اقرأ واستمع
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="page-head">
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>📖 {current.title_ar}</h2>
            <button className="btn btn-ghost" onClick={() => { stopAudio(); setCurrent(null); }}>
              ← كل النصوص
            </button>
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => play(current.text_de)}>
                🔊 استمع للنص كاملًا
              </button>
              {playing && (
                <button className="btn btn-ghost" onClick={stopAudio}>⏹ إيقاف</button>
              )}
            </div>

            <div
              dir="ltr"
              style={{
                textAlign: 'left',
                lineHeight: 2.1,
                fontSize: 16,
                whiteSpace: 'pre-line',
                fontFamily: 'inherit',
              }}
            >
              {current.text_de}
            </div>
          </div>

          {(current.questions || []).map((q, qi) => (
            <div key={qi} className="card" style={{ marginBottom: 14 }}>
              <p style={{ fontWeight: 800, marginBottom: 10 }}>{qi + 1}. {q.q}</p>
              <div style={{ display: 'grid', gap: 8 }}>
                {q.o.map((opt, oi) => {
                  let cls = 'option';
                  if (!submitted && answers[qi] === oi) cls += ' selected';
                  if (submitted && oi === q.c) cls += ' correct';
                  else if (submitted && answers[qi] === oi) cls += ' wrong';
                  return (
                    <button key={oi} className={cls} onClick={() => select(qi, oi)}>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <button className="btn btn-primary btn-lg" onClick={submit} disabled={submitted}>
            {submitted ? 'تم التصحيح' : 'تسليم الإجابات'}
          </button>

          {result && (
            <div className={`result-box ${result.passed ? 'result-good' : 'result-warn'}`}>
              فهمك القرائي: {result.correct} من {result.total} ({result.percent}%)
              {userId && result.passed && (
                <>
                  <br />+{result.pointsEarned} نقطة ⭐
                </>
              )}
            </div>
          )}
        </>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}