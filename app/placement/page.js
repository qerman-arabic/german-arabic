'use client';

import { useState } from 'react';

const BLOCKS = [
  {
    level: 'A1',
    questions: [
      { q: 'ما أداة التعريف الصحيحة لكلمة Haus؟', o: ['das', 'der', 'die', 'den'], c: 0 },
      { q: 'أكمل: Ich ___ aus Syrien.', o: ['komme', 'kommst', 'kommt', 'kommen'], c: 0 },
      { q: 'ما النفي الصحيح لـ Ich habe ein Auto؟', o: ['Ich habe kein Auto.', 'Ich habe nicht Auto.', 'Ich habe keine Auto.', 'Ich kein habe Auto.'], c: 0 },
      { q: 'كيف تقول «الكتاب» بالألمانية؟', o: ['das Buch', 'der Buch', 'die Buch', 'das Boch'], c: 0 },
      { q: 'أكمل: Wir ___ müde.', o: ['sind', 'bin', 'ist', 'seid'], c: 0 },
    ],
  },
  {
    level: 'A2',
    questions: [
      { q: 'الماضي التام الصحيح من gehen مع ich؟', o: ['bin gegangen', 'habe gegangen', 'habe geht', 'bin geht'], c: 0 },
      { q: 'اختر حرف الجر: Ich fahre ___ dem Bus.', o: ['mit', 'für', 'ohne', 'gegen'], c: 0 },
      { q: 'صيغة المقارنة من groß؟', o: ['größer', 'am größten', 'mehr groß', 'größter'], c: 0 },
      { q: 'أكمل: Ich lerne Deutsch, ___ in Berlin zu arbeiten.', o: ['um', 'für', 'weil', 'damit'], c: 0 },
      { q: 'اختر الداتيف الصحيح: Ich helfe ___.', o: ['dem Mann', 'den Mann', 'der Mann', 'das Mann'], c: 0 },
    ],
  },
  {
    level: 'B1',
    questions: [
      { q: 'المبني للمجهول: Das Haus ___ gebaut.', o: ['wird', 'ist', 'hat', 'werden'], c: 0 },
      { q: 'أكمل بترتيب صحيح: Obwohl es regnet, ___ spazieren.', o: ['gehe ich', 'ich gehe', 'gehe', 'ich ging'], c: 0 },
      { q: 'الجملة النسبية: Der Mann, ___ ich sehe, ist mein Lehrer.', o: ['den', 'der', 'dem', 'das'], c: 0 },
      { q: 'أكمل: Ich habe vor, nach Deutschland ___.', o: ['zu ziehen', 'ziehen', 'gezogen', 'ziehe'], c: 0 },
      { q: 'أكمل: Seitdem er angekommen ___, ruft er täglich an.', o: ['ist', 'war', 'sein', 'wurde'], c: 0 },
    ],
  },
  {
    level: 'B2',
    questions: [
      { q: 'الكلام غير المباشر: Er sagt, er ___ keine Zeit.', o: ['habe', 'hat', 'hätte', 'haben'], c: 0 },
      { q: 'بديل المجهول: Das Problem ___ lösen.', o: ['lässt sich', 'wird sich', 'ist sich', 'hat sich'], c: 0 },
      { q: 'الصفة الممتدة: das gestern ___ Ergebnis', o: ['veröffentlichte', 'veröffentlichte', 'veröffentlich', 'veröffentlichend'], c: 0 },
      { q: 'أكمل: Je mehr du übst, ___ besser wirst du.', o: ['desto', 'damit', 'obwohl', 'jedoch'], c: 0 },
      { q: 'الجنيتيف: wegen ___ schlechten Wetters', o: ['des', 'der', 'dem', 'den'], c: 0 },
    ],
  },
];

export default function PlacementPage() {
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState('');

  function select(level, qi, oi) {
    if (result) return;
    setAnswers((prev) => ({ ...prev, [`${level}-${qi}`]: oi }));
  }

  function submit() {
    const total = BLOCKS.reduce((n, b) => n + b.questions.length, 0);
    if (Object.keys(answers).length < total) {
      setToast('أجب عن جميع الأسئلة العشرين أولًا');
      setTimeout(() => setToast(''), 2500);
      return;
    }

    const scores = BLOCKS.map((b) =>
      b.questions.reduce((acc, q, qi) => acc + (answers[`${b.level}-${qi}`] === q.c ? 1 : 0), 0)
    );

    let rec = 'A1';
    if (scores[0] >= 3) rec = 'A2';
    if (scores[0] >= 3 && scores[1] >= 3) rec = 'B1';
    if (scores[0] >= 3 && scores[1] >= 3 && scores[2] >= 3) rec = 'B2';

    const advanced = scores.every((s) => s >= 4);

    setResult({ scores, rec, advanced });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function createPlan() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('prefill_plan_level', result.rec);
    }
    window.location.href = '/dashboard';
  }

  return (
    <main className="container">
      <div className="page-head">
        <h1 className="page-title">حدد مستواك 🎯</h1>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      {!result && (
        <div className="card" style={{ marginBottom: 18 }}>
          <p className="muted" style={{ margin: 0, lineHeight: 2 }}>
            20 سؤالًا من A1 إلى B2. أجب بصدق دون مساعدة، وسنقترح عليك المستوى
            الأنسب لبدء رحلتك — خلال دقيقتين.
          </p>
        </div>
      )}

      {result && (
        <div
          className="card"
          style={{
            textAlign: 'center',
            background: 'linear-gradient(135deg, #0f766e, #10b981)',
            color: '#fff',
            marginBottom: 18,
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 800, opacity: 0.9 }}>
            مستواك المقترح
          </div>
          <div style={{ fontSize: 56, fontWeight: 900 }}>{result.rec}</div>
          <p style={{ opacity: 0.95, lineHeight: 1.9, maxWidth: 560, margin: '0 auto' }}>
            {result.advanced
              ? 'نتيجة استثنائية! أنت متمكن حتى B2 — ركّز على نماذج الامتحان والمحاكاة.'
              : `تحليلك يظهر أنك تتقن ما قبل ${result.rec} وتحتاج البدء منه. خطتك جاهزة في لوحة التعلم.`}
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
            <button
              className="btn btn-lg"
              style={{ background: '#fff', color: '#0f766e', fontWeight: 900 }}
              onClick={createPlan}
            >
              🗓️ أنشئ خطتي بمستوى {result.rec}
            </button>
            <a className="btn btn-lg" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }} href="/dashboard">
              ابدأ التعلم مباشرة
            </a>
            <button
              className="btn btn-lg"
              style={{ background: 'rgba(255,255,255,.15)', color: '#fff' }}
              onClick={() => {
                setResult(null);
                setAnswers({});
              }}
            >
              إعادة الاختبار
            </button>
          </div>
        </div>
      )}

      {result && (
        <div className="card" style={{ marginBottom: 18 }}>
          <h2 className="section-title">تفصيل نتائجك</h2>
          {BLOCKS.map((b, i) => (
            <div key={b.level} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 800 }}>{b.level}</span>
                <span className="muted small">{result.scores[i]}/5</span>
              </div>
              <div className="progress" style={{ margin: 0 }}>
                <div
                  className="progress-fill"
                  style={{ width: `${(result.scores[i] / 5) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {!result &&
        BLOCKS.map((b) => (
          <section key={b.level} className="card" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 19, fontWeight: 900, marginBottom: 12 }}>
              قسم {b.level}
            </h2>
            {b.questions.map((q, qi) => (
              <div key={qi} style={{ marginBottom: 14 }}>
                <p style={{ fontWeight: 800, marginBottom: 8 }}>
                  {qi + 1}. {q.q}
                </p>
                <div style={{ display: 'grid', gap: 8 }}>
                  {q.o.map((opt, oi) => {
                    let cls = 'option';
                    if (answers[`${b.level}-${qi}`] === oi) cls += ' selected';
                    return (
                      <button key={oi} className={cls} onClick={() => select(b.level, qi, oi)}>
                        <span dir="ltr">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        ))}

      {!result && (
        <button className="btn btn-primary btn-lg" onClick={submit}>
          احسب مستواي
        </button>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}