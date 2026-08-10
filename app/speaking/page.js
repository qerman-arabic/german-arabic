'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const SCENARIOS = [
  {
    level: 'A1',
    title: 'التعارف في الامتحان',
    questions: [
      'Wie heißen Sie?',
      'Woher kommen Sie?',
      'Wo wohnen Sie?',
      'Wie alt sind Sie?',
      'Welche Sprachen sprechen Sie?',
    ],
  },
  {
    level: 'A1',
    title: 'يومك اليومي',
    questions: [
      'Wann stehen Sie auf?',
      'Was essen Sie zum Frühstück?',
      'Was machen Sie am Morgen?',
      'Was machen Sie am Wochenende?',
      'Was ist Ihr Hobby?',
    ],
  },
  {
    level: 'A1',
    title: 'التهجئة والأرقام',
    questions: [
      'Buchstabieren Sie bitte Ihren Namen.',
      'Wie ist Ihre Telefonnummer?',
      'Wie alt sind Sie?',
      'Welches Datum haben wir heute?',
      'Wie viel kostet ein Kaffee? Sagen Sie einen Preis.',
    ],
  },
  {
    level: 'A2',
    title: 'التعارف الموسع',
    questions: [
      'Stellen Sie sich bitte vor.',
      'Erzählen Sie etwas über Ihre Familie.',
      'Was machen Sie in Ihrer Freizeit?',
      'Warum lernen Sie Deutsch?',
    ],
  },
  {
    level: 'A2',
    title: 'التخطيط لحفلة مع صديق',
    questions: [
      'Wir wollen eine Party planen. Wann sollen wir feiern?',
      'Wo sollen wir feiern?',
      'Was sollen wir kaufen?',
      'Wen sollen wir einladen?',
    ],
  },
  {
    level: 'A2',
    title: 'موقف: في المتجر',
    questions: [
      'Guten Tag! Was möchten Sie kaufen?',
      'Welche Größe brauchen Sie?',
      'Möchten Sie bar oder mit Karte bezahlen?',
      'Brauchen Sie eine Tasche?',
    ],
  },
  {
    level: 'B1',
    title: 'تقديم النفس الكامل',
    questions: [
      'Stellen Sie sich bitte vor.',
      'Erzählen Sie von Ihrer Arbeit oder Ausbildung.',
      'Warum lernen Sie Deutsch?',
      'Was sind Ihre Pläne für die Zukunft?',
    ],
  },
  {
    level: 'B1',
    title: 'وصف صورة والتعليق',
    questions: [
      'Beschreiben Sie bitte dieses Bild: Eine Familie sitzt am Tisch und isst zusammen.',
      'Was denken Sie: Ist das Familienessen wichtig? Warum?',
      'Wie war das bei Ihnen in Ihrer Heimat?',
    ],
  },
  {
    level: 'B1',
    title: 'الاتفاق على موعد',
    questions: [
      'Wir müssen einen Termin für unser Treffen finden. Ich kann am Montag. Und Sie?',
      'Montag ist schlecht. Geht es am Dienstag?',
      'Dienstag um 10 Uhr? Passt das?',
      'Gut, wo treffen wir uns?',
    ],
  },
  {
    level: 'B2',
    title: 'عرض قصير: وسائل التواصل',
    questions: [
      'Halten Sie bitte einen kurzen Vortrag zum Thema: Soziale Medien. Sagen Sie Ihre Meinung und zwei Argumente.',
      'Nennen Sie bitte ein Beispiel aus Ihrem Leben.',
      'Was sind die Nachteile? Nennen Sie zwei.',
    ],
  },
  {
    level: 'B2',
    title: 'مقابلة عمل',
    questions: [
      'Erzählen Sie etwas über sich.',
      'Was sind Ihre Stärken?',
      'Warum sollen wir Sie nehmen?',
      'Wo sehen Sie sich in fünf Jahren?',
    ],
  },
  {
    level: 'B2',
    title: 'نقاش: السيارات في المدينة',
    questions: [
      'Diskutieren Sie mit mir: Sollte das Auto in der Innenstadt verboten werden? Was meinen Sie?',
      'Aber viele Menschen brauchen das Auto. Was sagen Sie dazu?',
      'Haben Sie einen Kompromiss-Vorschlag?',
    ],
  },
];

export default function SpeakingPage() {
  const [userId, setUserId] = useState(null);
  const [level, setLevel] = useState('A1');
  const [scenario, setScenario] = useState(null);
  const [qIndex, setQIndex] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [text, setText] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [finalResult, setFinalResult] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getSession();
      if (data?.session) setUserId(data.session.user.id);
    }
    load();
  }, []);

  const filtered = SCENARIOS.filter((s) => s.level === level);

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  }

  function speak(t) {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'de-DE';
    u.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  function startRec() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      showToast('المتصفح لا يدعم التعرف الصوتي، اكتب إجابتك');
      return;
    }

    const rec = new SR();
    rec.lang = 'de-DE';
    rec.interimResults = false;

    rec.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setText((prev) => (prev ? prev + ' ' : '') + t);
    };
    rec.onend = () => setRecording(false);
    rec.onerror = () => {
      setRecording(false);
      showToast('لم يُلتقط الصوت، حاول مجددًا أو اكتب');
    };

    rec.start();
    setRecording(true);
    showToast('🎙️ تحدث الآن بالألمانية...');
  }

  function open(s) {
    setScenario(s);
    setQIndex(0);
    setTranscript([]);
    setText('');
    setFeedback('');
    setFinalResult('');
    setTimeout(() => speak(s.questions[0]), 300);
  }

  async function sendAnswer() {
    if (!text.trim()) {
      showToast('اكتب إجابتك أو تحدث بالمايك أولًا');
      return;
    }

    setLoading(true);
    setFeedback('');

    const question = scenario.questions[qIndex];

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:
            'أنت ممتحن Goethe للمستوى ' +
            level +
            '. السؤال: ' +
            question +
            ' وإجابة المتعلم: ' +
            text +
            ' . قيّم بإيجاز شديد بالعربية: خطأ أو خطأان فقط مع التصحيح، ثم جملة تشجيع. لا تكتب أكثر من 3 أسطر.',
          history: [],
        }),
      });
      const data = await res.json();
      setFeedback(data.text || '');
    } catch {
      setFeedback('تعذر التصحيح.');
    }

    setTranscript((prev) => [...prev, { q: question, a: text }]);
    setText('');
    setLoading(false);
  }

  function nextQuestion() {
    const next = qIndex + 1;
    setFeedback('');

    if (next < scenario.questions.length) {
      setQIndex(next);
      setTimeout(() => speak(scenario.questions[next]), 300);
    } else {
      finishExam();
    }
  }

  async function finishExam() {
    setLoading(true);

    const full = transcript
      .map((t, i) => `س${i + 1}: ${t.q} — ج: ${t.a}`)
      .join('\n');

    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:
            'أنت ممتحن Goethe رسمي للمستوى ' +
            level +
            '. هذا نص الامتحان الشفوي الكامل:\n' +
            full +
            '\nقدّم التقييم النهائي بالعربية: الطلاقة، القواعد، المفردات، ثم الدرجة من 100، ونصيحة واحدة.',
          history: [],
        }),
      });
      const data = await res.json();
      setFinalResult(data.text || '');
    } catch {
      setFinalResult('تعذر التقييم النهائي.');
    }

    if (userId) {
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
          points: (profile?.points ?? 0) + 30,
          streak,
          last_activity_date: new Date().toISOString(),
        })
        .eq('id', userId);
    }

    setLoading(false);
  }

  return (
    <main className="container">
      <div className="page-head">
        <h1 className="page-title">محاكي الامتحان الشفوي 🗣️</h1>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      {scenario === null ? (
        <>
          <div className="card" style={{ marginBottom: 18 }}>
            <p className="muted" style={{ margin: 0, lineHeight: 2 }}>
              عِش أجواء الجزء الشفوي من امتحان Goethe: الممتحن ينطق السؤال بالألمانية 🔊،
              وأنت تجيب **بصوتك** 🎙️ أو كتابة، مع تصحيح فوري وتقييم نهائي من 100.
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
            {filtered.map((s, i) => (
              <div
                key={i}
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
                  <div style={{ fontWeight: 800 }}>🗣️ {s.title}</div>
                  <span className="chip" style={{ marginTop: 6 }}>
                    {s.questions.length} أسئلة
                  </span>
                </div>
                <button className="btn btn-primary" onClick={() => open(s)}>
                  ابدأ الامتحان
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="page-head">
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900 }}>
              🗣️ {scenario.title}
            </h2>
            <button className="btn btn-ghost" onClick={() => setScenario(null)}>
              ← إنهاء
            </button>
          </div>

          {!finalResult && (
            <>
              <div className="card" style={{ textAlign: 'center', marginBottom: 14 }}>
                <span className="chip">
                  السؤال {qIndex + 1} من {scenario.questions.length}
                </span>
                <p dir="ltr" style={{ fontSize: 20, fontWeight: 800, margin: '14px 0' }}>
                  {scenario.questions[qIndex]}
                </p>
                <button className="btn btn-ghost" onClick={() => speak(scenario.questions[qIndex])}>
                  🔊 إعادة السؤال
                </button>
              </div>

              <div className="card" style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-primary"
                    onClick={startRec}
                    disabled={recording}
                  >
                    {recording ? '🎙️ يستمع...' : '🎙️ أجب بصوتك'}
                  </button>
                </div>

                <textarea
                  dir="ltr"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="إجابتك بالألمانية تظهر هنا (من المايك أو الكتابة)..."
                  style={{
                    width: '100%',
                    minHeight: 90,
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

                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                  <button className="btn btn-primary btn-lg" onClick={sendAnswer} disabled={loading}>
                    {loading ? 'جارٍ التقييم...' : 'إرسال الإجابة'}
                  </button>
                </div>
              </div>

              {feedback && (
                <div className="card" style={{ background: '#f8fafc', marginBottom: 14 }}>
                  <div className="small" style={{ color: 'var(--primary-dark)', fontWeight: 800, marginBottom: 6 }}>
                    ‍️ تعليق الممتحن
                  </div>
                  <p style={{ lineHeight: 2, margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>{feedback}</p>
                  <button className="btn btn-primary" onClick={nextQuestion}>
                    {qIndex + 1 < scenario.questions.length ? 'السؤال التالي ←' : '🏁 إنهاء الامتحان'}
                  </button>
                </div>
              )}
            </>
          )}

          {finalResult && (
            <div className="card" style={{ background: '#f0fdf4' }}>
              <div className="small" style={{ color: '#16a34a', fontWeight: 800, marginBottom: 8 }}>
                🏁 التقييم النهائي للامتحان الشفوي
              </div>
              <p style={{ lineHeight: 2, margin: '0 0 12px', whiteSpace: 'pre-wrap' }}>{finalResult}</p>
              <p className="chip">+30 نقطة لإتمامك الامتحان ⭐</p>
              <div style={{ marginTop: 12 }}>
                <button className="btn btn-primary" onClick={() => setScenario(null)}>
                  العودة للسيناريوهات
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}