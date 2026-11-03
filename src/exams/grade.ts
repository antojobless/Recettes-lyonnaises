import { SheetModel } from '../engine/engine';
import { formatValue } from '../engine/format';
import { parseAddr } from '../engine/formula';
import { checkFormula, expectedValues } from '../exercises/checker';
import { FormulaExercise, PivotSpec } from '../exercises/types';
import { computePivot, samePivot } from '../pivot/pivot';
import { ExamQuestion, ExamSubject } from './subjects';

export interface QuestionResult {
  id: string;
  ok: boolean;
  got: string;
  expected: string;
  formula: string;
  message: string;
}

/** L'exercice « formule » qui correspond à une question de test (sans fonction imposée). */
export function questionExercise(s: ExamSubject, q: ExamQuestion): FormulaExercise {
  return {
    id: `${s.id}-${q.id}`,
    module: -1,
    kind: 'formula',
    title: q.text,
    instruction: q.text,
    notions: [],
    hint2: '',
    setup: s.setup,
    targets: [{ cell: q.cell!, solution: q.solution!, fmt: q.fmt }],
    mistakes: [],
  };
}

const norm = (x: string) => x.trim().toLowerCase().replace(/[\s  €]/g, '').replace(',', '.');

export function gradeExam(s: ExamSubject, model: SheetModel, pivot: PivotSpec, pivotAnswer: string): QuestionResult[] {
  return s.questions.map((q) => {
    if (q.pivot) {
      const ds = s.dataset();
      const tcdOk = pivot.values.length > 0 && samePivot(computePivot(ds, pivot), computePivot(ds, q.pivot.goal));
      const ansOk = norm(pivotAnswer) === norm(q.pivot.answer);
      const ok = ansOk;
      return {
        id: q.id,
        ok,
        got: pivotAnswer || '(vide)',
        expected: q.pivot.answer,
        formula: '',
        message: ok
          ? tcdOk
            ? 'TCD juste et bonne réponse.'
            : 'Bonne réponse (ton TCD final ne correspond pas exactement à celui attendu, vérifie-le).'
          : tcdOk
            ? 'Ton TCD est juste, mais la réponse saisie ne correspond pas : relis le tableau.'
            : 'Le TCD attendu : ' + describePivot(q.pivot.goal),
      };
    }
    const ex = questionExercise(s, q);
    const exp = expectedValues(ex);
    const p = parseAddr(q.cell!);
    const r = checkFormula(ex, model, exp);
    const info = model.info(p.row, p.col);
    const e = exp.get(q.cell!);
    return {
      id: q.id,
      ok: r.ok,
      got: info.raw === '' ? '(vide)' : info.display,
      expected: formatValue(e, q.fmt, undefined, model.lang),
      formula: info.raw,
      message: r.ok ? '' : r.messages[0],
    };
  });
}

export function describePivot(g: PivotSpec): string {
  const parts = [];
  if (g.filters.length) parts.push(`Filtres : ${g.filters.map((f) => `${f.field} = ${f.values.join(', ')}`).join(' ; ')}`);
  if (g.rows.length) parts.push(`Lignes : ${g.rows.join(', ')}`);
  if (g.cols.length) parts.push(`Colonnes : ${g.cols.join(', ')}`);
  parts.push(`Valeurs : ${g.values.map((v) => `${{ sum: 'Somme', count: 'Nombre', avg: 'Moyenne' }[v.agg]} de ${v.field}`).join(', ')}`);
  return parts.join(' · ');
}
