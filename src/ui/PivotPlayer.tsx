import { DragEvent, useMemo, useState } from 'react';
import { Dataset, layout } from '../data/datasets';
import { Lang } from '../engine/lang';
import { modelFromSetup } from '../exercises/checker';
import { Agg, ExcelTask, PivotExercise, PivotSpec } from '../exercises/types';
import { Grid } from '../grid/Grid';
import { checkPivot } from '../pivot/check';
import { AGG_LABEL, computePivot, PivotResult } from '../pivot/pivot';
import { buildXlsx, download } from '../pivot/xlsx';
import { HintsBox, PlayerProps, ResultBox, useExerciseState } from './ExercisePlayer';
import { Rich } from './Rich';

type Zone = 'filters' | 'cols' | 'rows' | 'values';
const ZONES: [Zone, string][] = [
  ['filters', 'Filtres'],
  ['cols', 'Colonnes'],
  ['rows', 'Lignes'],
  ['values', 'Valeurs'],
];
export const emptySpec = (): PivotSpec => ({ rows: [], cols: [], values: [], filters: [] });

const fmtNum = (n: number | null, lang: Lang) =>
  n === null ? '' : new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { maximumFractionDigits: 2 }).format(n);

export function PivotTableView({ result, spec, lang }: { result: PivotResult; spec: PivotSpec; lang: Lang }) {
  if (!spec.values.length && !spec.rows.length) return <p className="muted">Glisse des champs dans les zones pour construire ton tableau.</p>;
  const nv = Math.max(result.valueLabels.length, 1);
  const rowHead = spec.rows.length ? spec.rows.join(' / ') : '';
  return (
    <div className="pivot-scroll">
      <table className="pivot" data-testid="pivot-table">
        <thead>
          {result.hasColTotal && (
            <tr>
              <th />
              {result.colKeys.map((k, i) => (
                <th key={i} colSpan={nv} className="colkey">
                  {k.join(' / ')}
                </th>
              ))}
              <th colSpan={nv} className="colkey">
                Total général
              </th>
            </tr>
          )}
          <tr>
            <th>{rowHead || ' '}</th>
            {[...result.colKeys, ['*']].flatMap((_, i) =>
              result.valueLabels.map((l, j) => (
                <th key={`${i}-${j}`} className="num">
                  {l}
                </th>
              )),
            )}
          </tr>
        </thead>
        <tbody>
          {result.body.map((line, i) => {
            const total = i === result.body.length - 1;
            return (
              <tr key={i} className={total ? 'total' : ''}>
                <td>{total ? 'Total général' : result.rowKeys[i].join(' / ')}</td>
                {line.map((v, j) => (
                  <td key={j} className="num">
                    {fmtNum(v, lang)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Le simulateur : liste des champs + 4 zones, comme le volet « Champs de tableau croisé dynamique » d'Excel. */
export function PivotSimulator({ ds, spec, onChange, lang }: { ds: Dataset; spec: PivotSpec; onChange: (s: PivotSpec) => void; lang: Lang }) {
  const fields = ds.columns.map((c) => c.name);
  const numeric = (f: string) => {
    const i = fields.indexOf(f);
    return ds.rows.some((r) => typeof r[i] === 'number');
  };
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const place = (field: string, zone: Zone) => {
    const s: PivotSpec = {
      rows: spec.rows.filter((f) => f !== field),
      cols: spec.cols.filter((f) => f !== field),
      filters: spec.filters.filter((f) => f.field !== field),
      values: spec.values,
    };
    if (zone === 'values') {
      if (!s.values.some((v) => v.field === field)) s.values = [...s.values, { field, agg: numeric(field) ? 'sum' : 'count' }];
      // dans Excel, un champ peut être à la fois en Lignes et en Valeurs
      s.rows = spec.rows;
      s.cols = spec.cols;
      s.filters = spec.filters;
    } else if (zone === 'filters') {
      const i = fields.indexOf(field);
      s.filters = [...s.filters, { field, values: [...new Set(ds.rows.map((r) => String(r[i])))] }];
    } else s[zone] = [...s[zone], field];
    onChange(s);
  };
  const remove = (field: string, zone: Zone) => {
    if (zone === 'values') onChange({ ...spec, values: spec.values.filter((v) => v.field !== field) });
    else if (zone === 'filters') onChange({ ...spec, filters: spec.filters.filter((f) => f.field !== field) });
    else onChange({ ...spec, [zone]: spec[zone].filter((f) => f !== field) });
  };
  const onDrop = (zone: Zone) => (e: DragEvent) => {
    e.preventDefault();
    const field = e.dataTransfer.getData('text/plain');
    if (field) place(field, zone);
  };
  const inUse = (f: string) => spec.rows.includes(f) || spec.cols.includes(f) || spec.values.some((v) => v.field === f) || spec.filters.some((x) => x.field === f);

  const zoneItems = (z: Zone): string[] => (z === 'values' ? spec.values.map((v) => v.field) : z === 'filters' ? spec.filters.map((f) => f.field) : spec[z]);
  const result = useMemo(() => computePivot(ds, spec), [ds, spec]);

  return (
    <div className="pivot-sim">
      <div className="pivot-panel">
        <div className="panel-title">Champs de tableau croisé dynamique</div>
        <div className="field-list">
          {fields.map((f) => (
            <div key={f} className={`field ${inUse(f) ? 'used' : ''}`} draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', f)} data-testid={`field-${f}`}>
              <span className="field-name">⠿ {f}</span>
              <span className="field-btns">
                {ZONES.map(([z, label]) => (
                  <button key={z} title={`Mettre dans ${label}`} onClick={() => place(f, z)} data-testid={`put-${f}-${z}`}>
                    {label[0]}
                  </button>
                ))}
              </span>
            </div>
          ))}
        </div>
        <p className="muted small">Glisse un champ dans une zone (ou clique sur F, C, L, V).</p>
        <div className="zones">
          {ZONES.map(([z, label]) => (
            <div key={z} className="zone" onDragOver={(e) => e.preventDefault()} onDrop={onDrop(z)} data-testid={`zone-${z}`}>
              <div className="zone-title">{label}</div>
              {zoneItems(z).map((f) => (
                <div key={f} className="zone-item">
                  {z === 'values' ? (
                    <select
                      value={spec.values.find((v) => v.field === f)!.agg}
                      onChange={(e) => onChange({ ...spec, values: spec.values.map((v) => (v.field === f ? { ...v, agg: e.target.value as Agg } : v)) })}
                      data-testid={`agg-${f}`}
                    >
                      {(Object.keys(AGG_LABEL) as Agg[]).map((a) => (
                        <option key={a} value={a}>
                          {AGG_LABEL[a]} de {f}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span>{f}</span>
                  )}
                  {z === 'filters' && (
                    <button className="mini-btn" onClick={() => setOpenFilter(openFilter === f ? null : f)} data-testid={`filter-open-${f}`}>
                      ▾
                    </button>
                  )}
                  <button className="mini-btn" onClick={() => remove(f, z)} aria-label="Retirer">
                    ✕
                  </button>
                  {z === 'filters' && openFilter === f && (
                    <div className="filter-pop">
                      {[...new Set(ds.rows.map((r) => String(r[fields.indexOf(f)])))].sort((a, b) => a.localeCompare(b, 'fr')).map((v) => {
                        const cur = spec.filters.find((x) => x.field === f)!;
                        return (
                          <label key={v}>
                            <input
                              type="checkbox"
                              checked={cur.values.includes(v)}
                              onChange={(e) =>
                                onChange({ ...spec, filters: spec.filters.map((x) => (x.field === f ? { ...x, values: e.target.checked ? [...x.values, v] : x.values.filter((y) => y !== v) } : x)) })
                              }
                              data-testid={`filter-${f}-${v}`}
                            />{' '}
                            {v}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="pivot-out">
        {spec.filters.length > 0 && (
          <div className="pivot-filters">
            {spec.filters.map((f) => (
              <span key={f.field}>
                {f.field} : <strong>{f.values.length === 1 ? f.values[0] : `(${f.values.length} valeurs)`}</strong>
              </span>
            ))}
          </div>
        )}
        <PivotTableView result={result} spec={spec} lang={lang} />
      </div>
    </div>
  );
}

export function ExcelTaskPanel({ task, lang, extra }: { task: ExcelTask; lang: Lang; extra?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <div className="excel-task">
      <button className="btn" data-testid="excel-btn" onClick={() => setOpen(!open)}>
        📗 Faire dans Excel
      </button>
      {open && (
        <div className="card excel-panel" data-testid="excel-panel">
          <p>
            Un simulateur ne remplace pas le vrai Excel. Télécharge le fichier, ouvre-le dans Excel pour Mac et suis les étapes.
          </p>
          <button
            className="btn primary"
            disabled={busy}
            data-testid="xlsx-download"
            onClick={async () => {
              setBusy(true);
              try {
                download(await buildXlsx([{ name: 'Données', setup: task.dataset() }]), task.fileName);
              } finally {
                setBusy(false);
              }
            }}
          >
            ⬇ Télécharger {task.fileName}
          </button>
          <ol className="excel-steps">
            {task.steps.map((s, i) => (
              <li key={i}>
                <Rich text={s} lang={lang} />
              </li>
            ))}
          </ol>
          <div className="expected">
            <strong>Réponse attendue à vérifier :</strong> <Rich text={task.expected} lang={lang} />
            {extra}
          </div>
        </div>
      )}
    </div>
  );
}

export function datasetPreview(ds: Dataset) {
  return layout(ds);
}

export function PivotPlayer(props: PlayerProps) {
  const ex = props.ex as PivotExercise;
  const { allowHints = true } = props;
  const st = useExerciseState(ex, props);
  const { lang } = st;
  const ds = useMemo(() => ex.dataset(), [ex]);
  const [spec, setSpec] = useState<PivotSpec>(emptySpec);
  const [answer, setAnswer] = useState('');
  const [showData, setShowData] = useState(false);
  const setup = useMemo(() => layout(ds), [ds]);
  const model = useMemo(() => (showData ? modelFromSetup(setup, lang) : null), [setup, lang, showData]);
  const goalResult = useMemo(() => computePivot(ds, ex.goal), [ds, ex.goal]);
  return (
    <div className="exercise" data-testid={`exercise-${ex.id}`}>
      <div className="instruction">
        <Rich text={ex.instruction} lang={lang} />
      </div>
      <button className="btn ghost small" onClick={() => setShowData(!showData)}>
        {showData ? 'Masquer' : 'Voir'} les données ({ds.rows.length} lignes)
      </button>
      {model && <Grid model={model} rows={setup.rows} cols={setup.cols} colWidths={setup.colWidths} height={220} readOnly />}
      <PivotSimulator ds={ds} spec={spec} onChange={setSpec} lang={lang} />
      {ex.question && (
        <label className="question">
          <Rich text={ex.question.text} lang={lang} />{' '}
          <input value={answer} onChange={(e) => setAnswer(e.target.value)} data-testid="pivot-answer" />
        </label>
      )}
      <div className="ex-actions">
        <button className="btn primary" data-testid="check-btn" onClick={() => st.submit(checkPivot(ex, spec, answer))}>
          Vérifier
        </button>
        <button className="btn ghost" onClick={() => setSpec(emptySpec())}>
          Réinitialiser
        </button>
      </div>
      <ExcelTaskPanel task={ex.excel} lang={lang} extra={<PivotTableView result={goalResult} spec={ex.goal} lang={lang} />} />
      <ResultBox result={st.result} lang={lang} />
      {allowHints && !st.solved && <HintsBox ex={ex} hints={st.hints} setHints={st.setHints} lang={lang} />}
    </div>
  );
}
