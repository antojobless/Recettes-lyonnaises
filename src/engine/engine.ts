import { ConfigParams, HyperFormula } from 'hyperformula';
import { registerCustomFunctions } from './customFunctions';
import { Fmt, formatValue, isErrorValue } from './format';
import { addr, parseAddr, translateFormula } from './formula';
import { BOOL, frFR, Lang } from './lang';
import { explainError } from './errors';

let registered = false;
function ensureRegistered() {
  if (registered) return;
  registered = true;
  if (!HyperFormula.getRegisteredLanguagesCodes().includes('frFR')) HyperFormula.registerLanguage('frFR', frFR);
  registerCustomFunctions();
}

export function hfConfig(lang: Lang): Partial<ConfigParams> {
  const common: Partial<ConfigParams> = {
    licenseKey: 'gpl-v3',
    dateFormats: ['DD/MM/YYYY', 'DD/MM/YY'],
    currencySymbol: ['€'],
    evaluateNullToZero: true,
    // Excel distingue « Gagné » de « Gagne » (mais pas les majuscules).
    accentSensitive: true,
  };
  return lang === 'fr'
    ? { ...common, language: 'frFR', functionArgSeparator: ';', decimalSeparator: ',', thousandSeparator: ' ', arrayColumnSeparator: ';', arrayRowSeparator: '|', localeLang: 'fr-FR' }
    : { ...common, language: 'enGB', functionArgSeparator: ',', decimalSeparator: '.', thousandSeparator: '', arrayColumnSeparator: ',', arrayRowSeparator: ';', localeLang: 'en-GB' };
}

export const key = (row: number, col: number) => `${row},${col}`;

/** Contenu brut d'une feuille : adresse « A1 » → saisie (formule ou valeur). */
export type SheetInit = Record<string, string | number | boolean>;

export interface CellInfo {
  raw: string;
  value: unknown;
  display: string;
  isFormula: boolean;
  error?: { type: string; text: string; explanation: string };
}

/** Écrit un nombre ou un booléen comme on le taperait dans la langue donnée. */
export function literal(v: string | number | boolean, lang: Lang): string {
  if (typeof v === 'number') return lang === 'fr' ? String(v).replace('.', ',') : String(v);
  if (typeof v === 'boolean') return v ? BOOL[lang].true : BOOL[lang].false;
  return v;
}

/**
 * Une feuille de calcul : les saisies brutes (source de vérité) + un moteur
 * HyperFormula qui calcule. Les saisies sont stockées dans la langue courante.
 */
export class SheetModel {
  lang: Lang;
  hf!: HyperFormula;
  raw = new Map<string, string>();
  fmts = new Map<string, Fmt>();
  version = 0;

  constructor(lang: Lang, init: SheetInit = {}, fmts: Record<string, Fmt> = {}) {
    ensureRegistered();
    this.lang = lang;
    for (const [a, v] of Object.entries(init)) {
      const { row, col } = parseAddr(a);
      const raw = literal(v, lang);
      if (raw !== '') this.raw.set(key(row, col), raw);
    }
    for (const [a, f] of Object.entries(fmts)) {
      const { row, col } = parseAddr(a);
      this.fmts.set(key(row, col), f);
    }
    this.rebuild();
  }

  private rebuild() {
    this.hf?.destroy();
    this.hf = HyperFormula.buildEmpty(hfConfig(this.lang));
    this.hf.addSheet('Feuil1');
    const b = BOOL[this.lang];
    this.hf.addNamedExpression(b.true, `=${b.true}()`);
    this.hf.addNamedExpression(b.false, `=${b.false}()`);
    this.hf.batch(() => {
      for (const [k, v] of this.raw) {
        const [row, col] = k.split(',').map(Number);
        this.hf.setCellContents({ sheet: 0, row, col }, v);
      }
    });
    this.version++;
  }

  getRaw(row: number, col: number): string {
    return this.raw.get(key(row, col)) ?? '';
  }

  /** Modifie plusieurs cellules d'un coup. */
  setMany(cells: { row: number; col: number; raw: string }[]) {
    this.hf.batch(() => {
      for (const { row, col, raw } of cells) {
        if (raw === '') this.raw.delete(key(row, col));
        else this.raw.set(key(row, col), raw);
        this.hf.setCellContents({ sheet: 0, row, col }, raw === '' ? null : raw);
      }
    });
    this.version++;
  }

  set(row: number, col: number, raw: string) {
    this.setMany([{ row, col, raw }]);
  }

  setAt(a: string, raw: string) {
    const { row, col } = parseAddr(a);
    this.set(row, col, raw);
  }

  value(row: number, col: number): unknown {
    const v = this.hf.getCellValue({ sheet: 0, row, col });
    return v;
  }

  valueAt(a: string): unknown {
    const { row, col } = parseAddr(a);
    return this.value(row, col);
  }

  fmt(row: number, col: number): Fmt | undefined {
    return this.fmts.get(key(row, col));
  }

  info(row: number, col: number): CellInfo {
    const raw = this.getRaw(row, col);
    const value = raw === '' ? null : this.value(row, col);
    const detailed = raw === '' ? undefined : this.hf.getCellValueDetailedType({ sheet: 0, row, col });
    const display = raw === '' ? '' : formatValue(value, this.fmt(row, col), detailed, this.lang);
    const info: CellInfo = { raw, value, display, isFormula: raw.startsWith('=') };
    if (isErrorValue(value)) {
      const ev = value as { type: string; message?: string };
      info.error = { type: ev.type, text: display, explanation: explainError(ev.type, raw, this.lang, ev.message) };
    }
    return info;
  }

  /** Change la langue : toutes les formules sont traduites. */
  setLang(lang: Lang) {
    if (lang === this.lang) return;
    const from = this.lang;
    for (const [k, v] of this.raw) {
      if (v.startsWith('=')) this.raw.set(k, translateFormula(v, from, lang));
      else if (/^-?\d+([.,]\d+)?%?$/.test(v)) this.raw.set(k, v.replace(from === 'fr' ? ',' : '.', lang === 'fr' ? ',' : '.'));
      else if (/^(VRAI|FAUX|TRUE|FALSE)$/i.test(v)) this.raw.set(k, /^(VRAI|TRUE)$/i.test(v) ? BOOL[lang].true : BOOL[lang].false);
    }
    this.lang = lang;
    this.rebuild();
  }

  snapshot(): Map<string, string> {
    return new Map(this.raw);
  }

  restore(snap: Map<string, string>) {
    this.raw = new Map(snap);
    this.rebuild();
  }

  /** Taille utile (dernière ligne / colonne non vide), 0-based. */
  extent(): { rows: number; cols: number } {
    let rows = 0;
    let cols = 0;
    for (const k of this.raw.keys()) {
      const [r, c] = k.split(',').map(Number);
      rows = Math.max(rows, r + 1);
      cols = Math.max(cols, c + 1);
    }
    return { rows, cols };
  }

  destroy() {
    this.hf.destroy();
  }
}

export { addr };
