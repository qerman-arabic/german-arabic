'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function QuizPage() {
  const [userId, setUserId] = useState(null);
  const [allExercises, setAllExercises] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;

      if (!session) {
        window.location.href = '/login';
        return;
      }

      setUserId(session.user.id);

      const { data: exercises } = await supabase
        .from('lesson_exercises')
        .select('*, lessons(title_ar)');

      const list = exercises || [];
      setAllExercises(list);
      setQuestions(pickRandom(list));
      setLoading(false);
    }

    load();
  }, []);

  function pickRandom(list) {
    return [...list].sort(() => Math.random() - 0.5).slice(0, 5);
  }

  function newQuiz() {
    setQuestions(pickRandom(allExercises));
    setAnswers({});
    setSubmitted(false);
    setResult(null);
  }

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  }

  function selectOption(qi, oi) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qi]: oi }));
  }

  async function submitQuiz() {
    if (submitted) return;

    if (Object.keys(answers).length < questions.length) {
      showToast('يرجى الإجابة عن جميع الأسئلة أولًا');
      return;
    }

    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct_answer) correct++;
    });

    const total = questions.length;
    const percent = Math.round((correct / total) * 100);

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
        points: (profile?.points ?? 0) + correct * 5,
        streak,
        last_activity_date: new Date().toISOString(),
      })
      .eq('id', userId);

    setSubmitted(true);
    setResult({ correct, total, percent });
  }

  if (loading) {
    return (
      <main className="container">
        <p className="muted">جارٍ تجهيز الاختبار...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="page-head">
        <h1 className="page-title">الاختبار السريع 🎯</h1>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <p className="muted" style={{ margin: 0 }}>
          5 أسئلة عشوائية من جميع المستويات. كل إجابة صحيحة = 5 نقاط.
        </p>
      </div>

      {questions.map((q, qi) => {
        const options = Array.isArray(q.options) ? q.options : [];

        return (
          <div key={q.id} className="card" style={{ marginBottom: 14 }}>
            <p style={{ fontWeight: 800, marginBottom: 4 }}>
              {qi + 1}. {q.question_ar}
            </p>
            <p className="muted small" style={{ marginBottom: 12 }}>
              من درس: {q.lessons?.title_ar}
            </p>

            <div style={{ display: 'grid', gap: 8 }}>
              {options.map((opt, oi) => {
                let cls = 'option';
                if (!submitted && answers[qi] === oi) cls += ' selected';
                if (submitted && oi === q.correct_answer) cls += ' correct';
                else if (submitted && answers[qi] === oi) cls += ' wrong';

                return (
                  <button key={oi} className={cls} onClick={() => selectOption(qi, oi)}>
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn btn-primary btn-lg" onClick={submitQuiz} disabled={submitted}>
          {submitted ? 'تم التصحيح' : 'تسليم الاختبار'}
        </button>
        {submitted && (
          <button className="btn btn-ghost btn-lg" onClick={newQuiz}>
            اختبار جديد 🔄
          </button>
        )}
      </div>

      {result && (
        <div className={`result-box ${result.percent >= 60 ? 'result-good' : 'result-warn'}`}>
          نتيجتك: {result.correct} من {result.total} ({result.percent}%)
          <br />
          {result.percent >= 60
            ? 'أحسنت! أُضيفت نقاطك إلى حسابك 🎉'
            : 'لا بأس، راجع الدروس وحاول مجددًا.'}
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}