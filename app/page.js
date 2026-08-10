'use client';

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [status, setStatus] = useState('جارٍ فحص الاتصال...');
  const [levels, setLevels] = useState([]);

  useEffect(() => {
    async function check() {
      const { data, error } = await supabase
        .from('levels')
        .select('*, modules(lessons(id))')
        .order('sort_order');

      if (error) {
        setStatus('تعذر الاتصال بقاعدة البيانات');
        return;
      }

      setLevels(data || []);
      setStatus('منصة متصلة وجاهزة ✅');
    }

    check();
  }, []);

  return (
    <main className="container">
      <header className="topbar">
        <div className="logo">🇩🇪 German بالعربي</div>
        <div className="topbar-actions">
          <a className="btn btn-ghost" href="/login">تسجيل الدخول</a>
          <a className="btn btn-primary" href="/register">إنشاء حساب</a>
        </div>
      </header>

      <section className="hero">
        <span className="chip">{status}</span>
        <h1>
          تعلّم الألمانية <span className="grad">بالعربية</span>
          <br />
          من الصفر حتى B1
        </h1>
        <p>
          منصة عربية متكاملة بأسلوب امتحان Goethe: دروس مترابطة، أكثر من 1000 كلمة،
          قواعد مشروحة، 60 نموذج امتحان، مراجعة ذكية، ومعلم ذكاء اصطناعي يحادثك ويصحح لك.
        </p>
        <div className="hero-actions">
          <a className="btn btn-primary btn-lg" href="/register">ابدأ التعلم مجانًا</a>
          <a className="btn btn-ghost btn-lg" href="/login">لديّ حساب بالفعل</a>
        </div>
      </section>

      <section className="grid-3">
        {levels.map((level) => {
          const lessonCount = (level.modules || []).reduce(
            (sum, m) => sum + (m.lessons?.length || 0),
            0
          );

          return (
            <div key={level.id} className="card level-card">
              <div className="level-code">{level.code}</div>
              <h3>{level.name_ar}</h3>
              <p>{level.description_ar}</p>
              <span className="chip">{lessonCount} درسًا</span>
            </div>
          );
        })}
      </section>

      <section className="grid-3">
        <div className="card level-card">
          <div className="level-code">🎓</div>
          <h3>نماذج امتحان Goethe</h3>
          <p>60 نموذجًا تدريبيًا بأقسام الاستماع والقراءة والمفردات والقواعد.</p>
        </div>
        <div className="card level-card">
          <div className="level-code">🤖</div>
          <h3>معلم ذكاء اصطناعي</h3>
          <p>يحادثك بالألمانية، يصحح كتابتك، ويشرح القواعد بالعربية فورًا.</p>
        </div>
        <div className="card level-card">
          <div className="level-code">🧠</div>
          <h3>مراجعة ذكية</h3>
          <p>بطاقات كلمات بتكرار متباعد لتثبيت المفردات في الذاكرة طويلة المدى.</p>
        </div>
      </section>

      <footer className="footer">صُنع بحبٍ لتعليم الألمانية بالعربية 💚</footer>
    </main>
  );
}