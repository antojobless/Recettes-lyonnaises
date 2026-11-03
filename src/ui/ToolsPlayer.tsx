import { useCallback, useMemo, useState } from 'react';
import { CellInfo } from '../engine/engine';
import { modelFromSetup } from '../exercises/checker';
import { cfMatches, checkTools, dataRows, hiddenRowsFor, inRange, sortModel } from '../exercises/tools';
import { CfOp, CfRule, FilterSpec, ToolsExercise } from '../exercises/types';
import { Grid, Range, rangeLabel } from '../grid/Grid';
import { HintsBox, PlayerProps, ResultBox, useExerciseState } from './ExercisePlayer';
import { Rich } from './Rich';

export const CF_COLORS: Record<CfRule['color'], { bg: string; fg: string; label: string }> = {
  red: { bg: '#ffc7ce', fg: '#9c0006', label: 'Rouge clair' },
  green: { bg: '#c6efce', fg: '#006100', label: 'Vert' },
  yellow: { bg: '#ffeb9c', fg: '#9c5700', label: 'Jaune' },
};
const OPS: [CfOp, string][] = [
  ['>', 'Supérieur à'],
  ['<', 'Inférieur à'],
  ['>=', 'Supérieur ou égal à'],
  ['<=', 'Inférieur ou égal à'],
  ['=', 'Égal à'],
  ['contains', 'Texte qui contient'],
];

export function ToolsPlayer(props: PlayerProps) {
  const ex = props.ex as ToolsExercise;
  const { allowHints = true } = props;
  const st = useExerciseState(ex, props);
  const { lang } = st;
  const [resetKey, setResetKey] = useState(0);
  const setup = useMemo(() => ex.setup(), [ex]);
  const model = useMemo(() => modelFromSetup(setup, lang), [setup, lang, resetKey]);
  const [, setTick] = useState(0);
  const [filter, setFilter] = useState<FilterSpec | null>(null);
  const [rules, setRules] = useState<CfRule[]>([]);
  const [sel, setSel] = useState('A1');
  const onSelect = useCallback((r: Range) => setSel(rangeLabel(r)), []);

  const headers = useMemo(() => {
    const h: string[] = [];
    for (let c = 0; c < setup.cols; c++) {
      const v = model.getRaw(0, c);
      if (!v) break;
      h.push(v);
    }
    return h;
  }, [model, setup.cols]);

  // --- trier ---
  const [sCol, setSCol] = useState(0);
  const [sDir, setSDir] = useState<'asc' | 'desc'>('asc');
  // --- filtrer ---
  const [fCol, setFCol] = useState(0);
  const [fVals, setFVals] = useState<string[]>([]);
  const [fOp, setFOp] = useState<'>' | '<' | '>=' | '<='>('>');
  const [fNum, setFNum] = useState('');
  const distinct = useMemo(() => {
    const s = new Set<string>();
    for (let r = 1; r <= dataRows(model); r++) s.add(model.info(r, fCol).display);
    return [...s].sort((a, b) => a.localeCompare(b, 'fr'));
  }, [model, fCol]);
  const numeric = useMemo(() => typeof model.value(1, fCol) === 'number', [model, fCol]);
  // --- MFC ---
  const [cRange, setCRange] = useState('');
  const [cOp, setCOp] = useState<CfOp>('>');
  const [cVal, setCVal] = useState('');
  const [cColor, setCColor] = useState<CfRule['color']>('red');

  const hidden = useMemo(() => hiddenRowsFor(model, filter), [model, filter]);
  const cellStyle = useCallback(
    (row: number, col: number, info: CellInfo) => {
      for (let i = rules.length - 1; i >= 0; i--) {
        const r = rules[i];
        if (inRange(r.range, row, col) && cfMatches(r, info.value, info.display)) return { background: CF_COLORS[r.color].bg, color: CF_COLORS[r.color].fg };
      }
      return undefined;
    },
    [rules],
  );

  const reset = () => {
    setResetKey((k) => k + 1);
    setFilter(null);
    setRules([]);
    st.setResult(null);
  };

  return (
    <div className="exercise" data-testid={`exercise-${ex.id}`}>
      <div className="instruction">
        <Rich text={ex.instruction} lang={lang} />
      </div>
      <div className="ribbon">
        <div className="tool">
          <span className="tool-title">Données › Trier</span>
          <label>
            Colonne{' '}
            <select value={sCol} onChange={(e) => setSCol(Number(e.target.value))} data-testid="sort-col">
              {headers.map((h, i) => (
                <option key={i} value={i}>
                  {h}
                </option>
              ))}
            </select>
          </label>
          <label>
            Ordre{' '}
            <select value={sDir} onChange={(e) => setSDir(e.target.value as 'asc')} data-testid="sort-dir">
              <option value="asc">Croissant (A → Z, 1 → 9, ancien → récent)</option>
              <option value="desc">Décroissant (Z → A, 9 → 1, récent → ancien)</option>
            </select>
          </label>
          <button
            className="btn small"
            data-testid="sort-btn"
            onClick={() => {
              sortModel(model, { col: sCol, dir: sDir }, headers.length);
              setTick((t) => t + 1);
            }}
          >
            Trier
          </button>
        </div>
        <div className="tool">
          <span className="tool-title">Données › Filtrer</span>
          <label>
            Colonne{' '}
            <select
              value={fCol}
              onChange={(e) => {
                setFCol(Number(e.target.value));
                setFVals([]);
              }}
              data-testid="filter-col"
            >
              {headers.map((h, i) => (
                <option key={i} value={i}>
                  {h}
                </option>
              ))}
            </select>
          </label>
          {numeric ? (
            <span className="inline">
              <select value={fOp} onChange={(e) => setFOp(e.target.value as '>')} data-testid="filter-op">
                <option value=">">est supérieur à</option>
                <option value=">=">est supérieur ou égal à</option>
                <option value="<">est inférieur à</option>
                <option value="<=">est inférieur ou égal à</option>
              </select>
              <input className="num-input" value={fNum} onChange={(e) => setFNum(e.target.value)} placeholder="valeur" data-testid="filter-num" />
            </span>
          ) : (
            <div className="checks" data-testid="filter-values">
              {distinct.slice(0, 40).map((v) => (
                <label key={v}>
                  <input type="checkbox" checked={fVals.includes(v)} onChange={(e) => setFVals(e.target.checked ? [...fVals, v] : fVals.filter((x) => x !== v))} /> {v || '(vides)'}
                </label>
              ))}
            </div>
          )}
          <span className="inline">
            <button
              className="btn small"
              data-testid="filter-btn"
              onClick={() => setFilter(numeric ? { col: fCol, op: fOp, num: Number(fNum.replace(',', '.').replace(/\s/g, '')) } : { col: fCol, values: fVals })}
            >
              Filtrer
            </button>
            <button className="btn small ghost" onClick={() => setFilter(null)}>
              Effacer le filtre
            </button>
          </span>
          {filter && <span className="muted small">{dataRows(model) - hidden.size} ligne(s) affichée(s) sur {dataRows(model)}</span>}
        </div>
        <div className="tool">
          <span className="tool-title">Accueil › Mise en forme conditionnelle</span>
          <label>
            Plage{' '}
            <input className="range-input" value={cRange} placeholder={sel} onChange={(e) => setCRange(e.target.value)} data-testid="cf-range" />
            <button className="btn small ghost" onClick={() => setCRange(sel)} title="Utiliser la sélection de la grille">
              = sélection
            </button>
          </label>
          <span className="inline">
            <select value={cOp} onChange={(e) => setCOp(e.target.value as CfOp)} data-testid="cf-op">
              {OPS.map(([o, l]) => (
                <option key={o} value={o}>
                  {l}
                </option>
              ))}
            </select>
            <input className="num-input" value={cVal} onChange={(e) => setCVal(e.target.value)} placeholder="valeur" data-testid="cf-value" />
            <select value={cColor} onChange={(e) => setCColor(e.target.value as 'red')} data-testid="cf-color">
              {Object.entries(CF_COLORS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </span>
          <button className="btn small" data-testid="cf-btn" onClick={() => setRules([...rules, { range: cRange || sel, op: cOp, value: cVal, color: cColor }])}>
            Appliquer la règle
          </button>
          {rules.map((r, i) => (
            <span key={i} className="rule-chip" style={{ background: CF_COLORS[r.color].bg, color: CF_COLORS[r.color].fg }}>
              {r.range} · {OPS.find((o) => o[0] === r.op)?.[1]} {r.value}
              <button onClick={() => setRules(rules.filter((_, k) => k !== i))} aria-label="Supprimer la règle">
                ✕
              </button>
            </span>
          ))}
        </div>
      </div>
      <Grid
        key={resetKey}
        model={model}
        rows={setup.rows}
        cols={setup.cols}
        colWidths={setup.colWidths}
        hiddenRows={hidden}
        cellStyle={cellStyle}
        onSelect={onSelect}
        onChange={() => setTick((t) => t + 1)}
        height={340}
      />
      <div className="ex-actions">
        <button className="btn primary" data-testid="check-btn" onClick={() => st.submit(checkTools(ex, { model, filter, rules }))}>
          Vérifier
        </button>
        <button className="btn ghost" onClick={reset}>
          Réinitialiser
        </button>
      </div>
      <ResultBox result={st.result} lang={lang} />
      {allowHints && !st.solved && <HintsBox ex={ex} hints={st.hints} setHints={st.setHints} lang={lang} />}
    </div>
  );
}
