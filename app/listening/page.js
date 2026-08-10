'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const kindIcon = {
  'إعلان': '📢',
  'حوار': '🗣️',
  'رسالة صوتية': '📞',
  'مكالمة هاتفية': '📞',
  'نشرة': '🌦️',
  'خبر': '📰',
  'نقاش': '⚖️',
  'محاضرة': '🎓',
  'تقرير': '🌍',
};

export default function ListeningPage() {
  const [exercises, setExercises] = useState([]);
  const [level, setLevel] = useState('A1');
  const [current, setCurrent] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('listening_exercises')
        .select('*')
        .order('sort_order');
      setExercises(data || []);
    }
    load();
  }, []);

  const filtered = exercises.filter((e) => e.level_code === level);

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  }

  function stopAudio() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setPlaying(false);
  }

  function play(ex) {
    if (!('speechSynthesis' in window)) {
      showToast('المتصفح لا يدعم النطق الصوتي');
      return;
    }

    stopAudio();

    const lines = Array.isArray(ex.script) ? ex.script : [];
    lines.forEach((line) => {
      const u = new SpeechSynthesisUtterance(line.t);
      u.lang = 'de-DE';
      u.rate = 0.95;
      u.pitch = line.s === 2 ? 0.7 : line.s === 3 ? 1.3 : 1;
      window.speechSynthesis.speak(u);
    });

    const end = new SpeechSynthesisUtterance(' ');
    end.onend = () => setPlaying(false);
    window.speechSynthesis.speak(end);
    setPlaying(true);
  }

  function open(ex) {
    stopAudio();
    setCurrent(ex);
    setAnswers({});
    setSubmitted(false);
    setResult(null);
  }

  function select(qi, oi) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qi]: oi }));
  }

  function submit() {
    if (submitted) return;

    if (Object.keys(answers).length < current.questions.length) {
      showToast('يرجى الإجابة عن جميع الأسئلة أولًا');
      return;
    }

    let correct = 0;
    current.questions.forEach((q, i) => {
      if (answers[i] === q.c) correct++;
    });

    const total = current.questions.length;
    const percent = Math.round((correct / total) * 100);

    setSubmitted(true);
    setResult({ correct, total, percent });
  }

  return (
    <main className="container">
      <div className="page-head">
        <h1 className="page-title">الاستماع الحقيقي 🎧</h1>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      {current === null ? (
        <>
          <div className="card" style={{ marginBottom: 18 }}>
            <p className="muted" style={{ margin: 0, lineHeight: 2 }}>
              تدريبات استماع بأسلوب امتحان Goethe: إعلانات، محادثات، نشرات، ونقاشات.
              اضغط 🔊 واستمع ثم أجب عن أسئلة الفهم. في الحوارات ستسمع نبرتين مختلفتين لشخصين!
            </p>
          </div>

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
            {filtered.map((ex) => (
              <div
                key={ex.id}
                className="card"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: 16 }}>
                    {kindIcon[ex.kind] || '🎧'} {ex.title_ar}
                  </div>
                  <span className="chip" style={{ marginTop: 6 }}>{ex.kind}</span>
                </div>
                <button className="btn btn-primary" onClick={() => open(ex)}>
                  ابدأ التدريب
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="page-head">
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>
              {kindIcon[current.kind] || '🎧'} {current.title_ar}
            </h2>
            <button className="btn btn-ghost" onClick={() => { stopAudio(); setCurrent(null); }}>
              ← كل التدريبات
            </button>
          </div>

          <div className="card" style={{ textAlign: 'center', marginBottom: 18 }}>
            <p className="muted small" style={{ marginBottom: 12 }}>
              استمع للمقطع جيدًا، ويمكنك إعادة التشغيل أكثر من مرة.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="btn btn-primary btn-lg" onClick={() => play(current)}>
                🔊 تشغيل المقطع
              </button>
              {playing && (
                <button className="btn btn-ghost btn-lg" onClick={stopAudio}>
                  ⏹ إيقاف
                </button>
              )}
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
            <div className={`result-box ${result.percent >= 60 ? 'result-good' : 'result-warn'}`}>
              فهمك السمعي: {result.correct} من {result.total} ({result.percent}%)
              <br />
              {result.percent >= 80
                ? '🎧 ممتاز! أذناك مدرّبتان كأساسي لامتحان Goethe.'
                : result.percent >= 60
                ? '✅ جيد! أعد الاستماع لترسيخ الفهم.'
                : '⚠️ استمع للمقطع مرات أكثر وركّز على الأرقام والتفاصيل.'}
            </div>
          )}
        </>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}