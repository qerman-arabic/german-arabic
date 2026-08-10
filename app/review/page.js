'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function ReviewPage() {
  const [userId, setUserId] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
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

      const { data: cardsData } = await supabase
        .from('flashcards')
        .select('*, words(*)')
        .eq('user_id', session.user.id)
        .order('created_at');

      setCards(cardsData || []);
      setLoading(false);
    }

    load();
  }, []);

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function addDays(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  const due = cards.filter((c) => !c.next_review_date || c.next_review_date <= todayISO());
  const current = due[0];

  async function rate(rating) {
    if (!current) return;

    const intervals = { again: 0, hard: 1, good: 2, easy: 4 };
    const pointsMap = { again: 0, hard: 2, good: 4, easy: 6 };

    const { error } = await supabase
      .from('flashcards')
      .update({
        interval_days: intervals[rating],
        repetitions: (current.repetitions || 0) + 1,
        next_review_date: addDays(intervals[rating]),
      })
      .eq('id', current.id);

    if (error) {
      showToast('حدث خطأ: ' + error.message);
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

    await supabase
      .from('profiles')
      .update({
        points: (profile?.points ?? 0) + pointsMap[rating],
        streak,
        last_activity_date: new Date().toISOString(),
      })
      .eq('id', userId);

    const { data: cardsData } = await supabase
      .from('flashcards')
      .select('*, words(*)')
      .eq('user_id', userId)
      .order('created_at');

    setCards(cardsData || []);
    setShowAnswer(false);
  }

  if (loading) {
    return (
      <main className="container">
        <p className="muted">جارٍ التحميل...</p>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="page-head">
        <h1 className="page-title">المراجعة الذكية 🧠</h1>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      <div className="stat-grid">
        <div className="card stat">
          <b>{cards.length}</b>
          <span>إجمالي البطاقات</span>
        </div>
        <div className="card stat">
          <b>{due.length}</b>
          <span>مستحقة اليوم</span>
        </div>
      </div>

      {cards.length === 0 && (
        <div className="card" style={{ textAlign: 'center' }}>
          <p className="muted" style={{ marginBottom: 14 }}>
            لا توجد بطاقات بعد. ادخل إلى أي درس واضغط «+ مراجعة» لإضافة الكلمات.
          </p>
          <a className="btn btn-primary" href="/dashboard">الذهاب إلى الدروس</a>
        </div>
      )}

      {cards.length > 0 && !current && (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontWeight: 800 }}>أحسنت! 🎉 لا توجد بطاقات مستحقة الآن.</p>
          <p className="muted small">عد غدًا لمراجعة جديدة.</p>
        </div>
      )}

      {current && (
        <div className="card" style={{ textAlign: 'center' }}>
          <p className="muted small">البطاقات المستحقة: {due.length}</p>

          <div style={{ fontSize: 34, fontWeight: 900, margin: '8px 0' }}>
            {current.words?.word_de}
          </div>

          {current.words?.example_de && (
            <p className="muted small">{current.words.example_de}</p>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '16px 0', flexWrap: 'wrap' }}>
            <button className="btn btn-ghost" onClick={() => speak(current.words?.word_de)}>
              🔊 استمع
            </button>
            <button className="btn btn-primary" onClick={() => setShowAnswer(true)}>
              إظهار الترجمة
            </button>
          </div>

          {showAnswer && (
            <div className="result-box result-good">
              <b>{current.words?.word_ar}</b>
              {current.words?.example_ar && (
                <div className="small" style={{ fontWeight: 500 }}>{current.words.example_ar}</div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 }}>
            <button className="option wrong" onClick={() => rate('again')}>لم أعرفها</button>
            <button className="option" onClick={() => rate('hard')}>صعبة</button>
            <button className="option selected" onClick={() => rate('good')}>جيدة</button>
            <button className="option correct" onClick={() => rate('easy')}>سهلة</button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}