import { useCallback, useEffect, useMemo, useState } from 'react';
import { CellInfo } from '../engine/engine';
import { addr } from '../engine/formula';
import { CheckResult, checkFormula, checkSelect, expandTarget, expectedValues, modelFromSetup } from '../exercises/checker';
import { hintsOf } from '../exercises/hints';
import { Exercise, FormulaExercise, SelectExercise } from '../exercises/types';
import { Grid, Range, rangeLabel } from '../grid/Grid';
import { recordFailure, recordSuccess } from '../state/progress';
import { useStore } from '../state/store';
import { Rich } from './Rich';
import { extraPlayers } from './players';

export interface PlayerProps {
  ex: Exercise;
  /** false en mini-test / test d'entreprise : pas d'indice */
  allowHints?: boolean;
  /** Appelé à la réussite (nombre d'indices utilisés) */
  onSolved?: (hints: number) => void;
  /** Enregistrer dans la progression (true par défaut) */
  record?: boolean;
}

export function ExercisePlayer(props: PlayerProps) {
  const { ex } = props;
  if (ex.kind === 'formula' || ex.kind === 'select') return <GridExercise key={ex.id} {...props} ex={ex} />;
  const P = extraPlayers[ex.kind];
  return P ? <P key={ex.id} {...props} /> : <p>Type d’exercice inconnu.</p>;
}

/** Logique commune : indices, enregistrement, affichage du résultat. */
export function useExerciseState(ex: Exercise, props: PlayerProps) {
  const { progress, update } = useStore();
  const lang = progress.lang;
  const [hints, setHints] = useState(0);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [solved, setSolved] = useState(false);
  const record = props.record !== false;
  const submit = useCallback(
    (r: CheckResult) => {
      setResult(r);
      if (r.ok && !solved) {
        setSolved(true);
        if (record) update((p) => recordSuccess(p, ex.id, ex.notions, hints));
        props.onSolved?.(hints);
      } else if (!r.ok && record) update((p) => recordFailure(p, ex.id, ex.notions));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ex.id, hints, solved, record],
  );
  return { lang, hints, setHints, result, setResult, solved, submit };
}

export function HintsBox({ ex, hints, setHints, lang, disabled }: { ex: Exercise; hints: number; setHints: (n: number) => void; lang: 'fr' | 'en'; disabled?: boolean }) {
  const all = hintsOf(ex);
  const labels = ['Quelle fonction ?', 'La structure', 'La réponse'];
  return (
    <div className="hints">
      {all.slice(0, hints).map((h, i) => (
        <div key={i} className="hint" data-testid={`hint-${i + 1}`}>
          <span className="hint-label">Indice {i + 1} · {labels[i]}</span>
          <Rich text={h} lang={lang} />
        </div>
      ))}
      {hints < 3 && !disabled && (
        <button className="btn ghost" data-testid="hint-btn" onClick={() => setHints(hints + 1)}>
          💡 Indice {hints + 1}/3 {hints === 0 ? '(un exercice réussi sans indice rapporte plus)' : ''}
        </button>
      )}
    </div>
  );
}

export function ResultBox({ result, lang, after }: { result: CheckResult | null; lang: 'fr' | 'en'; after?: string }) {
  if (!result) return null;
  return result.ok ? (
    <div className="result ok" data-testid="result-ok">
      <strong>Bravo, c’est juste !</strong>
      {after && <Rich as="p" text={after} lang={lang} />}
    </div>
  ) : (
    <div className="result ko" data-testid="result-ko">
      <strong>Pas encore.</strong>
      {result.messages.map((m, i) => (
        <Rich key={i} as="p" text={m} lang={lang} />
      ))}
    </div>
  );
}

function GridExercise(props: PlayerProps & { ex: FormulaExercise | SelectExercise }) {
  const { ex, allowHints = true } = props;
  const st = useExerciseState(ex, props);
  const { lang } = st;
  const [resetKey, setResetKey] = useState(0);
  const setup = useMemo(() => {
    const s = ex.setup();
    if (ex.kind === 'formula') for (const t of ex.targets) if (t.fmt) for (const a of expandTarget(t)) s.fmts[a] = t.fmt;
    return s;
  }, [ex]);
  const model = useMemo(() => modelFromSetup(setup, lang), [setup, resetKey]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => model.setLang(lang), [model, lang]);
  const expected = useMemo(() => (ex.kind === 'formula' ? expectedValues(ex) : null), [ex]);
  const [selection, setSelection] = useState('A1');
  const [, setTick] = useState(0);
  const onSelect = useCallback((r: Range) => setSelection(rangeLabel(r)), []);

  const targets = ex.kind === 'formula' ? ex.targets.map((t) => t.cell) : [];

  const check = () => {
    if (ex.kind === 'formula') st.submit(checkFormula(ex, model, expected!));
    else st.submit(checkSelect(ex, selection));
  };

  const cellStyle = useCallback(
    (row: number, col: number, _info: CellInfo) => {
      const r = st.result;
      if (!r || ex.kind !== 'formula') return undefined;
      const a = addr(row, col);
      if (!(a in r.cells)) return undefined;
      return { background: r.cells[a] ? '#e3f4e8' : '#fde7e4' };
    },
    [st.result, ex.kind],
  );

  return (
    <div className="exercise" data-testid={`exercise-${ex.id}`}>
      <div className="instruction">
        <Rich text={ex.instruction} lang={lang} />
      </div>
      <Grid
        key={resetKey}
        model={model}
        rows={setup.rows}
        cols={setup.cols}
        colWidths={setup.colWidths}
        targets={targets}
        onSelect={onSelect}
        onChange={() => setTick((t) => t + 1)}
        cellStyle={cellStyle}
        height={360}
      />
      <div className="ex-actions">
        <button className="btn primary" data-testid="check-btn" onClick={check}>
          Vérifier
        </button>
        <button
          className="btn ghost"
          onClick={() => {
            setResetKey((k) => k + 1);
            st.setResult(null);
          }}
        >
          Réinitialiser
        </button>
        {ex.kind === 'select' && <span className="muted">Sélection actuelle : <code>{selection}</code></span>}
      </div>
      <ResultBox result={st.result} lang={lang} after={ex.kind === 'formula' ? ex.after : undefined} />
      {allowHints && !st.solved && <HintsBox ex={ex} hints={st.hints} setHints={st.setHints} lang={lang} />}
    </div>
  );
}
