import { BOOL, ERRORS_EN, ERRORS_FR, Lang } from './lang';

export type Fmt = 'general' | 'eur' | 'pct' | 'date' | 'int' | 'dec2';

const DAY_MS = 86400000;
const EPOCH = Date.UTC(1899, 11, 30);

export function serialToDate(serial: number): Date {
  return new Date(EPOCH + Math.round(serial * DAY_MS));
}

export function dateToSerial(y: number, m: number, d: number): number {
  return Math.round((Date.UTC(y, m - 1, d) - EPOCH) / DAY_MS);
}

export function formatDate(serial: number): string {
  const d = serialToDate(serial);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

const locale = (lang: Lang) => (lang === 'fr' ? 'fr-FR' : 'en-GB');

export function formatNumber(n: number, fmt: Fmt, lang: Lang): string {
  const loc = locale(lang);
  switch (fmt) {
    case 'eur':
      return new Intl.NumberFormat(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' €';
    case 'pct':
      return new Intl.NumberFormat(loc, { style: 'percent', maximumFractionDigits: 2 }).format(n);
    case 'date':
      return formatDate(n);
    case 'int':
      return new Intl.NumberFormat(loc, { maximumFractionDigits: 0 }).format(n);
    case 'dec2':
      return new Intl.NumberFormat(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
    default: {
      if (n !== 0 && (Math.abs(n) >= 1e11 || Math.abs(n) < 1e-9)) return n.toExponential(4).replace('.', lang === 'fr' ? ',' : '.');
      const r = Number(n.toPrecision(10));
      return new Intl.NumberFormat(loc, { maximumFractionDigits: 9, useGrouping: false }).format(r);
    }
  }
}

export function detailedToFmt(detailed: string | undefined): Fmt | undefined {
  switch (detailed) {
    case 'NUMBER_DATE':
    case 'NUMBER_DATETIME':
      return 'date';
    case 'NUMBER_PERCENT':
      return 'pct';
    case 'NUMBER_CURRENCY':
      return 'eur';
    default:
      return undefined;
  }
}

export interface ErrorLike {
  type: string;
  message?: string;
}

export function isErrorValue(v: unknown): v is ErrorLike {
  return typeof v === 'object' && v !== null && 'type' in v && 'value' in v;
}

export function errorText(type: string, lang: Lang): string {
  return (lang === 'fr' ? ERRORS_FR : ERRORS_EN)[type] ?? '#ERREUR';
}

export function formatValue(v: unknown, fmt: Fmt | undefined, detailed: string | undefined, lang: Lang): string {
  if (v === null || v === undefined) return '';
  if (isErrorValue(v)) return errorText(v.type, lang);
  if (typeof v === 'boolean') return v ? BOOL[lang].true : BOOL[lang].false;
  if (typeof v === 'number') {
    const f = fmt && fmt !== 'general' ? fmt : detailedToFmt(detailed) ?? 'general';
    return formatNumber(v, f, lang);
  }
  return String(v);
}
