'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

export default function WritingPage() {
  const [tasks, setTasks] = useState([]);
  const [level, setLevel] = useState('A1');
  const [current, setCurrent] = useState(null);
  const [text, setText] = useState('');
  const [showSample, setShowSample] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('writing_tasks')
        .select('*')
        .order('sort_order');
      setTasks(data || []);
    }
    load();
  }, []);

  const filtered = tasks.filter((t) => t.level_code === level);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  }

  function open(task) {
    setCurrent(task);
    setText('');
    setFeedback('');
    setShowSample(false);
  }

  async function correct() {
    if (!text.trim()) {
      showToast('اكتب إجابتك أولًا');
      return;
    }

    setLoading(true);
    setFeedback('');

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:
            'أنت مصحح امتحان Goethe. هذه مهمة الكتابة: ' +
            current.task_de +
            ' وهذا نص المتعلم: ' +
            text +
            ' . قيّم النص بالعربية: 1) التصحيحات اللغوية مع السبب، 2) هل غطى نقاط المهمة؟، 3) تقدير من 100، 4) نسخة مصححة ومحسنة بالألمانية.',
          history: [],
        }),
      });
      const data = await res.json();
      setFeedback(data.text || 'تعذر التصحيح، حاول مجددًا.');
    } catch {
      setFeedback('تعذر الاتصال بالمعلم الذكي.');
    }

    setLoading(false);
  }

  return (
    <main className="container">
          <Upsell role={role} feature="الكتابة" />
      <div className="page-head">
        <h1 className="page-title">مدرسة الكتابة ✍️</h1>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      {current === null ? (
        <>
          <div className="card" style={{ marginBottom: 18 }}>
            <p className="muted" style={{ margin: 0, lineHeight: 2 }}>
              مهام كتابة بأسلوب امتحان Goethe الحقيقي. اكتب إجابتك بالألمانية،
              ثم احصل على تصحيح فوري من المعلم الذكي مع تقدير من 100، أو اطّلع على نموذج إجابة مثالي.
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
          {filtered.slice(0, LIMITS[role].writing).map((t) => (
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
                <div style={{ fontWeight: 800 }}>{t.title_ar}</div>
                <button className="btn btn-primary" onClick={() => open(t)}>
                  ابدأ الكتابة
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
                   <Upsell role={role} feature="الكتابة" /> 
<div className="page-head">
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>{current.title_ar}</h2>
            <button className="btn btn-ghost" onClick={() => setCurrent(null)}>
              ← كل المهام
            </button>
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <div className="small" style={{ color: 'var(--primary-dark)', fontWeight: 800, marginBottom: 8 }}>
              📋 المهمة بالألمانية (كما في الامتحان)
            </div>
            <p dir="ltr" style={{ textAlign: 'left', lineHeight: 1.9, fontWeight: 700, marginBottom: 10 }}>
              {current.task_de}
            </p>
            <div className="chip">💡 {current.tips_ar}</div>
          </div>

          <div className="card" style={{ marginBottom: 14 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <div style={{ fontWeight: 800 }}>✍️ إجابتك</div>
              <span className="chip">{wordCount} كلمة</span>
            </div>

            <textarea
              dir="ltr"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Schreib hier deine Antwort auf Deutsch..."
              style={{
                width: '100%',
                minHeight: 180,
                padding: 14,
                borderRadius: 14,
                border: '1px solid var(--line)',
                fontFamily: 'inherit',
                fontSize: 15,
                outline: 'none',
                resize: 'vertical',
                textAlign: 'left',
              }}
            />

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
              <button className="btn btn-primary btn-lg" onClick={correct} disabled={loading}>
                {loading ? 'جارٍ التصحيح...' : '🤖 تصحيح بالمعلم الذكي'}
              </button>
              <button className="btn btn-ghost btn-lg" onClick={() => setShowSample(!showSample)}>
                {showSample ? 'إخفاء النموذج' : '📖 عرض نموذج الإجابة'}
              </button>
            </div>
          </div>

          {showSample && (
            <div className="card" style={{ marginBottom: 14, background: '#f0fdf4' }}>
              <div className="small" style={{ color: '#16a34a', fontWeight: 800, marginBottom: 8 }}>
                📖 نموذج إجابة مثالي
              </div>
              <p dir="ltr" style={{ textAlign: 'left', lineHeight: 2, margin: 0, whiteSpace: 'pre-wrap' }}>
                {current.sample_solution_de}
              </p>
            </div>
          )}

          {feedback && (
            <div className="card" style={{ background: '#f8fafc' }}>
              <div className="small" style={{ color: 'var(--primary-dark)', fontWeight: 800, marginBottom: 8 }}>
                🤖 تصحيح المعلم الذكي
              </div>
              <p style={{ lineHeight: 2, margin: 0, whiteSpace: 'pre-wrap' }}>{feedback}</p>
            </div>
          )}
        </>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}