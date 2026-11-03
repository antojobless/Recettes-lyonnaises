import { BOOL, canonicalName, DEC, ERRORS_EN, ERRORS_FR, Lang, localName, SEP } from './lang';

export type TokType = 'str' | 'num' | 'ref' | 'func' | 'name' | 'bool' | 'err' | 'sep' | 'ws' | 'op' | 'other';
export interface Token {
  type: TokType;
  text: string;
  start: number;
}

const REF_RE = /^(\$?)([A-Za-z]{1,3})(\$?)(\d+)$/;

/** Découpe une formule (avec ou sans « = ») en jetons. */
export function tokenize(src: string, lang: Lang): Token[] {
  const out: Token[] = [];
  const dec = DEC[lang];
  const sep = SEP[lang];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    const start = i;
    if (c === '"') {
      i++;
      while (i < src.length) {
        if (src[i] === '"') {
          if (src[i + 1] === '"') i += 2;
          else {
            i++;
            break;
          }
        } else i++;
      }
      out.push({ type: 'str', text: src.slice(start, i), start });
    } else if (/\s/.test(c)) {
      while (i < src.length && /\s/.test(src[i])) i++;
      out.push({ type: 'ws', text: src.slice(start, i), start });
    } else if (/\d/.test(c) || (c === dec && /\d/.test(src[i + 1] ?? ''))) {
      while (i < src.length && /\d/.test(src[i])) i++;
      if (src[i] === dec && /\d/.test(src[i + 1] ?? '')) {
        i++;
        while (i < src.length && /\d/.test(src[i])) i++;
      }
      // Une référence comme 1:1 n'est pas gérée ; un nombre reste un nombre.
      out.push({ type: 'num', text: src.slice(start, i), start });
    } else if (c === '#') {
      const m = /^#(N\/A|DIV\/0!|[A-Za-zÀ-ÿ]+[!?]?)/.exec(src.slice(i));
      const len = m ? m[0].length : 1;
      i += len;
      out.push({ type: m ? 'err' : 'other', text: src.slice(start, i), start });
    } else if (/[A-Za-z_$À-ÿ]/.test(c)) {
      while (i < src.length && /[A-Za-z0-9_.$À-ÿ]/.test(src[i])) i++;
      const text = src.slice(start, i);
      let j = i;
      while (j < src.length && src[j] === ' ') j++;
      const isCall = src[j] === '(';
      let type: TokType = 'name';
      if (isCall) type = 'func';
      else if (REF_RE.test(text)) type = 'ref';
      else if (/^(VRAI|FAUX|TRUE|FALSE)$/i.test(text)) type = 'bool';
      out.push({ type, text, start });
    } else if (c === sep) {
      i++;
      out.push({ type: 'sep', text: c, start });
    } else {
      i++;
      out.push({ type: /[+\-*/^&=<>:%()]/.test(c) ? 'op' : 'other', text: c, start });
    }
  }
  return out;
}

export interface CellRef {
  row: number; // 0-based
  col: number; // 0-based
  absRow: boolean;
  absCol: boolean;
}

export function colName(col: number): string {
  let s = '';
  let n = col + 1;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export function colIndex(name: string): number {
  let n = 0;
  for (const ch of name.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

export function parseRef(text: string): CellRef | null {
  const m = REF_RE.exec(text);
  if (!m) return null;
  return { absCol: m[1] === '$', col: colIndex(m[2]), absRow: m[3] === '$', row: parseInt(m[4], 10) - 1 };
}

export function refToString(r: CellRef): string {
  return `${r.absCol ? '$' : ''}${colName(r.col)}${r.absRow ? '$' : ''}${r.row + 1}`;
}

export function addr(row: number, col: number): string {
  return `${colName(col)}${row + 1}`;
}

/** « B4 » → {row:3,col:1} */
export function parseAddr(a: string): { row: number; col: number } {
  const r = parseRef(a);
  if (!r) throw new Error(`Adresse invalide : ${a}`);
  return { row: r.row, col: r.col };
}

export interface RefSpan {
  start: number; // position dans la chaîne
  end: number;
  from: CellRef;
  to: CellRef; // = from pour une cellule seule
}

/** Références (cellules et plages) présentes dans la formule, dans l'ordre. */
export function findRefs(src: string, lang: Lang): RefSpan[] {
  const toks = tokenize(src, lang).filter((t) => t.type !== 'ws');
  const spans: RefSpan[] = [];
  for (let k = 0; k < toks.length; k++) {
    const t = toks[k];
    if (t.type !== 'ref') continue;
    const from = parseRef(t.text)!;
    if (toks[k + 1]?.text === ':' && toks[k + 2]?.type === 'ref') {
      const t2 = toks[k + 2];
      spans.push({ start: t.start, end: t2.start + t2.text.length, from, to: parseRef(t2.text)! });
      k += 2;
    } else spans.push({ start: t.start, end: t.start + t.text.length, from, to: from });
  }
  return spans;
}

/** Fonctions utilisées (noms canoniques anglais). */
export function functionsUsed(src: string, lang: Lang): string[] {
  return tokenize(src, lang)
    .filter((t) => t.type === 'func')
    .map((t) => canonicalName(t.text, lang));
}

/**
 * Décale les références relatives (recopie). Une référence qui sort de la
 * feuille devient #REF!, comme dans Excel.
 */
export function shiftFormula(src: string, dRow: number, dCol: number, lang: Lang): string {
  if (!src.startsWith('=')) return src;
  let out = '';
  for (const t of tokenize(src, lang)) {
    if (t.type === 'ref') {
      const r = parseRef(t.text)!;
      const n: CellRef = { ...r, row: r.absRow ? r.row : r.row + dRow, col: r.absCol ? r.col : r.col + dCol };
      out += n.row < 0 || n.col < 0 ? '#REF!' : refToString(n);
    } else out += t.text;
  }
  return out;
}

/** Ordre de rotation d'Excel avec F4 / Cmd+T. */
function nextAbs(r: CellRef): CellRef {
  if (!r.absRow && !r.absCol) return { ...r, absRow: true, absCol: true };
  if (r.absRow && r.absCol) return { ...r, absCol: false };
  if (r.absRow && !r.absCol) return { ...r, absRow: false, absCol: true };
  return { ...r, absRow: false, absCol: false };
}

/**
 * Fait tourner A1 → $A$1 → A$1 → $A1 → A1 sur la référence sous le curseur
 * (ou juste avant). Si elle fait partie d'une plage, les deux bouts tournent.
 */
export function toggleAbsoluteAt(src: string, caret: number, lang: Lang): { text: string; caret: number } {
  const spans = findRefs(src, lang);
  const span = spans.find((s) => caret >= s.start && caret <= s.end);
  if (!span) return { text: src, caret };
  const a = nextAbs(span.from);
  let repl = refToString(a);
  if (span.to !== span.from) {
    const b = nextAbs(span.to);
    // On aligne le second bout sur le même type de blocage que le premier.
    const bb = { ...b, absRow: a.absRow, absCol: a.absCol };
    repl += ':' + refToString(bb);
  }
  const text = src.slice(0, span.start) + repl + src.slice(span.end);
  return { text, caret: span.start + repl.length };
}

/** Traduit une formule d'une langue à l'autre (noms, séparateurs, décimales, VRAI/FAUX, erreurs). */
export function translateFormula(src: string, from: Lang, to: Lang): string {
  if (from === to || !src.startsWith('=')) return src;
  const errFrom = from === 'fr' ? ERRORS_FR : ERRORS_EN;
  const errTo = to === 'fr' ? ERRORS_FR : ERRORS_EN;
  let out = '';
  for (const t of tokenize(src, from)) {
    switch (t.type) {
      case 'func':
        out += localName(canonicalName(t.text, from), to);
        break;
      case 'sep':
        out += SEP[to];
        break;
      case 'num':
        out += t.text.replace(DEC[from], DEC[to]);
        break;
      case 'bool': {
        const isTrue = /^(VRAI|TRUE)$/i.test(t.text);
        out += isTrue ? BOOL[to].true : BOOL[to].false;
        break;
      }
      case 'err': {
        const key = Object.keys(errFrom).find((k) => errFrom[k].toUpperCase() === t.text.toUpperCase());
        out += key ? errTo[key] : t.text;
        break;
      }
      default:
        out += t.text;
    }
  }
  return out;
}

/** Position où l'on peut insérer une référence en cliquant (mode « pointage »). */
export function isPointable(src: string, caret: number, lang: Lang): boolean {
  if (!src.startsWith('=')) return false;
  const before = src.slice(0, caret).replace(/\s+$/, '');
  if (before.length === 0) return false;
  const last = before[before.length - 1];
  return ['=', '(', SEP[lang], '+', '-', '*', '/', '^', '&', '<', '>', ':'].includes(last);
}
