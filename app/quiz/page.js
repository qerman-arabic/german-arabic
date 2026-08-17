'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const LEVELS = ['A1', 'A2', 'B1', 'B2'];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * i + 1);
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

  const [mode, setMode] = useState('practice');
  const [stageIdx, setStageIdx] = useState(0);
  const [stageCorrect, setStageCorrect] = useState(0);
  const [placementResult, setPlacementResult] = useState(null);

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

  const wordsOf = (code) =>
    pool.filter((w) => w.lessons?.modules?.levels?.code === code && w.word_ar);

  function buildQuestions(code, count) {
    const lw = wordsOf(code);
    if (lw.length < 4) return [];

    return shuffle(lw)
      .slice(0, count)
      .map((w) => {
        const others = shuffle(lw.filter((x) => x.word_de !== w.word_de)).slice(0, 3);
        const options = shuffle([w, ...others]).map((x) => x.word_ar);
        return {
          word_de: w.word_de,
          word_ar: w.word_ar,
          options,
          correct: options.indexOf(w.word_ar),
        };
      });
  }

  function speak(t) {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'de-DE';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  function start() {
    const qs = buildQuestions(level, 10);
    if (!qs.length) return;
    setMode('practice');
    setPlacementResult(null);
    setRound(qs);
    setIdx(0);
    setPicked(null);
    setScore(0);
    setWrongList([]);
    setDone(false);
  }

  function startPlacement() {
    const qs = buildQuestions('A1', 5);
    if (!qs.length) return;
    setMode('placement');
    setStageIdx(0);
    setStageCorrect(0);
    setPlacementResult(null);
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

    if (correct) {
      setScore((s) => s + 1);
      if (mode === 'placement') setStageCorrect((c) => c + 1);
    } else {
      setWrongList((l) => [...l, q]);
    }

    await logWord(q, correct);
  }

  async function next() {
    if (idx + 1 < round.length) {
      setIdx(idx + 1);
      setPicked(null);
      return;
    }

    if (mode === 'practice') {
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
      return;
    }

    // منطق تحديد المستوى
    const passed = stageCorrect >= 3;

    if (!passed) {
      setPlacementResult(stageIdx === 0 ? 'START' : LEVELS[stageIdx - 1]);
      setRound([]);
      return;
    }

    if (stageIdx === LEVELS.length - 1) {
      setPlacementResult('B2');
      setRound([]);
      return;
    }

    const nextCode = LEVELS[stageIdx + 1];
    const qs = buildQuestions(nextCode, 5);

    if (!qs.length) {
      setPlacementResult(LEVELS[stageIdx]);
      setRound([]);
      return;
    }

    setStageIdx(stageIdx + 1);
    setStageCorrect(0);
    setRound(qs);
    setIdx(0);
    setPicked(null);
  }

  function reset() {
    setMode('practice');
    setRound([]);
    setDone(false);
    setPlacementResult(null);
  }

  const q = round[idx];

  return (
    <main className="container">
      <div className="page-head">
        <h1 className="page-title">اختبار سريع 🎯</h1>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      {placementResult ? (
        <div
          style={{
            background: 'linear-gradient(135deg,#FFCE00,#f59e0b)',
            borderRadius: 26,
            padding: 6,
          }}
        >
          <div
            style={{
              background: 'linear-gradient(160deg,#0b3d39,#0f766e)',
              borderRadius: 22,
              padding: '34px 26px',
              textAlign: 'center',
            }}
          >
            <div style={{ color: 'rgba(255,255,255,.75)', fontSize: 13 }}>
              نتيجة اختبار المستوى • Einstufungstest
            </div>

            <div
              style={{
                fontFamily: 'Georgia, serif',
                fontStyle: 'italic',
                color: '#FFCE00',
                fontSize: 20,
                margin: '12px 0',
              }}
            >
              „Herzlichen Glückwunsch!"
            </div>

            <div
              style={{
                margin: '0 auto 12px',
                width: 74,
                height: 74,
                borderRadius: '50%',
                background: '#FFCE00',
                color: '#0b3d39',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 900,
                fontSize: 26,
              }}
            >
              {placementResult === 'START' ? 'A1' : placementResult}
            </div>

            <p style={{ color: '#fff', fontWeight: 800, fontSize: 18, marginBottom: 6 }}>
              {placementResult === 'START'
                ? 'مستواك: مبتدئ — ابدأ من A1 ونحن معك خطوة بخطوة'
                : `مستواك الحالي: ${placementResult}`}
            </p>

            <p style={{ color: 'rgba(255,255,255,.75)', fontSize: 13, marginBottom: 18 }}>
              أجبت بشكل صحيح على {score} كلمة في الاختبار
            </p>

            {userId ? (
              <a
                href="/dashboard"
                style={{
                  background: '#FFCE00',
                  color: '#0b3d39',
                  fontWeight: 900,
                  borderRadius: 12,
                  padding: '12px 26px',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                ابدأ مسار {placementResult === 'START' ? 'A1' : placementResult} الآن
              </a>
            ) : (
              <a
                href="/register"
                style={{
                  background: '#FFCE00',
                  color: '#0b3d39',
                  fontWeight: 900,
                  borderRadius: 12,
                  padding: '12px 26px',
                  textDecoration: 'none',
                  display: 'inline-block',
                }}
              >
                سجّل مجانًا واحفظ نتيجتك وابدأ المسار
              </a>
            )}

            <div style={{ marginTop: 14 }}>
              <button className="btn btn-ghost" onClick={reset}>
                إعادة الاختبار
              </button>
            </div>
          </div>
        </div>
      ) : round.length === 0 || done ? (
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
              <div style={{ fontSize: 40, fontWeight: 900 }}>{score}/10</div>
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

          <div
            style={{
              background: 'linear-gradient(135deg,#0b3d39,#0f766e)',
              borderRadius: 18,
              padding: '18px 22px',
              textAlign: 'center',
              marginBottom: 18,
            }}
          >
            <b style={{ color: '#FFCE00', fontSize: 17 }}>
               لا تعرف مستواك؟
            </b>
            <p style={{ color: '#e6fffa', margin: '6px 0 12px', fontSize: 14 }}>
              اختبار تصاعدي من A1 إلى B2 يحدد مستواك الحقيقي في 5 دقائق — مجانًا
              وبدون تسجيل.
            </p>
            <button
              onClick={startPlacement}
              style={{
                background: '#FFCE00',
                color: '#0b3d39',
                fontWeight: 900,
                border: 'none',
                borderRadius: 12,
                padding: '12px 26px',
                cursor: 'pointer',
                fontSize: 15,
              }}
            >
              ابدأ اختبار تحديد المستوى
            </button>
          </div>

          <div className="pills" style={{ marginBottom: 16 }}>
            {LEVELS.map((l) => (
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
              {mode === 'placement'
                ? `🎯 تحديد المستوى — مرحلة ${LEVELS[stageIdx]} — السؤال ${idx + 1} من ${round.length}`
                : `السؤال ${idx + 1} من ${round.length} — النقاط: ${score}`}
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
              {idx + 1 < round.length
                ? 'السؤال التالي ←'
                : mode === 'placement'
                ? 'متابعة ←'
                : '🏁 إنهاء الجولة'}
            </button>
          )}
        </>
      )}
    </main>
  );
}