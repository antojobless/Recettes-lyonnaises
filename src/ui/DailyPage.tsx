import { useEffect, useRef, useState } from 'react';
import { findExercise, MODULES } from '../exercises';
import { buildSession, minutesOf, sessionMinutes } from '../session/daily';
import { recordFailure, today } from '../state/progress';
import { useStore } from '../state/store';
import { mmss } from './ExamPage';
import { ExercisePlayer } from './ExercisePlayer';
import { richText } from './Rich';

/** Crée (ou reprend) la séance du jour. */
export function useTodaySession() {
  const { progress, update } = useStore();
  const day = today();
  const s = progress.session?.date === day ? progress.session : null;
  useEffect(() => {
    if (!s) update((p) => (p.session?.date === day ? p : { ...p, session: buildSession(p, day) }));
  }, [s, day, update]);
  return s;
}

function MiniTest({ ids, seconds, onEnd }: { ids: string[]; seconds: number; onEnd: (score: number, used: number) => void }) {
  const [i, setI] = useState(0);
  const [score, setScore] = useState(0);
  const start = useRef(Date.now());
  const [now, setNow] = useState(Date.now());
  const ended = useRef(false);
  const remaining = Math.max(0, seconds - (now - start.current) / 1000);
  const end = (sc: number) => {
    if (ended.current) return;
    ended.current = true;
    onEnd(sc, Math.round((Date.now() - start.current) / 1000));
  };
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (remaining <= 0) end(score);
  });
  const ex = findExercise(ids[i])!;
  const [solved, setSolved] = useState(false);
  const next = (sc: number) => {
    setSolved(false);
    if (i + 1 >= ids.length) end(sc);
    else setI(i + 1);
  };
  return (
    <div data-testid="mini-test">
      <div className="exam-head">
        <strong>
          Mini-test · {i + 1}/{ids.length}
        </strong>
        <div className={`timer ${remaining < 60 ? 'low' : ''}`}>⏱ {mmss(remaining)}</div>
      </div>
      <ExercisePlayer
        key={ex.id}
        ex={ex}
        allowHints={false}
        onSolved={() => {
          setSolved(true);
          setScore(score + 1);
        }}
      />
      <div className="row-between">
        <span className="muted small">Pas d’indice pendant le mini-test.</span>
        <button className="btn primary" data-testid="mini-next" onClick={() => next(score)}>
          {solved ? 'Suivant →' : 'Passer →'}
        </button>
      </div>
    </div>
  );
}

function DailyStep({ id, kind, pos, total, onNext }: { id: string; kind: 'new' | 'review'; pos: number; total: number; onNext: (ok: boolean) => void }) {
  const { progress, update } = useStore();
  const lang = progress.lang;
  const ex = findExercise(id)!;
  const m = MODULES.find((x) => x.id === ex.module)!;
  const [solved, setSolved] = useState(false);
  return (
    <div>
      <div className="exam-head">
        <strong>
          Séance du jour · {pos}/{total}
        </strong>
        <span className={`badge ${kind}`}>{kind === 'new' ? 'Nouveau' : 'Révision'}</span>
        <span className="muted small">
          Module {m.id} · {richText(m.title, lang)}
        </span>
      </div>
      <h2>{richText(ex.title, lang)}</h2>
      <ExercisePlayer ex={ex} onSolved={() => setSolved(true)} />
      <div className="row-between">
        {!solved ? (
          <button
            className="btn ghost"
            onClick={() => {
              update((p) => recordFailure(p, ex.id, ex.notions));
              onNext(false);
            }}
          >
            Passer (la notion reviendra demain)
          </button>
        ) : (
          <span />
        )}
        <button className="btn primary" data-testid="daily-next" disabled={!solved} onClick={() => onNext(true)}>
          Exercice suivant →
        </button>
      </div>
    </div>
  );
}

export function DailyPage() {
  const { progress, update } = useStore();
  const lang = progress.lang;
  const s = useTodaySession();
  const [mode, setMode] = useState<'plan' | 'run' | 'test'>('plan');
  if (!s) return <p>Préparation de ta séance…</p>;
  const pending = s.items.filter((x) => !(x.id in s.done));
  const cur = pending[0];
  const mark = (id: string, ok: boolean) => update((p) => (p.session ? { ...p, session: { ...p.session, done: { ...p.session.done, [id]: ok } } } : p));

  if (mode === 'run' && cur) {
    const ex = findExercise(cur.id)!;
    return <DailyStep key={ex.id} id={ex.id} kind={cur.kind} pos={s.items.length - pending.length + 1} total={s.items.length} onNext={(ok) => mark(ex.id, ok)} />;
  }
  if (mode === 'run' && !cur && !s.testResult) setTimeout(() => setMode('test'), 0);

  if (mode === 'test' && !s.testResult && s.test.length)
    return (
      <MiniTest
        ids={s.test}
        seconds={s.testSeconds}
        onEnd={(score, used) => {
          update((p) => (p.session ? { ...p, session: { ...p.session, testResult: { score, max: s.test.length, seconds: used } } } : p));
          setMode('plan');
        }}
      />
    );

  const doneCount = s.items.length - pending.length;
  return (
    <div data-testid="daily-plan">
      <h1>Séance du jour</h1>
      <p>
        Environ <strong>{sessionMinutes(s)} minutes</strong> : un peu de nouveau, beaucoup de révision (une notion ratée revient le lendemain, une notion réussie revient dans 3 jours, puis 7, puis 14), et un mini-test chronométré à la fin.
      </p>
      <ol className="plan">
        {s.items.map((x) => {
          const ex = findExercise(x.id)!;
          const st = s.done[x.id];
          return (
            <li key={x.id} className={st === true ? 'done' : st === false ? 'skipped' : ''}>
              <span className={`badge ${x.kind}`}>{x.kind === 'new' ? 'Nouveau' : 'Révision'}</span> {richText(ex.title, lang)} <span className="muted small">· module {ex.module} · ~{minutesOf(ex)} min</span>
              {st === true && ' ✓'}
              {st === false && <span className="muted small"> (passé)</span>}
            </li>
          );
        })}
        <li className={s.testResult ? 'done' : ''}>
          <span className="badge test">Mini-test</span> {s.test.length} exercices en {Math.round(s.testSeconds / 60)} minutes, sans indice
          {s.testResult && ` ✓ ${s.testResult.score}/${s.testResult.max}`}
        </li>
      </ol>
      {s.testResult ? (
        <div className="result ok">
          <strong>Séance terminée !</strong> Mini-test : {s.testResult.score}/{s.testResult.max}. Reviens demain : ta prochaine séance est déjà prévue selon tes résultats.
        </div>
      ) : (
        <button className="btn primary" data-testid="daily-start" onClick={() => setMode(pending.length ? 'run' : 'test')}>
          {doneCount === 0 ? 'Commencer' : pending.length ? 'Continuer' : 'Passer au mini-test'}
        </button>
      )}
    </div>
  );
}
