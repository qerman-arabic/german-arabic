'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRole, LIMITS } from '../../lib/access';
import Upsell from '../../components/Upsell';

export default function ReadingPage() {
  const { role, userId } = useRole();
  const [texts, setTexts] = useState([]);
  const [level, setLevel] = useState('A1');
  const [current, setCurrent] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('reading_texts')
        .select('*')
        .order('sort_order');

      setTexts(data || []);
    }
    load();
  }, []);

  const filtered = texts.filter((t) => t.level_code === level);
  const visible = filtered.slice(0, role === 'guest' && level !== 'A1' ? 0 : LIMITS[role].reading);

  function play(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    u.rate = 0.95;
    window.speechSynthesis.speak(u);
  }

  function open(t) {
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
    const qs = current.questions || [];
    const correct = qs.filter((q, i) => answers[i] === q.c).length;

    setResult({ correct, total: qs.length });
    setSubmitted(true);

    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      await supabase
        .from('profiles')
        .update({ points: (profile?.points ?? 0) + correct * 2 })
        .eq('id', userId);

      setToast(`+${correct * 2} نقطة!`);
      setTimeout(() => setToast(''), 2500);
    }
  }

  return (
    <main className="container">
      <Upsell role={role} feature="القراءة" />

      <div className="page-head">
        <h1 className="page-title">القراءة والاستماع 📖</h1>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      {!current && (
        <>
          <div className="pills" style={{ marginBottom: 16 }}>
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
            {visible.map((t) => (
              <button
                key={t.id}
                className="card"
                style={{ textAlign: 'right', cursor: 'pointer' }}
                onClick={() => open(t)}
              >
                <div style={{ fontWeight: 800, marginBottom: 4 }}>{t.title_ar}</div>
                <div className="muted small">اقرأ النص واستمع إليه ثم أجب</div>
              </button>
            ))}
          </div>
        </>
      )}

      {current && (
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
              marginBottom: 14,
            }}
          >
            <b style={{ fontSize: 18 }}>{current.title_ar}</b>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => play(current.text_de)}>
                🔊 استمع للنص
              </button>
              <button className="btn btn-ghost" onClick={() => setCurrent(null)}>
                ← كل النصوص
              </button>
            </div>
          </div>

          <div
            dir="ltr"
            className="card"
            style={{
              textAlign: 'left',
              lineHeight: 2,
              whiteSpace: 'pre-line',
              background: '#f8fafc',
              marginBottom: 16,
            }}
          >
            {current.text_de}
          </div>

          {(current.questions || []).map((q, qi) => (
            <div key={qi} style={{ marginBottom: 16 }}>
              <p style={{ fontWeight: 800, marginBottom: 8 }}>{q.q}</p>
              <div style={{ display: 'grid', gap: 8 }}>
                {q.o.map((opt, oi) => {
                  let cls = 'option';
                  if (submitted && oi === q.c) cls += ' correct';
                  else if (submitted && answers[qi] === oi && oi !== q.c) cls += ' wrong';
                  else if (answers[qi] === oi) cls += ' selected';

                  return (
                    <button key={oi} className={cls} onClick={() => select(qi, oi)}>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {!submitted ? (
            <button className="btn btn-primary btn-lg" onClick={submit}>
              تحقق من إجاباتك
            </button>
          ) : (
            <div
              className="card"
              style={{
                textAlign: 'center',
                background: result.correct === result.total ? '#f0fdf4' : '#fffbeb',
              }}
            >
              <b style={{ fontSize: 20 }}>
                نتيجتك: {result.correct} من {result.total}
              </b>
            </div>
          )}
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}