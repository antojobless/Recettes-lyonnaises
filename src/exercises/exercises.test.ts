import { describe, expect, it } from 'vitest';
import { literal } from '../engine/engine';
import { parseAddr, shiftFormula, translateFormula } from '../engine/formula';
import { Lang } from '../engine/lang';
import { checkFormula, checkSelect, expandTarget, modelFromSetup } from './checker';
import { ALL_EXERCISES, MODULES } from './index';
import { FormulaExercise, SelectExercise } from './types';

/** Simule l'élève : écrit des formules (anglais) dans la langue choisie, recopiées comme avec la poignée. */
function play(ex: FormulaExercise, formulas: (string | undefined)[], lang: Lang) {
  const m = modelFromSetup(ex.setup(), lang);
  const cells: { row: number; col: number; raw: string }[] = [];
  ex.targets.forEach((t, i) => {
    const f = formulas[i] ?? (t.value !== undefined ? literal(t.value, 'en') : '');
    const local = f.startsWith('=') ? translateFormula(f, 'en', lang) : literal(/^-?\d+(\.\d+)?$/.test(f) ? Number(f) : f, lang);
    const a = parseAddr(t.cell);
    for (const x of expandTarget(t)) {
      const p = parseAddr(x);
      cells.push({ ...p, raw: shiftFormula(local, p.row - a.row, p.col - a.col, lang) });
    }
  });
  m.setMany(cells);
  return m;
}

describe('structure des modules', () => {
  it.each(MODULES.map((m) => [m.id, m] as const))('module %i : ≤ 5 écrans, 6 à 10 exercices, ids uniques', (_id, m) => {
    expect(m.lesson.length).toBeLessThanOrEqual(5);
    expect(m.exercises.length).toBeGreaterThanOrEqual(6);
    expect(m.exercises.length).toBeLessThanOrEqual(10);
  });
  it('ids uniques', () => {
    const ids = ALL_EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

const formulaEx = ALL_EXERCISES.filter((e): e is FormulaExercise => e.kind === 'formula');
const selectEx = ALL_EXERCISES.filter((e): e is SelectExercise => e.kind === 'select');

describe.each(formulaEx.map((e) => [e.id, e] as const))('exercice %s', (_id, ex) => {
  const sol = ex.targets.map((t) => t.solution);
  for (const lang of ['fr', 'en'] as const) {
    it(`la solution est acceptée (${lang})`, () => {
      const r = checkFormula(ex, play(ex, sol, lang));
      expect(r.messages).toEqual([]);
      expect(r.ok).toBe(true);
    });
  }
  it('la solution ne renvoie pas d’erreur', () => {
    const m = play(ex, sol, 'fr');
    for (const t of ex.targets)
      for (const x of expandTarget(t)) {
        const p = parseAddr(x);
        expect(m.info(p.row, p.col).error, `${x}`).toBeUndefined();
      }
  });
  it('au moins une erreur typique est refusée avec son message', () => {
    expect(ex.mistakes.length).toBeGreaterThan(0);
    for (const mk of ex.mistakes) {
      const r = checkFormula(ex, play(ex, mk.formulas, 'fr'));
      expect(r.ok, mk.formulas.join(' ')).toBe(false);
      expect(r.messages[0]).toBe(mk.message);
    }
  });
  if (ex.targets.every((t) => t.requireFormula !== false)) {
    it('une valeur tapée à la main est refusée', () => {
      const good = play(ex, sol, 'fr');
      const t = ex.targets[0];
      const p = parseAddr(t.cell);
      const v = good.value(p.row, p.col);
      const typed = play(ex, sol, 'fr');
      typed.set(p.row, p.col, literal(typeof v === 'number' || typeof v === 'boolean' ? v : String(v), 'fr'));
      const r = checkFormula(ex, typed);
      expect(r.ok).toBe(false);
      expect(r.messages[0]).toContain('à la main');
    });
  }
});

describe.each(selectEx.map((e) => [e.id, e] as const))('exercice %s', (_id, ex) => {
  it('la bonne sélection est acceptée', () => expect(checkSelect(ex, ex.expected).ok).toBe(true));
  it('l’erreur typique est refusée', () => {
    for (const mk of ex.mistakes) {
      const r = checkSelect(ex, mk.selection);
      expect(r.ok).toBe(false);
      expect(r.messages[0]).toBe(mk.message);
    }
  });
});
