'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useRole, LIMITS } from '../../lib/access';
import Upsell from '../../components/Upsell';

const VOICERSS_KEY = '0c2263233de54ab8b78716a6269c352e';

export default function ListeningPage() {
  const { role, userId } = useRole();
  const [exercises, setExercises] = useState([]);
  const [level, setLevel] = useState('A1');
  const [current, setCurrent] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [playing, setPlaying] = useState('');
  const [toast, setToast] = useState('');
  const audioRef = useRef(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('listening_exercises')
        .select('*')
        .order('sort_order');

      setExercises(data || []);
    }
    load();
  }, []);

  const filtered = exercises.filter((e) => e.level_code === level);
  const visible = filtered.slice(
    0,
    role === 'guest' && level !== 'A1' ? 0 : LIMITS[role].listening
  );

  function stopAll() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  const rateOf = (speed) => (speed === 'slow' ? 0.6 : 0.95);

  function speakLine(line, speed, onDone) {
    if (!('speechSynthesis' in window)) {
      onDone();
      return;
    }

    const u = new SpeechSynthesisUtterance(line);
    u.lang = 'de-DE';
    u.rate = rateOf(speed);

    const v = window.speechSynthesis
      .getVoices()
      .find((x) => x.lang.toLowerCase().startsWith('de'));

    if (!v) {
      onDone();
      return;
    }

    u.voice = v;
    u.onend = onDone;
    u.onerror = onDone;
    window.speechSynthesis.speak(u);
  }

  function play(input, speed) {
    stopAll();
    setPlaying(speed);

    const raw = Array.isArray(input)
      ? input.map((l) => (typeof l === 'string' ? l : l.t || l.text || ''))
      : String(input || '').split(/\n/);

    const lines = raw
      .map((l) => String(l).replace(/^[-–—]/, '').replace(/[„"]/g, '').trim())
      .filter((l) => l.length > 2);

    const parts = lines.length > 0 ? lines : ['...'];

    function playPart(i) {
      if (i >= parts.length) {
        setPlaying('');
        return;
      }

      const line = parts[i];
      const female = i % 2 === 1;
      let advanced = false;

      function advance() {
        if (advanced) return;
        advanced = true;
        playPart(i + 1);
      }

      const sources = [
        'https://api.streamelements.com/kappa/v2/speech?voice=' +
          (female ? 'Marlene' : 'Hans') +
          '&text=' +
          encodeURIComponent(line),
      ];

      if (VOICERSS_KEY && VOICERSS_KEY.length > 20 && !VOICERSS_KEY.includes('ضع')) {
        sources.push(
          'https://api.voicerss.org/?key=' +
            VOICERSS_KEY +
            '&hl=de-de&src=' +
            encodeURIComponent(line)
        );
      }

      let srcIdx = 0;

      function startSource() {
        if (advanced) return;

        if (srcIdx >= sources.length) {
          advanced = true;
          speakLine(line, speed, () => playPart(i + 1));
          return;
        }

        let failed = false;
        const audio = new Audio(sources[srcIdx]);
        audioRef.current = audio;

        const applyRate = () => {
          audio.playbackRate = rateOf(speed);
        };

        const fail = () => {
          if (failed || advanced) return;
          failed = true;
          audio.pause();
          srcIdx += 1;
          startSource();
        };

        audio.onloadedmetadata = applyRate;
        audio.onended = advance;
        audio.onerror = fail;

        audio.play().then(applyRate).catch(fail);
      }

      startSource();
    }

    playPart(0);
  }

  function open(ex) {
    stopAll();
    setCurrent(ex);
    setAnswers({});
    setSubmitted(false);
    setResult(null);
  }

  function select(qi, oi) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qi]: oi }));
  }

  async function submit() {
    const qs = current.questions || [];
    const correct = qs.filter((q, i) => answers[i] === q.c).length;

    setResult({ correct, total: qs.length });
    setSubmitted(true);

    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      await supabase
        .from('profiles')
        .update({ points: (profile?.points ?? 0) + correct * 2 })
        .eq('id', userId);

      setToast(`+${correct * 2} نقطة!`);
      setTimeout(() => setToast(''), 2500);
    }
  }

  return (
    <main className="container">
      <Upsell role={role} feature="الاستماع" />

      <div className="page-head">
        <h1 className="page-title">الاستماع الحقيقي 🎧</h1>
        <a className="btn btn-ghost" href="/dashboard">← لوحة التعلم</a>
      </div>

      {!current && (
        <>
          <div className="pills" style={{ marginBottom: 16 }}>
            {['A1', 'A2', 'B1', 'B2'].map((l) => (
              <button
                key={l}
                className="pill"
                onClick={() => setLevel(l)}
                style={
                  level === l
                    ? {
                        background: 'var(--primary)',
                        color: '#fff',
                        borderColor: 'var(--primary)',
                      }
                    : {}
                }
              >
                {l}
              </button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {visible.map((ex) => (
              <button
                key={ex.id}
                className="card"
                style={{ textAlign: 'right', cursor: 'pointer' }}
                onClick={() => open(ex)}
              >
                <div style={{ fontWeight: 800, marginBottom: 4 }}>{ex.title_ar}</div>
                <div className="muted small">استمع بسرعتين ثم أجب عن الأسئلة</div>
              </button>
            ))}
          </div>
        </>
      )}

      {current && (
        <div className="card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
              marginBottom: 14,
            }}
          >
            <b style={{ fontSize: 18 }}>{current.title_ar}</b>
            <button className="btn btn-ghost" onClick={() => setCurrent(null)}>
              ← كل المقاطع
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary"
              onClick={() => play(current.script, 'normal')}
            >
              {playing === 'normal' ? '⏸ يعمل...' : '🔊 سرعة طبيعية'}
            </button>
            <button
              className="btn btn-ghost"
              onClick={() => play(current.script, 'slow')}
            >
              {playing === 'slow' ? '⏸ يعمل...' : '🐢 سرعة بطيئة'}
            </button>
          </div>

          {(current.questions || []).map((q, qi) => (
            <div key={qi} style={{ marginBottom: 16 }}>
              <p dir="ltr" style={{ fontWeight: 800, textAlign: 'left', marginBottom: 8 }}>
                {q.q}
              </p>
              <div style={{ display: 'grid', gap: 8 }}>
                {q.o.map((opt, oi) => {
                  let cls = 'option';
                  if (submitted && oi === q.c) cls += ' correct';
                  else if (submitted && answers[qi] === oi && oi !== q.c) cls += ' wrong';
                  else if (answers[qi] === oi) cls += ' selected';

                  return (
                    <button key={oi} className={cls} onClick={() => select(qi, oi)}>
                      <span dir="ltr">{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {!submitted ? (
            <button className="btn btn-primary btn-lg" onClick={submit}>
              تحقق من إجاباتك
            </button>
          ) : (
            <div
              className="card"
              style={{
                textAlign: 'center',
                background: result.correct === result.total ? '#f0fdf4' : '#fffbeb',
              }}
            >
              <b style={{ fontSize: 20 }}>
                نتيجتك: {result.correct} من {result.total}
              </b>
            </div>
          )}
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}