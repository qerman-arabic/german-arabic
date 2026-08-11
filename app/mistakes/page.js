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

export default function MistakesPage() {
  const [userId, setUserId] = useState(null);
  const [rows, setRows] = useState([]);
  const [allAr, setAllAr] = useState([]);
  const [round, setRound] = useState([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session) {
        window.location.href = '/login';
        return;
      }

      setUserId(session.user.id);

      const [mistRes, wordsRes] = await Promise.all([
        supabase
          .from('wrong_words')
          .select('*')
          .eq('user_id', session.user.id)
          .order('wrong_count', { ascending: false }),
        supabase.from('words').select('word_ar'),
      ]);

      setRows(mistRes.data || []);
      setAllAr((wordsRes.data || []).map((w) => w.word_ar).filter(Boolean));
    }
    load();
  }, []);

  const active = rows.filter((r) => r.wrong_count > r.right_count);
  const mastered = rows.filter((r) => r.right_count >= r.right_count && r.right_count > 0 && r.right_count >= r.wrong_count);

  function speak(t) {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'de-DE';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  async function remove(wordDe) {
    await supabase
      .from('wrong_words')
      .delete()
      .eq('user_id', userId)
      .eq('word_de', wordDe);
    setRows((prev) => prev.filter((r) => r.word_de !== wordDe));
  }

  function startPractice() {
    if (active.length === 0) return;

    const qs = shuffle(active).slice(0, 10).map((w) => {
      const others = shuffle(allAr.filter((a) => a !== w.word_ar)).slice(0, 3);
      const options = shuffle([w.word_ar, ...others]);
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
  }

  async function pick(oi) {
    if (picked !== null) return;
    setPicked(oi);

    const q = round[idx];
    const correct = oi === q.correct;
    if (correct) setScore((s) => s + 1);

    const { data: row } = await supabase
      .from('wrong_words')
      .select('*')
      .eq('user_id', userId)
      .eq('word_de', q.word_de)
      .maybeSingle();

    if (row) {
      await supabase
        .from('wrong_words')
        .update({
          wrong_count: row.wrong_count + (correct ? 0 : 1),
          right_count: row.right_count + (correct ? 1 : 0),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('word_de', q.word_de);
    }
  }

  async function next() {
    if (idx + 1 < round.length) {
      setIdx(idx + 1);
      setPicked(null);
    } else {
      setRound([]);
      const { data } = await supabase
        .from('wrong_words')
        .select('*')
        .eq('user_id', userId)
        .order('wrong_count', { ascending: false });
      setRows(data || []);
    }
  }

  const q = round[idx];

  return (
    <main className="container">
      <div className="page-head">
        <h1 className="page-title">قاموس أخطائك 📕</h1>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      {round.length > 0 ? (
        <>
          <div className="card" style={{ textAlign: 'center', marginBottom: 16 }}>
            <span className="chip">
              تدريب على أخطائك — {idx + 1} من {round.length}
            </span>
            <p dir="ltr" style={{ fontSize: 26, fontWeight: 900, margin: '16px 0 8px' }}>
              {q.word_de}
            </p>
            <button className="btn btn-ghost" onClick={() => speak(q.word_de)}>🔊 استمع</button>
          </div>

          <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
            {q.options.map((opt, oi) => {
              let cls = 'option';
              if (picked !== null && oi === q.correct) cls += ' correct';
              else if (picked === oi && oi !== q.correct) cls += ' wrong';
              return (
                <button key={oi} className={cls} onClick={() => pick(oi)}>
                  {opt}
                </button>
              );
            })}
          </div>

          {picked !== null && (
            <button className="btn btn-primary btn-lg" onClick={next}>
              {idx + 1 < round.length ? 'التالي ←' : '🏁 إنهاء وتحديث القائمة'}
            </button>
          )}
        </>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 18 }}>
            <p className="muted" style={{ margin: 0, lineHeight: 2 }}>
              كل كلمة أخطأت بها في الاختبار السريع تصل هنا تلقائيًا.
              تدرّب عليها حتى تتفوق أخطاؤك الصحيحة فتتخرج من القاموس. 🎓
            </p>
          </div>

          <div className="card" style={{ textAlign: 'center', marginBottom: 18 }}>
            <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--primary-dark)' }}>
              {active.length}
            </div>
            <div className="muted" style={{ marginBottom: 12 }}>كلمة ما زالت ضعيفة</div>
            <button className="btn btn-primary btn-lg" onClick={startPractice} disabled={active.length === 0}>
              🎯 تدرّب على أخطائك الآن
            </button>
          </div>

          {active.length === 0 && (
            <div className="card" style={{ textAlign: 'center' }}>
              🎉 لا أخطاء نشطة! قم بجولة اختبار سريع جديدة لاختبار ذاكرتك.
            </div>
          )}

          <div style={{ display: 'grid', gap: 10 }}>
            {active.map((r) => (
              <div
                key={r.word_de}
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
                  <div dir="ltr" style={{ fontWeight: 900, fontSize: 17, textAlign: 'right' }}>
                    {r.word_de}
                  </div>
                  <div className="muted small">{r.word_ar}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="chip">❌ {r.wrong_count} / ✅ {r.right_count}</span>
                  <button className="btn btn-ghost" onClick={() => speak(r.word_de)}>🔊</button>
                  <button className="btn btn-ghost" onClick={() => remove(r.word_de)}>إزالة</button>
                </div>
              </div>
            ))}
          </div>

          {mastered.length > 0 && (
            <div className="card" style={{ marginTop: 18, background: '#f0fdf4' }}>
              <b>🎓 كلمات تتخرجت منها ({mastered.length})</b>
              <p className="muted small" style={{ margin: '6px 0 0' }}>
                {mastered.slice(0, 8).map((m) => m.word_de).join('، ')}
              </p>
            </div>
          )}
        </>
      )}
    </main>
  );
}