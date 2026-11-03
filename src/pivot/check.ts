import { CheckResult } from '../exercises/checker';
import { PivotExercise, PivotSpec } from '../exercises/types';
import { computePivot, samePivot } from './pivot';

export function checkPivot(ex: PivotExercise, spec: PivotSpec, answer?: string): CheckResult {
  const ds = ex.dataset();
  const goal = ex.goal;
  const msg = (when: PivotExercise['mistakes'][number]['when'], fallback: string) => ex.mistakes.find((m) => m.when === when)?.message ?? fallback;
  const ko = (m: string): CheckResult => ({ ok: false, messages: [m], cells: {} });
  if (!spec.values.length) return ko('Ta zone **Valeurs** est vide : glisse-y le champ à calculer (un montant, une prime…).');
  const same = samePivot(computePivot(ds, spec), computePivot(ds, goal));
  if (!same) {
    const eqSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));
    if (eqSet(spec.rows, goal.cols) && eqSet(spec.cols, goal.rows) && goal.rows.length + goal.cols.length > 0 && !eqSet(spec.rows, goal.rows))
      return ko(msg('rows-cols-swapped', 'Tes champs Lignes et Colonnes sont inversés.'));
    const sameFields = eqSet(spec.rows, goal.rows) && eqSet(spec.cols, goal.cols) && eqSet(spec.values.map((v) => v.field), goal.values.map((v) => v.field));
    if (sameFields && goal.filters.length && !spec.filters.length) return ko(msg('missing-filter', 'Il manque un filtre.'));
    if (sameFields && spec.values.some((v, i) => goal.values.find((g) => g.field === v.field)?.agg !== v.agg && i >= 0))
      return ko(msg('wrong-agg', 'Le calcul des valeurs n’est pas le bon (Somme, Nombre ou Moyenne ?).'));
    if (!eqSet(spec.values.map((v) => v.field), goal.values.map((v) => v.field))) return ko(msg('wrong-field', 'Le champ dans Valeurs n’est pas le bon.'));
    if (!eqSet(spec.rows, goal.rows)) return ko('Le champ dans **Lignes** n’est pas celui demandé.');
    if (!eqSet(spec.cols, goal.cols)) return ko('Le champ dans **Colonnes** n’est pas celui demandé.');
    return ko('Ton TCD ne donne pas le résultat attendu : vérifie les filtres (valeurs cochées).');
  }
  if (ex.question) {
    const norm = (s: string) => s.trim().toLowerCase().replace(/[\s  €]/g, '').replace(',', '.');
    if (!answer || norm(answer) !== norm(ex.question.answer)) return ko('Ton TCD est juste ! Mais la réponse à la question n’est pas la bonne : lis-la dans ton tableau.');
  }
  return { ok: true, messages: [], cells: {} };
}
