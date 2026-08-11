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

export default function QuizPage() {
  const [userId, setUserId] = useState(null);
  const [level, setLevel] = useState('A1');
  const [pool, setPool] = useState([]);
  const [round, setRound] = useState([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [wrongList, setWrongList] = useState([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      if (data?.session) setUserId(data.session.user.id);

      const { data: w } = await supabase
        .from('words')
        .select('word_de, word_ar, lessons(modules(levels(code)))');

      setPool(w || []);
    }
    load();
  }, []);

  const levelWords = pool.filter(
    (w) => w.lessons?.modules?.levels?.code === level && w.word_ar
  );

  function speak(t) {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'de-DE';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  function start() {
    if (levelWords.length < 4) return;

    const qs = shuffle(levelWords)
      .slice(0, 10)
      .map((w) => {
        const others = shuffle(
          levelWords.filter((x) => x.word_de !== w.word_de)
        ).slice(0, 3);
        const options = shuffle([w, ...others]).map((x) => x.word_ar);
        return {
          word_de: w.word_de,
          word_ar: w.word_ar,
          options,
          correct: options.indexOf(w.word_ar),
        };
      });

    setRound(qs);
    setIdx(0);
    setPicked(null);
    setScore(0);
    setWrongList([]);
    setDone(false);
  }

  async function logWord(w, correct) {
    if (!userId) return;

    const { data: row } = await supabase
      .from('wrong_words')
      .select('*')
      .eq('user_id', userId)
      .eq('word_de', w.word_de)
      .maybeSingle();

    if (!row) {
      if (!correct) {
        await supabase.from('wrong_words').insert({
          user_id: userId,
          word_de: w.word_de,
          word_ar: w.word_ar,
          wrong_count: 1,
          right_count: 0,
        });
      }
      return;
    }

    await supabase
      .from('wrong_words')
      .update({
        wrong_count: row.wrong_count + (correct ? 0 : 1),
        right_count: row.right_count + (correct ? 1 : 0),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('word_de', w.word_de);
  }

  async function pick(oi) {
    if (picked !== null) return;
    setPicked(oi);

    const q = round[idx];
    const correct = oi === q.correct;

    if (correct) setScore((s) => s + 1);
    else setWrongList((l) => [...l, q]);

    await logWord(q, correct);
  }

  async function next() {
    if (idx + 1 < round.length) {
      setIdx(idx + 1);
      setPicked(null);
    } else {
      setDone(true);

      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();

        await supabase
          .from('profiles')
          .update({ points: (profile?.points ?? 0) + score * 2 })
          .eq('id', userId);
      }
    }
  }

  const q = round[idx];

  return (
    <main className="container">
      <div className="page-head">
        <h1 className="page-title">اختبار سريع 🎯</h1>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      {round.length === 0 || done ? (
        <>
          <div className="card" style={{ marginBottom: 18 }}>
            <p className="muted" style={{ margin: 0, lineHeight: 2 }}>
              10 أسئلة عشوائية لكل جولة. كل كلمة تخطئ بها تُحفظ تلقائيًا في
              «قاموس أخطائك» لتراجعها لاحقًا حتى تتقنها.
            </p>
          </div>

          {done && (
            <div
              className="card"
              style={{
                textAlign: 'center',
                background: score >= 6 ? '#f0fdf4' : '#fef2f2',
                marginBottom: 18,
              }}
            >
              <div style={{ fontSize: 40, fontWeight: 900 }}>
                {score}/10
              </div>
              <p style={{ fontWeight: 700, marginBottom: 8 }}>
                {score >= 8
                  ? 'ممتاز! ذاكرتك قوية 🔥'
                  : score >= 6
                  ? 'جيد جدًا! واصل الترسيخ.'
                  : 'لا بأس — أخطاؤك الآن في قاموسك الخاص لتتقنها.'}
              </p>
              {wrongList.length > 0 && (
                <a className="btn btn-primary" href="/mistakes">
                  📕 راجع كلماتك الخاطئة ({wrongList.length})
                </a>
              )}
            </div>
          )}

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

          <button className="btn btn-primary btn-lg" onClick={start}>
            ابدأ جولة جديدة
          </button>
        </>
      ) : (
        <>
          <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
            <span className="chip">
              السؤال {idx + 1} من {round.length} — النقاط: {score}
            </span>
            <p dir="ltr" style={{ fontSize: 26, fontWeight: 900, margin: '16px 0 8px' }}>
              {q.word_de}
            </p>
            <button className="btn btn-ghost" onClick={() => speak(q.word_de)}>
              🔊 استمع
            </button>
          </div>

          <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
            {q.options.map((opt, oi) => {
              let cls = 'option';
              if (picked !== null && oi === q.correct) cls += ' correct';
              else if (picked === oi && oi !== q.correct) cls += ' wrong';
              else if (picked === oi) cls += ' selected';

              return (
                <button key={oi} className={cls} onClick={() => pick(oi)}>
                  {opt}
                </button>
              );
            })}
          </div>

          {picked !== null && (
            <button className="btn btn-primary btn-lg" onClick={next}>
              {idx + 1 < round.length ? 'السؤال التالي ←' : '🏁 إنهاء الجولة'}
            </button>
          )}
        </>
      )}
    </main>
  );
}