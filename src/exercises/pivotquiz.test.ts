import { describe, expect, it } from 'vitest';
import { checkPivot } from '../pivot/check';
import { checkQuiz } from '../ui/QuizPlayer';
import { ALL_EXERCISES } from './index';
import { PivotExercise, QuizExercise } from './types';

const pivots = ALL_EXERCISES.filter((e): e is PivotExercise => e.kind === 'pivot');
const quizzes = ALL_EXERCISES.filter((e): e is QuizExercise => e.kind === 'quiz');

describe.each(pivots.map((e) => [e.id, e] as const))('TCD %s', (_id, ex) => {
  it('le bon TCD (et la bonne réponse) est accepté', () => {
    expect(checkPivot(ex, ex.goal, ex.question?.answer).messages).toEqual([]);
  });
  it('une erreur typique est refusée avec son message', () => {
    const m = ex.mistakes[0];
    let spec = ex.goal;
    if (m.when === 'wrong-agg') spec = { ...ex.goal, values: ex.goal.values.map((v) => ({ ...v, agg: v.agg === 'sum' ? 'count' : 'sum' })) };
    if (m.when === 'missing-filter') spec = { ...ex.goal, filters: [] };
    if (m.when === 'rows-cols-swapped') spec = { ...ex.goal, rows: ex.goal.cols, cols: ex.goal.rows };
    if (m.when === 'wrong-field') spec = { ...ex.goal, values: [{ field: 'Prime annuelle', agg: 'sum' }] };
    const r = checkPivot(ex, spec, ex.question?.answer);
    expect(r.ok).toBe(false);
    expect(r.messages[0]).toBe(m.message);
  });
  if (ex.question)
    it('une mauvaise réponse à la question est refusée', () => {
      expect(checkPivot(ex, ex.goal, 'xyz').ok).toBe(false);
    });
  it('le fichier « Faire dans Excel » a des étapes', () => {
    expect(ex.excel.steps.some((s) => s.includes('Insertion'))).toBe(true);
  });
});

describe.each(quizzes.map((e) => [e.id, e] as const))('quiz %s', (_id, ex) => {
  it('bonne réponse acceptée, mauvaise refusée avec explication', () => {
    expect(checkQuiz(ex, ex.answer).ok).toBe(true);
    const wrong = ex.answer === 0 ? 1 : 0;
    const r = checkQuiz(ex, wrong);
    expect(r.ok).toBe(false);
    expect(r.messages[0]).toBe(ex.why[wrong]);
  });
});
