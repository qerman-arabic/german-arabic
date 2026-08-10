'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function LessonPage() {
  const params = useParams();
  const lessonId = params.id;

  const [userId, setUserId] = useState(null);
  const [lesson, setLesson] = useState(null);
  const [words, setWords] = useState([]);
  const [exercises, setExercises] = useState([]);
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

      const [lessonRes, wordsRes, exercisesRes] = await Promise.all([
        supabase.from('lessons').select('*').eq('id', lessonId).single(),
        supabase.from('words').select('*').eq('lesson_id', lessonId).order('sort_order'),
        supabase
          .from('lesson_exercises')
          .select('*')
          .eq('lesson_id', lessonId)
          .order('sort_order'),
      ]);

      setLesson(lessonRes.data);
      setWords(wordsRes.data || []);
      setExercises(exercisesRes.data || []);
      setLoading(false);
    }

    if (lessonId) load();
  }, [lessonId]);

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
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  async function addWordToReview(word) {
    const { error } = await supabase.from('flashcards').insert({
      user_id: userId,
      word_id: word.id,
    });

    if (error) {
      if (error.code === '23505') showToast('الكلمة موجودة في المراجعة مسبقًا');
      else showToast('حدث خطأ: ' + error.message);
      return;
    }

    showToast('تمت إضافة الكلمة إلى المراجعة');
  }

  function selectOption(qi, oi) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qi]: oi }));
  }

  async function checkAnswers() {
    if (submitted) return;

    if (Object.keys(answers).length < exercises.length) {
      showToast('يرجى الإجابة عن جميع الأسئلة أولًا');
      return;
    }

    let correct = 0;
    exercises.forEach((ex, i) => {
      if (answers[i] === ex.correct_answer) correct++;
    });

    const total = exercises.length;
    const percent = Math.round((correct / total) * 100);
    const completed = percent >= 60;

    const { error: progressError } = await supabase.from('lesson_progress').upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        status: completed ? 'completed' : 'started',
        score: percent,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,lesson_id' }
    );

    if (progressError) {
      showToast('حدث خطأ في حفظ التقدم: ' + progressError.message);
      return;
    }

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

    const points = (profile?.points ?? 0) + correct * 10 + (completed ? 30 : 0);

    await supabase
      .from('profiles')
      .update({ points, streak, last_activity_date: new Date().toISOString() })
      .eq('id', userId);

    setSubmitted(true);
    setResult({ correct, total, percent, completed });
  }

  if (loading) {
    return (
      <main className="container">
        <p className="muted">جارٍ تحميل الدرس...</p>
      </main>
    );
  }

  if (!lesson) {
    return (
      <main className="container" style={{ textAlign: 'center' }}>
        <p className="muted">الدرس غير موجود.</p>
        <a className="btn btn-primary" href="/dashboard">العودة إلى لوحة التعلم</a>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="page-head">
        <h1 className="page-title">{lesson.title_ar}</h1>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <p className="muted" style={{ margin: 0, lineHeight: 2 }}>{lesson.content_ar}</p>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <h2 className="section-title">الكلمات</h2>

        {words.map((word) => (
          <div key={word.id} className="word-row">
            <div>
              <strong style={{ fontSize: 16 }}>{word.word_de}</strong>
              <div className="muted">{word.word_ar}</div>
              {word.example_de && (
                <div className="muted small">
                  {word.example_de} — {word.example_ar}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => speak(word.word_de)}>
                🔊 استمع
              </button>
              <button className="btn btn-primary" onClick={() => addWordToReview(word)}>
                + مراجعة
              </button>
            </div>
          </div>
        ))}

        {words.length === 0 && <p className="muted">لا توجد كلمات في هذا الدرس.</p>}
      </div>

      <div className="card">
        <h2 className="section-title">التمارين</h2>

        {exercises.map((exercise, index) => {
          const options = Array.isArray(exercise.options) ? exercise.options : [];

          return (
            <div key={exercise.id} style={{ padding: '14px 0', borderBottom: '1px solid var(--line)' }}>
              <p style={{ fontWeight: 800, marginBottom: 10 }}>
                {index + 1}. {exercise.question_ar}
              </p>

              <div style={{ display: 'grid', gap: 8 }}>
                {options.map((option, oi) => {
                  let cls = 'option';
                  if (!submitted && answers[index] === oi) cls += ' selected';
                  if (submitted && oi === exercise.correct_answer) cls += ' correct';
                  else if (submitted && answers[index] === oi) cls += ' wrong';

                  return (
                    <button key={oi} className={cls} onClick={() => selectOption(index, oi)}>
                      {option}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {exercises.length === 0 && <p className="muted">لا توجد تمارين في هذا الدرس.</p>}

        {exercises.length > 0 && (
          <button
            className="btn btn-primary btn-lg"
            style={{ marginTop: 16 }}
            onClick={checkAnswers}
            disabled={submitted}
          >
            {submitted ? 'تم التصحيح' : 'تحقق من الإجابات'}
          </button>
        )}

        {result && (
          <div className={`result-box ${result.completed ? 'result-good' : 'result-warn'}`}>
            نتيجتك: {result.correct} من {result.total} ({result.percent}%)
            <br />
            {result.completed
              ? 'أحسنت! تم إكمال الدرس ✅ وأضيفت النقاط إلى حسابك.'
              : 'راجع الدرس وحاول مرة أخرى.'}
          </div>
        )}
      </div>

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}