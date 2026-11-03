import type { Workbook } from 'exceljs';
import { SheetSetup } from '../data/datasets';
import { SheetModel } from '../engine/engine';
import { Fmt, isErrorValue } from '../engine/format';
import { parseAddr, translateFormula } from '../engine/formula';
import { Lang } from '../engine/lang';

const NUMFMT: Record<Fmt, string | undefined> = {
  general: undefined,
  eur: '#,##0.00 "€"',
  pct: '0.0%',
  date: 'dd/mm/yyyy',
  int: '#,##0',
  dec2: '0.00',
};

async function newWorkbook(): Promise<Workbook> {
  const mod = await import('exceljs');
  const ExcelJS = (mod as unknown as { default?: typeof mod }).default ?? mod;
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Excel Coach';
  wb.calcProperties.fullCalcOnLoad = true;
  return wb;
}

const DATE_RE = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const toDate = (s: string) => {
  const m = DATE_RE.exec(s)!;
  return new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])));
};

type Cellish = { value: unknown; numFmt?: string };

/** Valeur ExcelJS pour une saisie « brute » (formules en anglais, sans le =). */
function cellValue(raw: string | number | boolean, lang: Lang, computed?: unknown): Cellish {
  if (typeof raw !== 'string') return { value: raw };
  if (raw.startsWith('=')) {
    const formula = translateFormula(raw, lang, 'en').slice(1);
    const result = computed === null || computed === undefined || isErrorValue(computed) ? undefined : computed;
    return { value: result === undefined ? { formula } : { formula, result } };
  }
  if (DATE_RE.test(raw)) return { value: toDate(raw), numFmt: 'dd/mm/yyyy' };
  const pct = /^(-?\d+(?:[.,]\d+)?)%$/.exec(raw);
  if (pct) return { value: Number(pct[1].replace(',', '.')) / 100, numFmt: '0%' };
  const num = lang === 'fr' ? /^-?\d+(,\d+)?$/ : /^-?\d+(\.\d+)?$/;
  if (num.test(raw)) return { value: Number(raw.replace(',', '.')) };
  return { value: raw.startsWith("'") ? raw.slice(1) : raw };
}

interface SheetSpec {
  name: string;
  /** Jeu de données d'un exercice (formules en anglais) */
  setup?: SheetSetup;
  /** Ou la feuille de l'élève, avec ses formules */
  model?: SheetModel;
}

/** Construit un classeur .xlsx (formules conservées, écrites en anglais comme le veut le format). */
export async function buildXlsx(sheets: SheetSpec[]): Promise<ArrayBuffer> {
  const wb = await newWorkbook();
  for (const s of sheets) {
    const ws = wb.addWorksheet(s.name.slice(0, 31));
    const entries: { a: { row: number; col: number }; raw: string | number | boolean; fmt?: Fmt; computed?: unknown }[] = [];
    if (s.setup) {
      for (const [k, v] of Object.entries(s.setup.cells)) entries.push({ a: parseAddr(k), raw: v, fmt: s.setup.fmts[k] });
      for (const [c, w] of Object.entries(s.setup.colWidths)) ws.getColumn(Number(c) + 1).width = Math.round(w / 7);
    }
    if (s.model) {
      for (const [k, v] of s.model.raw) {
        const [row, col] = k.split(',').map(Number);
        entries.push({ a: { row, col }, raw: v, fmt: s.model.fmt(row, col), computed: s.model.value(row, col) });
      }
    }
    for (const e of entries) {
      if (e.raw === '') continue;
      const lang: Lang = s.model ? s.model.lang : 'en';
      const cv = cellValue(e.raw, lang, e.computed);
      const cell = ws.getCell(e.a.row + 1, e.a.col + 1);
      cell.value = cv.value as never;
      const nf = (e.fmt && NUMFMT[e.fmt]) ?? cv.numFmt;
      if (nf) cell.numFmt = nf;
      if (e.a.row === 0) cell.font = { bold: true };
    }
    if (!s.setup) ws.columns.forEach((c) => (c.width = 14));
  }
  return (await wb.xlsx.writeBuffer()) as ArrayBuffer;
}

export function download(buf: ArrayBuffer, fileName: string) {
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
