import { Dataset, Value } from '../data/datasets';
import { Agg, PivotSpec } from '../exercises/types';

export const AGG_LABEL: Record<Agg, string> = { sum: 'Somme', count: 'Nombre', avg: 'Moyenne' };

export interface PivotResult {
  rowKeys: string[][];
  colKeys: string[][];
  valueLabels: string[];
  /** cells[rowIndex][colIndex * nValues + v] ; la dernière ligne/colonne = Total général */
  body: (number | null)[][];
  hasColTotal: boolean;
}

const keyOf = (parts: string[]) => parts.join('\u0001');
const str = (v: Value | undefined) => (v === undefined || v === '' ? '(vide)' : String(v));
const sortKeys = (a: string[], b: string[]) => {
  for (let i = 0; i < a.length; i++) {
    const na = Number(a[i]);
    const nb = Number(b[i]);
    const c = !Number.isNaN(na) && !Number.isNaN(nb) ? na - nb : a[i].localeCompare(b[i], 'fr');
    if (c) return c;
  }
  return 0;
};

/** Calcule un tableau croisé dynamique comme Excel (totaux généraux compris). */
export function computePivot(ds: Dataset, spec: PivotSpec): PivotResult {
  const idx = (name: string) => ds.columns.findIndex((c) => c.name === name);
  const rows = ds.rows.filter((r) => spec.filters.every((f) => f.values.includes(str(r[idx(f.field)]))));
  const rf = spec.rows.map(idx);
  const cf = spec.cols.map(idx);
  const vf = spec.values.map((v) => ({ i: idx(v.field), agg: v.agg }));
  const rowMap = new Map<string, string[]>();
  const colMap = new Map<string, string[]>();
  type Acc = { s: number; n: number; c: number };
  const acc = new Map<string, Acc[]>();
  const add = (rk: string, ck: string, r: Value[]) => {
    const k = `${rk}|${ck}`;
    let a = acc.get(k);
    if (!a) acc.set(k, (a = vf.map(() => ({ s: 0, n: 0, c: 0 }))));
    vf.forEach((v, j) => {
      const x = r[v.i];
      if (x !== undefined && x !== '') a![j].c++;
      if (typeof x === 'number') {
        a![j].s += x;
        a![j].n++;
      }
    });
  };
  for (const r of rows) {
    const rkParts = rf.map((i) => str(r[i]));
    const ckParts = cf.map((i) => str(r[i]));
    const rk = keyOf(rkParts);
    const ck = keyOf(ckParts);
    rowMap.set(rk, rkParts);
    colMap.set(ck, ckParts);
    add(rk, ck, r);
    add(rk, '*', r);
    add('*', ck, r);
    add('*', '*', r);
  }
  const rowKeys = [...rowMap.values()].sort(sortKeys);
  const colKeys = cf.length ? [...colMap.values()].sort(sortKeys) : [];
  const val = (a: Acc[] | undefined, j: number): number | null => {
    if (!a) return null;
    const x = a[j];
    if (vf[j].agg === 'count') return x.c;
    if (vf[j].agg === 'sum') return x.s;
    return x.n ? x.s / x.n : null;
  };
  const cks = [...colKeys.map(keyOf), '*'];
  const line = (rk: string) => cks.flatMap((ck) => vf.map((_, j) => val(acc.get(`${rk}|${ck}`), j)));
  const body = [...rowKeys.map((k) => line(keyOf(k))), line('*')];
  return {
    rowKeys,
    colKeys,
    valueLabels: spec.values.map((v) => `${AGG_LABEL[v.agg]} de ${v.field}`),
    body,
    hasColTotal: cf.length > 0,
  };
}

/** Deux TCD donnent-ils le même tableau (mêmes lignes, colonnes et nombres) ? */
export function samePivot(a: PivotResult, b: PivotResult): boolean {
  const flat = (p: PivotResult) => {
    const m = new Map<string, number | null>();
    const cks = [...p.colKeys.map(keyOf), '*'];
    const nv = p.valueLabels.length;
    [...p.rowKeys.map(keyOf), '*'].forEach((rk, i) =>
      cks.forEach((ck, j) => {
        for (let v = 0; v < nv; v++) m.set(`${rk}|${ck}|${p.valueLabels[v]}`, p.body[i][j * nv + v]);
      }),
    );
    return m;
  };
  const fa = flat(a);
  const fb = flat(b);
  if (fa.size !== fb.size) return false;
  for (const [k, v] of fa) {
    if (!fb.has(k)) return false;
    const w = fb.get(k)!;
    if (v === null || w === null ? v !== w : Math.abs(v - w) > 1e-6 * Math.max(1, Math.abs(w))) return false;
  }
  return true;
}

/** Ligne dont la (première) valeur est la plus grande (hors total). */
export function topRow(p: PivotResult): string {
  let best = -Infinity;
  let label = '';
  p.rowKeys.forEach((k, i) => {
    const v = p.body[i][p.body[i].length - p.valueLabels.length] ?? -Infinity;
    if (v > best) {
      best = v;
      label = k.join(' / ');
    }
  });
  return label;
}

/** Valeur d'une ligne donnée, colonne « Total général », 1re valeur. */
export function rowTotal(p: PivotResult, row: string): number | null {
  const i = p.rowKeys.findIndex((k) => k.join(' / ') === row);
  if (i < 0) return null;
  return p.body[i][p.body[i].length - p.valueLabels.length];
}
