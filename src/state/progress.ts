import { Lang } from '../engine/lang';

export interface ExRecord {
  solved: boolean;
  /** Meilleur score : 1 sans indice, puis 0,75 / 0,5 / 0,25 selon le nombre d'indices */
  score: number;
  attempts: number;
  last: string;
}
export interface NotionRecord {
  /** 0 = à revoir demain ; 1 → 3 jours ; 2 → 7 jours ; 3 → 14 jours */
  box: number;
  due: string;
  last: string;
}
export interface TestRecord {
  subject: string;
  date: string;
  score: number;
  max: number;
  seconds: number;
  perQuestion: { id: string; ok: boolean; seconds: number }[];
}
export interface DailySession {
  date: string;
  /** Exercices de la séance, dans l'ordre */
  items: { id: string; kind: 'new' | 'review' }[];
  /** Mini-test chronométré de fin de séance */
  test: string[];
  testSeconds: number;
  done: Record<string, boolean>;
  testResult?: { score: number; max: number; seconds: number };
}
export interface Progress {
  v: 1;
  session?: DailySession;
  lang: Lang;
  langChosen: boolean;
  ex: Record<string, ExRecord>;
  notions: Record<string, NotionRecord>;
  days: string[];
  tests: TestRecord[];
  lessons: Record<string, boolean>;
}

export const STORAGE_KEY = 'excel-coach-progress-v1';

export function emptyProgress(): Progress {
  return { v: 1, lang: 'fr', langChosen: false, ex: {}, notions: {}, days: [], tests: [], lessons: {} };
}

export function today(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function addDays(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number);
  return today(new Date(y, m - 1, d + n));
}

export const INTERVALS = [1, 3, 7, 14];
export const hintScore = (hints: number) => [1, 0.75, 0.5, 0.25][Math.min(hints, 3)];

/** Valide un objet importé (JSON) et le complète si besoin. Lève une erreur si ce n'est pas une progression. */
export function sanitize(raw: unknown): Progress {
  if (!raw || typeof raw !== 'object' || (raw as Progress).v !== 1) throw new Error('Ce fichier n’est pas une progression Excel Coach.');
  const p = raw as Partial<Progress>;
  const base = emptyProgress();
  return {
    ...base,
    ...p,
    lang: p.lang === 'en' ? 'en' : 'fr',
    ex: { ...(p.ex ?? {}) },
    notions: { ...(p.notions ?? {}) },
    days: Array.isArray(p.days) ? p.days.filter((d) => typeof d === 'string') : [],
    tests: Array.isArray(p.tests) ? p.tests : [],
    lessons: { ...(p.lessons ?? {}) },
  } as Progress;
}

export function load(): Progress {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? sanitize(JSON.parse(s)) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function save(p: Progress): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}

function markDay(p: Progress, day: string): string[] {
  return p.days.includes(day) ? p.days : [...p.days, day].sort();
}

/** Une mauvaise réponse : les notions reviennent dès demain. */
export function recordFailure(p: Progress, exId: string, notions: string[], day = today()): Progress {
  const prev = p.ex[exId];
  const ns = { ...p.notions };
  for (const n of notions) ns[n] = { box: 0, due: addDays(day, 1), last: day };
  return {
    ...p,
    ex: { ...p.ex, [exId]: { solved: prev?.solved ?? false, score: prev?.score ?? 0, attempts: (prev?.attempts ?? 0) + 1, last: day } },
    notions: ns,
    days: markDay(p, day),
  };
}

/**
 * Un exercice réussi. S'il a fallu la réponse complète (indice 3), la notion
 * compte comme ratée (retour demain). Sinon : 3 jours, puis 7, puis 14.
 */
export function recordSuccess(p: Progress, exId: string, notions: string[], hints: number, day = today()): Progress {
  const prev = p.ex[exId];
  const score = hintScore(hints);
  const ns = { ...p.notions };
  for (const n of notions) {
    const box = hints >= 3 ? 0 : Math.min((ns[n]?.box ?? 0) + 1, 3);
    ns[n] = { box, due: addDays(day, INTERVALS[box]), last: day };
  }
  return {
    ...p,
    ex: { ...p.ex, [exId]: { solved: true, score: Math.max(prev?.score ?? 0, score), attempts: (prev?.attempts ?? 0) + 1, last: day } },
    notions: ns,
    days: markDay(p, day),
  };
}

/** Nombre de jours d'entraînement consécutifs jusqu'à aujourd'hui (ou hier). */
export function streak(p: Progress, day = today()): number {
  const set = new Set(p.days);
  let d = set.has(day) ? day : addDays(day, -1);
  let n = 0;
  while (set.has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}
