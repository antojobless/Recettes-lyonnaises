import { SheetModel } from '../engine/engine';
import { isErrorValue } from '../engine/format';
import { parseAddr } from '../engine/formula';
import { CheckResult } from './checker';
import { CfRule, FilterSpec, SortSpec, ToolsExercise } from './types';

/** Dernière ligne de données (0-based) d'un tableau qui commence en ligne 1. */
export function dataRows(m: SheetModel): number {
  return m.extent().rows - 1;
}

const sortKey = (v: unknown): [number, number | string] => {
  if (v === null || v === undefined || v === '') return [2, 0];
  if (typeof v === 'number') return [0, v];
  if (isErrorValue(v)) return [3, 0];
  return [1, String(v).toLocaleLowerCase('fr')];
};

export function compareValues(a: unknown, b: unknown): number {
  const ka = sortKey(a);
  const kb = sortKey(b);
  if (ka[0] !== kb[0]) return ka[0] - kb[0];
  if (typeof ka[1] === 'number' && typeof kb[1] === 'number') return ka[1] - kb[1];
  return String(ka[1]).localeCompare(String(kb[1]), 'fr');
}

/** Trie physiquement les lignes de données (ligne 1 = titres), comme Excel. */
export function sortModel(m: SheetModel, spec: SortSpec, ncols: number) {
  const last = dataRows(m);
  const rows: { raw: string[]; key: unknown }[] = [];
  for (let r = 1; r <= last; r++) {
    const raw: string[] = [];
    for (let c = 0; c < ncols; c++) raw.push(m.getRaw(r, c));
    rows.push({ raw, key: m.value(r, spec.col) });
  }
  rows.sort((a, b) => (spec.dir === 'asc' ? 1 : -1) * compareValues(a.key, b.key));
  const cells = [];
  for (let i = 0; i < rows.length; i++) for (let c = 0; c < ncols; c++) cells.push({ row: i + 1, col: c, raw: rows[i].raw[c] });
  m.setMany(cells);
}

export function isSorted(m: SheetModel, spec: SortSpec): boolean {
  const last = dataRows(m);
  for (let r = 2; r <= last; r++) {
    const c = compareValues(m.value(r - 1, spec.col), m.value(r, spec.col));
    if (spec.dir === 'asc' ? c > 0 : c < 0) return false;
  }
  return true;
}

export function rowMatches(m: SheetModel, row: number, f: FilterSpec): boolean {
  if (f.values) return f.values.includes(m.info(row, f.col).display);
  const v = m.value(row, f.col);
  if (typeof v !== 'number' || f.num === undefined) return false;
  switch (f.op) {
    case '>':
      return v > f.num;
    case '<':
      return v < f.num;
    case '>=':
      return v >= f.num;
    case '<=':
      return v <= f.num;
  }
  return true;
}

export function hiddenRowsFor(m: SheetModel, f: FilterSpec | null): Set<number> {
  const s = new Set<number>();
  if (!f) return s;
  const last = dataRows(m);
  for (let r = 1; r <= last; r++) if (!rowMatches(m, r, f)) s.add(r);
  return s;
}

export function cfMatches(rule: CfRule, value: unknown, display: string): boolean {
  if (rule.op === 'contains') return display.toLocaleLowerCase('fr').includes(rule.value.toLocaleLowerCase('fr')) && rule.value !== '';
  const n = Number(rule.value.replace(',', '.').replace(/\s/g, ''));
  if (typeof value !== 'number' || Number.isNaN(n)) return rule.op === '=' && display === rule.value;
  switch (rule.op) {
    case '>':
      return value > n;
    case '<':
      return value < n;
    case '>=':
      return value >= n;
    case '<=':
      return value <= n;
    case '=':
      return value === n;
  }
  return false;
}

export function inRange(range: string, row: number, col: number): boolean {
  const [a, b] = range.toUpperCase().replace(/\$/g, '').split(':');
  try {
    const p = parseAddr(a);
    const q = parseAddr(b ?? a);
    return row >= Math.min(p.row, q.row) && row <= Math.max(p.row, q.row) && col >= Math.min(p.col, q.col) && col <= Math.max(p.col, q.col);
  } catch {
    return false;
  }
}

const normRange = (r: string) => r.toUpperCase().replace(/[\s$]/g, '');
const sameNum = (a: string, b: string) => {
  const x = Number(a.replace(',', '.').replace(/\s/g, ''));
  const y = Number(b.replace(',', '.').replace(/\s/g, ''));
  return Number.isNaN(x) || Number.isNaN(y) ? a.trim().toLowerCase() === b.trim().toLowerCase() : x === y;
};

export interface ToolsState {
  model: SheetModel;
  filter: FilterSpec | null;
  rules: CfRule[];
}

/** Correction d'un exercice de tri / filtre / mise en forme conditionnelle. */
export function checkTools(ex: ToolsExercise, st: ToolsState): CheckResult {
  const msg = (when: ToolsExercise['mistakes'][number]['when'], fallback: string) => ex.mistakes.find((m) => m.when === when)?.message ?? fallback;
  const ko = (m: string): CheckResult => ({ ok: false, messages: [m], cells: {} });
  const ok: CheckResult = { ok: true, messages: [], cells: {} };
  const g = ex.goal;
  if (g.type === 'sort') {
    if (isSorted(st.model, g.sort)) return ok;
    if (isSorted(st.model, { ...g.sort, dir: g.sort.dir === 'asc' ? 'desc' : 'asc' })) return ko(msg('wrong-dir', 'Le tri est dans le mauvais sens (croissant / décroissant).'));
    return ko(msg('wrong-col', 'Le tableau n’est pas trié sur la bonne colonne.'));
  }
  if (g.type === 'filter') {
    const f = st.filter;
    if (!f) return ko('Aucun filtre n’est appliqué : choisis une colonne et ce que tu gardes, puis clique sur « Filtrer ».');
    if (f.col !== g.filter.col) return ko(msg('wrong-col', 'Le filtre n’est pas sur la bonne colonne.'));
    const want = hiddenRowsFor(st.model, g.filter);
    const got = hiddenRowsFor(st.model, f);
    if (want.size === got.size && [...want].every((r) => got.has(r))) return ok;
    return ko(msg('wrong-value', 'Le filtre ne garde pas les bonnes lignes : vérifie les valeurs cochées ou la condition.'));
  }
  const want = g.rule;
  const exact = st.rules.find((r) => normRange(r.range) === normRange(want.range) && r.op === want.op && sameNum(r.value, want.value) && r.color === want.color);
  if (exact) return ok;
  if (!st.rules.length) return ko('Aucune règle de mise en forme n’a été créée.');
  const r = st.rules[st.rules.length - 1];
  if (normRange(r.range) !== normRange(want.range)) return ko(msg('wrong-range', `Ta règle s’applique à ${r.range} : ce n’est pas la bonne plage.`));
  if (r.op !== want.op) return ko(msg('wrong-op', 'Le type de règle n’est pas le bon (supérieur à, inférieur à, contient…).'));
  if (!sameNum(r.value, want.value)) return ko(msg('wrong-value', 'La valeur de la règle n’est pas la bonne.'));
  return ko('La couleur n’est pas celle demandée.');
}
