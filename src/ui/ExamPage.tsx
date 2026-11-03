import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { parseAddr, translateFormula } from '../engine/formula';
import { gradeExam, QuestionResult } from '../exams/grade';
import { ExamSubject, SUBJECTS } from '../exams/subjects';
import { modelFromSetup } from '../exercises/checker';
import { PivotSpec } from '../exercises/types';
import { Grid, Range, rangeLabel } from '../grid/Grid';
import { useStore } from '../state/store';
import { emptySpec, PivotSimulator } from './PivotPlayer';
import { Rich } from './Rich';

export const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

function Running({ subject, minutes, onDone }: { subject: ExamSubject; minutes: number; onDone: (r: QuestionResult[], times: Record<string, number>, seconds: number) => void }) {
  const lang = useStore().progress.lang;
  const setup = useMemo(() => subject.setup(), [subject]);
  const model = useMemo(() => modelFromSetup(setup, lang), [setup]); // eslint-disable-line react-hooks/exhaustive-deps
  const ds = useMemo(() => subject.dataset(), [subject]);
  const [spec, setSpec] = useState<PivotSpec>(emptySpec);
  const [answer, setAnswer] = useState('');
  const [tab, setTab] = useState<'sheet' | 'tcd'>('sheet');
  const [active, setActive] = useState(subject.questions[0].id);
  const [focus, setFocus] = useState<{ row: number; col: number; n: number } | undefined>();
  const times = useRef<Record<string, number>>({});
  const start = useRef(Date.now());
  const [now, setNow] = useState(Date.now());
  const finished = useRef(false);
  const elapsed = (now - start.current) / 1000;
  const remaining = Math.max(0, minutes * 60 - elapsed);
  const activeRef = useRef(active);
  activeRef.current = active;

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onDone(gradeExam(subject, model, spec, answer), { ...times.current }, Math.round((Date.now() - start.current) / 1000));
  }, [subject, model, spec, answer, onDone]);

  useEffect(() => {
    const t = setInterval(() => {
      times.current[activeRef.current] = (times.current[activeRef.current] ?? 0) + 1;
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (remaining <= 0) finish();
  }, [remaining, finish]);

  const onSelect = useCallback(
    (r: Range) => {
      const a = rangeLabel(r);
      const q = subject.questions.find((x) => x.cell === a);
      if (q) setActive(q.id);
    },
    [subject],
  );

  const choose = (id: string) => {
    setActive(id);
    const q = subject.questions.find((x) => x.id === id)!;
    if (q.pivot) setTab('tcd');
    else {
      setTab('sheet');
      const p = parseAddr(q.cell!);
      setFocus({ ...p, n: Date.now() });
    }
  };

  return (
    <div className="exam" data-testid="exam-running">
      <div className="exam-head">
        <div>
          <strong>{subject.title}</strong> · <span className="muted">{subject.company}</span>
        </div>
        <div className={`timer ${remaining < 120 ? 'low' : ''}`} data-testid="timer">
          ⏱ {mmss(remaining)}
        </div>
        <button className="btn primary" data-testid="exam-finish" onClick={finish}>
          Terminer le test
        </button>
      </div>
      <p className="muted">{subject.context} Pas d’indice : comme en vrai. Réponds avec des formules dans la colonne K (sauf la question de TCD).</p>
      <div className="exam-body">
        <ol className="exam-questions">
          {subject.questions.map((q, i) => (
            <li key={q.id} className={q.id === active ? 'on' : ''} onClick={() => choose(q.id)} data-testid={`exam-q-${i + 1}`}>
              <span className="qnum">Q{i + 1}</span>
              <span>
                <Rich text={q.text} lang={lang} /> <span className="muted small">{q.cell ? `→ ${q.cell}` : '→ onglet TCD'}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="exam-main">
          <nav className="tabs">
            <a className={tab === 'sheet' ? 'on' : ''} onClick={() => setTab('sheet')} href={undefined}>
              Feuille
            </a>
            <a
              className={tab === 'tcd' ? 'on' : ''}
              onClick={() => {
                setTab('tcd');
                setActive(subject.questions.find((q) => q.pivot)!.id);
              }}
              data-testid="exam-tab-tcd"
            >
              TCD
            </a>
          </nav>
          <div style={{ display: tab === 'sheet' ? 'block' : 'none' }}>
            <Grid model={model} rows={setup.rows} cols={setup.cols} colWidths={setup.colWidths} height={460} onSelect={onSelect} focusCell={focus} targets={subject.questions.filter((q) => q.cell).map((q) => q.cell!)} />
          </div>
          {tab === 'tcd' && (
            <div>
              <PivotSimulator ds={ds} spec={spec} onChange={setSpec} lang={lang} />
              <label className="question">
                <Rich text={subject.questions.find((q) => q.pivot)!.text} lang={lang} />
                <input value={answer} onChange={(e) => setAnswer(e.target.value)} data-testid="exam-pivot-answer" />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Results({ subject, results, times, seconds, onBack }: { subject: ExamSubject; results: QuestionResult[]; times: Record<string, number>; seconds: number; onBack: () => void }) {
  const lang = useStore().progress.lang;
  const score = results.filter((r) => r.ok).length;
  return (
    <div data-testid="exam-results">
      <h1>
        Résultat : {score} / {results.length}
      </h1>
      <p>
        Sujet « {subject.title} » · temps passé : <strong>{mmss(seconds)}</strong>.{' '}
        {score / results.length >= 0.8 ? 'Excellent, tu es prêt pour ce type de test.' : score / results.length >= 0.5 ? 'Pas mal ! Revois les questions ratées ci-dessous.' : 'Courage : refais les modules des notions ratées, puis retente un sujet.'}
      </p>
      <table className="results">
        <thead>
          <tr>
            <th>Question</th>
            <th>Ta réponse</th>
            <th>Attendu</th>
            <th>Temps</th>
            <th>Correction</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r, i) => {
            const q = subject.questions[i];
            return (
              <tr key={r.id} className={r.ok ? 'ok' : 'ko'}>
                <td>
                  <strong>
                    {r.ok ? '✓' : '✗'} Q{i + 1}
                  </strong>{' '}
                  <span className="muted small">{q.topic}</span>
                  <div className="small">
                    <Rich text={q.text} lang={lang} />
                  </div>
                </td>
                <td>
                  {r.got}
                  {r.formula && <div className="small mono">{r.formula}</div>}
                </td>
                <td>{r.expected}</td>
                <td>{mmss(times[r.id] ?? 0)}</td>
                <td className="small">
                  {q.solution && (
                    <div>
                      Une solution : <code>{translateFormula(q.solution, 'en', lang)}</code>
                    </div>
                  )}
                  {r.message && <Rich text={r.message} lang={lang} />}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <button className="btn primary" onClick={onBack}>
        Retour aux sujets
      </button>
    </div>
  );
}

export function ExamPage() {
  const { progress, update } = useStore();
  const [minutes, setMinutes] = useState(30);
  const [running, setRunning] = useState<ExamSubject | null>(null);
  const [done, setDone] = useState<{ subject: ExamSubject; results: QuestionResult[]; times: Record<string, number>; seconds: number } | null>(null);

  if (done) return <Results {...done} onBack={() => setDone(null)} />;
  if (running)
    return (
      <Running
        subject={running}
        minutes={minutes}
        onDone={(results, times, seconds) => {
          const score = results.filter((r) => r.ok).length;
          update((p) => ({
            ...p,
            tests: [...p.tests, { subject: running.id, date: new Date().toISOString(), score, max: results.length, seconds, perQuestion: results.map((r) => ({ id: r.id, ok: r.ok, seconds: times[r.id] ?? 0 })) }],
          }));
          setDone({ subject: running, results, times, seconds });
          setRunning(null);
        }}
      />
    );
  return (
    <div>
      <h1>Test d’entreprise</h1>
      <p>Une épreuve chronométrée dans les conditions d’un vrai test de recrutement : un jeu de données, des questions, pas d’indice. À la fin : ton score, le temps passé par question et la correction détaillée.</p>
      <div className="duration">
        Durée :{' '}
        {[20, 30].map((m) => (
          <label key={m} className={`pill ${minutes === m ? 'on' : ''}`}>
            <input type="radio" checked={minutes === m} onChange={() => setMinutes(m)} /> {m} minutes
          </label>
        ))}
      </div>
      <div className="module-grid">
        {SUBJECTS.map((s) => {
          const best = progress.tests.filter((t) => t.subject === s.id).reduce((b, t) => Math.max(b, t.score / t.max), -1);
          return (
            <div key={s.id} className="module-card">
              <span className="module-title">{s.title}</span>
              <span className="muted small">{s.company}</span>
              <span className="small">
                {s.questions.length} questions · {s.dataset().rows.length} lignes
              </span>
              {best >= 0 && <span className="score">Meilleur score : {Math.round(best * 100)} %</span>}
              <button className="btn primary" data-testid={`exam-start-${s.id}`} onClick={() => setRunning(s)}>
                Commencer
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
