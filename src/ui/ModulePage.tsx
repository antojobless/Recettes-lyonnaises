import { useEffect, useMemo, useState } from 'react';
import { modelFromSetup } from '../exercises/checker';
import { MODULES } from '../exercises';
import { Module } from '../exercises/types';
import { parseAddr, shiftFormula, translateFormula } from '../engine/formula';
import { Grid } from '../grid/Grid';
import { isUnlocked, moduleRate, UNLOCK } from '../state/stats';
import { useStore } from '../state/store';
import { Rich, richText } from './Rich';
import { go, href } from './router';

export function Lesson({ m }: { m: Module }) {
  const { progress, update } = useStore();
  const lang = progress.lang;
  const [i, setI] = useState(0);
  const s = m.lesson[i];
  const last = i === m.lesson.length - 1;
  return (
    <div className="card lesson" data-testid="lesson">
      <div className="dots">
        {m.lesson.map((_, k) => (
          <button key={k} className={`dot ${k === i ? 'on' : ''}`} onClick={() => setI(k)} aria-label={`Écran ${k + 1}`} />
        ))}
        <span className="muted">
          {i + 1} / {m.lesson.length}
        </span>
      </div>
      <h2>
        <Rich text={s.title} lang={lang} />
      </h2>
      {s.body.map((b, k) => (
        <Rich key={k} as="p" text={b} lang={lang} />
      ))}
      {s.example && (
        <div className="example">
          <span className="example-label">Exemple</span>
          {s.example.formula && <code className="big-formula">{translateFormula(s.example.formula, 'en', lang)}</code>}
          {s.example.table && (
            <table className="mini">
              <tbody>
                {s.example.table.map((row, r) => (
                  <tr key={r}>
                    {row.map((c, j) => (r === 0 ? <th key={j}>{c}</th> : <td key={j}>{String(c).startsWith('=') ? <code>{c}</code> : c}</td>))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {s.example.caption && <Rich as="p" text={s.example.caption} lang={lang} />}
        </div>
      )}
      <div className="row-between">
        <button className="btn ghost" disabled={i === 0} onClick={() => setI(i - 1)}>
          ← Précédent
        </button>
        {last ? (
          <button
            className="btn primary"
            data-testid="lesson-done"
            onClick={() => {
              update((p) => ({ ...p, lessons: { ...p.lessons, [m.id]: true } }));
              go({ page: 'module', id: m.id, tab: 'exemple' });
            }}
          >
            Voir l’exemple résolu →
          </button>
        ) : (
          <button className="btn primary" data-testid="lesson-next" onClick={() => setI(i + 1)}>
            Suivant →
          </button>
        )}
      </div>
    </div>
  );
}

export function Worked({ m }: { m: Module }) {
  const lang = useStore().progress.lang;
  const setup = useMemo(() => m.worked.setup(), [m]);
  const [step, setStep] = useState(0);
  const model = useMemo(() => modelFromSetup(setup, lang), [setup, lang]);
  const [focus, setFocus] = useState<{ row: number; col: number; n: number } | undefined>();
  const [, setTick] = useState(0);

  const apply = (k: number) => {
    const s = m.worked.steps[k];
    if (s.cell && s.input) {
      const a = parseAddr(s.cell);
      const local = s.input.startsWith('=') ? translateFormula(s.input, 'en', lang) : s.input;
      const cells = [{ ...a, raw: local }];
      if (s.fillTo) {
        const b = parseAddr(s.fillTo);
        for (let r = a.row + 1; r <= b.row; r++) cells.push({ row: r, col: a.col, raw: shiftFormula(local, r - a.row, 0, lang) });
      }
      model.setMany(cells);
      setFocus({ ...(s.fillTo ? { row: a.row + 1, col: a.col } : a), n: k });
      setTick((t) => t + 1);
    }
  };

  useEffect(() => {
    setStep(0);
    if (m.worked.steps[0].cell) apply(0);
  }, [model]); // eslint-disable-line react-hooks/exhaustive-deps

  const steps = m.worked.steps;
  return (
    <div className="card" data-testid="worked">
      <Rich as="p" text={m.worked.intro} lang={lang} />
      <ol className="steps">
        {steps.slice(0, step + 1).map((s, k) => (
          <li key={k} className={k === step ? 'current' : ''}>
            <Rich text={s.text} lang={lang} />
            {s.input?.startsWith('=') && !s.text.includes('`') && (
              <>
                {' '}
                <code>{translateFormula(s.input, 'en', lang)}</code>
              </>
            )}
          </li>
        ))}
      </ol>
      <div className="ex-actions">
        {step < steps.length - 1 ? (
          <button
            className="btn primary"
            data-testid="worked-next"
            onClick={() => {
              apply(step + 1);
              setStep(step + 1);
            }}
          >
            Étape suivante ({step + 2}/{steps.length})
          </button>
        ) : (
          <button className="btn primary" onClick={() => go({ page: 'module', id: m.id, tab: 'exercices' })}>
            Passer aux exercices →
          </button>
        )}
      </div>
      <Grid model={model} rows={Math.min(setup.rows, 40)} cols={setup.cols} colWidths={setup.colWidths} height={300} focusCell={focus} />
      <p className="muted small">Tu peux cliquer sur les cellules pour lire leurs formules, et même modifier la feuille.</p>
    </div>
  );
}

export function ExerciseList({ m }: { m: Module }) {
  const { progress } = useStore();
  const lang = progress.lang;
  return (
    <div className="card">
      <div className="ex-list">
        {m.exercises.map((e, k) => {
          const r = progress.ex[e.id];
          return (
            <a key={e.id} className={`ex-item ${r?.solved ? 'done' : ''}`} href={href({ page: 'ex', id: e.id })} data-testid={`ex-link-${e.id}`}>
              <span className="ex-num">{r?.solved ? '✓' : k + 1}</span>
              <span className="ex-title">{richText(e.title, lang)}</span>
              {r?.solved && <span className="score">{Math.round(r.score * 100)} %</span>}
            </a>
          );
        })}
      </div>
    </div>
  );
}

export function ModulePage({ id, tab }: { id: number; tab: 'lecon' | 'exemple' | 'exercices' }) {
  const { progress } = useStore();
  const m = MODULES.find((x) => x.id === id) ?? MODULES[0];
  const idx = MODULES.indexOf(m);
  const rate = moduleRate(progress, m);
  const tabs: [typeof tab, string][] = [
    ['lecon', '1. Leçon'],
    ['exemple', '2. Exemple résolu'],
    ['exercices', '3. Exercices'],
  ];
  return (
    <div>
      <a href={href({ page: 'parcours' })} className="back">
        ← Parcours
      </a>
      <h1>
        Module {m.id} · <Rich text={m.title} lang={progress.lang} />
      </h1>
      {!isUnlocked(progress, idx) && <p className="warn-box">Ce module se débloque à 80 % de réussite du module précédent. Tu peux quand même le regarder.</p>}
      <div className="progress-line">
        <div className="bar">
          <div style={{ width: `${rate * 100}%` }} />
        </div>
        <span>
          {Math.round(rate * 100)} % réussi {rate >= UNLOCK ? '· module suivant débloqué ✓' : `(objectif ${UNLOCK * 100} %)`}
        </span>
      </div>
      <nav className="tabs">
        {tabs.map(([t, label]) => (
          <a key={t} className={t === tab ? 'on' : ''} href={href({ page: 'module', id: m.id, tab: t })} data-testid={`tab-${t}`}>
            {label}
          </a>
        ))}
      </nav>
      {tab === 'lecon' && <Lesson key={m.id} m={m} />}
      {tab === 'exemple' && <Worked key={m.id} m={m} />}
      {tab === 'exercices' && <ExerciseList m={m} />}
    </div>
  );
}

export function Parcours() {
  const { progress } = useStore();
  const lang = progress.lang;
  return (
    <div>
      <h1>Parcours</h1>
      <p className="muted">Les modules dans l’ordre. Le suivant se débloque quand tu as réussi 80 % des exercices du module.</p>
      <div className="module-grid">
        {MODULES.map((m, i) => {
          const open = isUnlocked(progress, i);
          const rate = moduleRate(progress, m);
          return (
            <a key={m.id} className={`module-card ${open ? '' : 'locked'}`} href={href({ page: 'module', id: m.id, tab: progress.lessons[m.id] ? 'exercices' : 'lecon' })} data-testid={`module-${m.id}`}>
              <span className="module-num">{open ? m.id : '🔒'}</span>
              <span className="module-title">{richText(m.title, lang)}</span>
              <div className="bar">
                <div style={{ width: `${rate * 100}%` }} />
              </div>
              <span className="muted small">
                {m.exercises.filter((e) => progress.ex[e.id]?.solved).length}/{m.exercises.length} exercices
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
