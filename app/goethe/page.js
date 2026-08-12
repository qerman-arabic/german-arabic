'use client';

import { useRole, LIMITS } from '../../lib/access';
import Upsell from '../../components/Upsell';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const MODELS_PER_LEVEL = 20;

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededShuffle(arr, rnd) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildExam(levelCode, modelNumber, words, exercises) {
  const seed =
    levelCode.charCodeAt(0) * 1000 + levelCode.charCodeAt(1) * 100 + modelNumber;

  const rnd = mulberry32(seed);
  const pool = seededShuffle(
    words.filter((w) => w.example_de && w.example_ar),
    rnd
  );

  const questions = [];

  pool.slice(0, 3).forEach((w) => {
    const others = seededShuffle(words.filter((x) => x.id !== w.id), rnd)
      .slice(0, 3)
      .map((x) => x.word_ar);
    const options = seededShuffle([w.word_ar, ...others], rnd);
    questions.push({
      type: 'listening',
      audio: w.word_de,
      prompt: 'استمع إلى الكلمة ثم اختر المعنى الصحيح:',
      options,
      answer: options.indexOf(w.word_ar),
    });
  });

  pool.slice(3, 7).forEach((w) => {
    const others = seededShuffle(words.filter((x) => x.id !== w.id), rnd)
      .slice(0, 3)
      .map((x) => x.word_ar);
    const options = seededShuffle([w.word_ar, ...others], rnd);
    questions.push({
      type: 'vocab',
      prompt: `ما معنى: ${w.word_de}؟`,
      options,
      answer: options.indexOf(w.word_ar),
    });
  });

  pool.slice(7, 10).forEach((w) => {
    const others = seededShuffle(words.filter((x) => x.id !== w.id && x.example_ar), rnd)
      .slice(0, 3)
      .map((x) => x.example_ar);
    const options = seededShuffle([w.example_ar, ...others], rnd);
    questions.push({
      type: 'reading',
      prompt: `اقرأ الجملة واختر الترجمة الصحيحة: "${w.example_de}"`,
      options,
      answer: options.indexOf(w.example_ar),
    });
  });

  seededShuffle(exercises, rnd)
    .slice(0, 2)
    .forEach((ex) => {
      const opts = Array.isArray(ex.options) ? ex.options : [];
      questions.push({
        type: 'grammar',
        prompt: ex.question_ar,
        options: opts,
        answer: ex.correct_answer,
      });
    });

  return questions;
}

const sectionTitle = {
  listening: '🎧 الاستماع Hören',
  vocab: '📖 المفردات Wortschatz',
  reading: '👀 القراءة Lesen',
  grammar: '📘 القواعد Grammatik',
};

export default function GoethePage() {
  const { role } = useRole();
  const [loading, setLoading] = useState(true);
  const [words, setWords] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [level, setLevel] = useState('A1');
  const [model, setModel] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    async function load() {
      const [wordsRes, exRes] = await Promise.all([
        supabase
          .from('words')
          .select('id, word_de, word_ar, example_de, example_ar, lessons(modules(levels(code)))'),
        supabase
          .from('lesson_exercises')
          .select('question_ar, options, correct_answer, lessons(modules(levels(code)))'),
      ]);

      setWords(
        (wordsRes.data || []).map((w) => ({
          id: w.id,
          word_de: w.word_de,
          word_ar: w.word_ar,
          example_de: w.example_de,
          example_ar: w.example_ar,
          level: w.lessons?.modules?.levels?.code,
        }))
      );

      setExercises(
        (exRes.data || []).map((e) => ({
          question_ar: e.question_ar,
          options: e.options,
          correct_answer: e.correct_answer,
          level: e.lessons?.modules?.levels?.code,
        }))
      );

      setLoading(false);
    }

    load();
  }, []);

  const visibleCount =
    role === 'guest'
      ? level === 'A1'
        ? 3
        : 0
      : role === 'free'
      ? 5
      : MODELS_PER_LEVEL;

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) {
      showToast('المتصفح لا يدعم النطق الصوتي');
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    u.rate = 0.85;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  function openModel(n) {
    const levelWords = words.filter((w) => w.level === level);
    const levelExercises = exercises.filter((e) => e.level === level);

    if (levelWords.length < 15) {
      showToast('لا توجد مفردات كافية لهذا المستوى بعد');
      return;
    }

    setModel(n);
    setQuestions(buildExam(level, n, levelWords, levelExercises));
    setAnswers({});
    setSubmitted(false);
    setResult(null);
  }

  function selectOption(qi, oi) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qi]: oi }));
  }

  function submitExam() {
    if (submitted) return;

    if (Object.keys(answers).length < questions.length) {
      showToast('يرجى الإجابة عن جميع الأسئلة أولًا');
      return;
    }

    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.answer) correct++;
    });

    const total = questions.length;
    const percent = Math.round((correct / total) * 100);

    setSubmitted(true);
    setResult({ correct, total, percent });
  }

  if (loading) {
    return (
      <main className="container">
        <p className="muted">جارٍ تجهيز نماذج الامتحان...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <Upsell role={role} feature="نماذج Goethe" />

      <div className="page-head">
        <h1 className="page-title">نماذج امتحان Goethe 🎓</h1>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a className="btn btn-ghost" href="/dashboard">لوحة التعلم</a>
          <a className="btn btn-ghost" href="/grammar">القواعد</a>
        </div>
      </div>

      {model === null ? (
        <>
          <div className="card" style={{ marginBottom: 18 }}>
            <p className="muted" style={{ margin: 0, lineHeight: 2 }}>
              60 نموذجًا تدريبيًا بأسلوب امتحان Goethe (20 لكل مستوى): استماع، قراءة، مفردات، وقواعد.
              اختر مستواك ثم اختر نموذجًا للبدء.
            </p>
          </div>

          <div className="pills" style={{ marginBottom: 20 }}>
            {['A1', 'A2', 'B1'].map((l) => (
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

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: 10,
            }}
          >
            {Array.from({ length: visibleCount }, (_, i) => i + 1).map((n) => (
              <button key={n} className="pill" style={{ padding: '16px 10px' }} onClick={() => openModel(n)}>
                نموذج {n}
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="page-head">
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>
              نموذج {model} — مستوى {level}
            </h2>
            <button className="btn btn-ghost" onClick={() => setModel(null)}>
              ← كل النماذج
            </button>
          </div>

          {questions.map((q, qi) => (
            <div key={qi} className="card" style={{ marginBottom: 14 }}>
              <div className="small" style={{ color: 'var(--primary-dark)', fontWeight: 800, marginBottom: 6 }}>
                {sectionTitle[q.type]}
              </div>

              {q.type === 'listening' && (
                <button className="btn btn-primary" style={{ marginBottom: 10 }} onClick={() => speak(q.audio)}>
                  🔊 تشغيل الصوت
                </button>
              )}

              <p style={{ fontWeight: 800, marginBottom: 10 }}>{q.prompt}</p>

              <div style={{ display: 'grid', gap: 8 }}>
                {q.options.map((opt, oi) => {
                  let cls = 'option';
                  if (!submitted && answers[qi] === oi) cls += ' selected';
                  if (submitted && oi === q.answer) cls += ' correct';
                  else if (submitted && answers[qi] === oi) cls += ' wrong';

                  return (
                    <button key={oi} className={cls} onClick={() => selectOption(qi, oi)}>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={submitExam} disabled={submitted}>
              {submitted ? 'تم التصحيح' : 'تسليم النموذج'}
            </button>
            {submitted && (
              <button className="btn btn-ghost btn-lg" onClick={() => openModel(model)}>
                إعادة المحاولة 🔄
              </button>
            )}
          </div>

          {result && (
            <div className={`result-box ${result.percent >= 60 ? 'result-good' : 'result-warn'}`}>
              نتيجتك: {result.correct} من {result.total} ({result.percent}%)
              <br />
              {result.percent >= 80
                ? '🎉 ممتاز! أنت جاهز لامتحان Goethe في هذا المستوى.'
                : result.percent >= 60
                ? '✅ جيد! أنت جاهز مبدئيًا، واصل التدريب.'
                : '⚠️ تحتاج مزيدًا من التحضير. راجع الدروس والقواعد ثم أعد النموذج.'}
            </div>
          )}
        </>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}